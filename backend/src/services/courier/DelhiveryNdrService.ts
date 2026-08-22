import { prisma } from '../../prisma';
import { ApiLogService } from '../logger/ApiLogService';

export interface SubmitNdrActionInput {
  companyId: string;
  ndrRecordId: string;
  action: 'REATTEMPT' | 'RTO' | 'UPDATE_ADDRESS' | 'UPDATE_PHONE';
  remarks?: string;
  consigneePhone?: string;
  consigneeAddress?: string;
  scheduledDate?: string; // YYYY-MM-DD
}

export interface NdrActionResult {
  success: boolean;
  ndrRecordId: string;
  awb: string;
  action: string;
  actionStatus: 'CONFIRMED' | 'FAILED' | 'DUPLICATE_IGNORED';
  delhiveryResponse?: any;
  error?: string;
  correlationId?: string;
}

export class DelhiveryNdrService {
  /**
   * Idempotently records an NDR event detected from tracking or webhook feeds.
   */
  static async recordNdrEvent(companyId: string, data: {
    shipmentId: string;
    awb: string;
    ndrCode?: string;
    ndrReason: string;
    attemptNumber?: number;
    eventTime: Date | string;
    rawStatus: string;
  }, correlationId?: string): Promise<any> {
    const eventTime = new Date(data.eventTime);
    const attemptNumber = data.attemptNumber || 1;
    const corrId = correlationId || `NDR-REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const shipment = await prisma.shipment.findFirst({
      where: { id: data.shipmentId, company_id: companyId }
    });

    if (!shipment) {
      throw new Error(`Shipment ${data.shipmentId} not found for company ${companyId}`);
    }

    // Idempotent upsert via unique index [shipment_id, attempt_number, event_time]
    const ndr = await prisma.ndrRecord.upsert({
      where: {
        shipment_id_attempt_number_event_time: {
          shipment_id: data.shipmentId,
          attempt_number: attemptNumber,
          event_time: eventTime
        }
      },
      update: {
        ndr_reason: data.ndrReason,
        raw_delhivery_status: data.rawStatus,
        updated_at: new Date()
      },
      create: {
        company_id: companyId,
        shipment_id: data.shipmentId,
        courier_id: shipment.courier_id,
        courier_account_id: shipment.courier_account_id,
        awb: data.awb,
        ndr_code: data.ndrCode || 'NDR_EX',
        ndr_reason: data.ndrReason,
        ndr_status: 'ACTION_REQUIRED',
        attempt_number: attemptNumber,
        event_time: eventTime,
        action_status: 'PENDING',
        correlation_id: corrId,
        raw_delhivery_status: data.rawStatus,
        internal_normalized_status: 'NDR'
      }
    });

    // Update shipment attempts & status
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        delivery_attempt: Math.max(shipment.delivery_attempt || 0, attemptNumber),
        exception_reason: data.ndrReason,
        internal_status: 'NDR',
        courier_status: data.rawStatus,
        updated_at: new Date()
      }
    });

    return ndr;
  }

  /**
   * Submits an NDR Action (REATTEMPT, RTO, UPDATE_ADDRESS) to Delhivery B2C NDR API.
   */
  static async submitNdrAction(input: SubmitNdrActionInput): Promise<NdrActionResult> {
    const corrId = `NDR-ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const startTime = Date.now();

    // 1. Fetch NDR Record & Tenant Validation
    const ndr = await prisma.ndrRecord.findFirst({
      where: { id: input.ndrRecordId, company_id: input.companyId },
      include: { shipment: true }
    });

    if (!ndr || !ndr.shipment) {
      return {
        success: false,
        ndrRecordId: input.ndrRecordId,
        awb: '',
        action: input.action,
        actionStatus: 'FAILED',
        error: 'NDR Record or Shipment not found or unauthorized tenant',
        correlationId: corrId
      };
    }

    // 2. Idempotency Check: If action already SUBMITTED or CONFIRMED, return existing confirmation cleanly
    if (ndr.action_status === 'SUBMITTED' || ndr.action_status === 'CONFIRMED') {
      return {
        success: true,
        ndrRecordId: ndr.id,
        awb: ndr.awb,
        action: ndr.selected_action || input.action,
        actionStatus: 'DUPLICATE_IGNORED',
        error: 'NDR action already confirmed previously',
        correlationId: corrId
      };
    }

    // 2b. Timeout Safety & Reconciliation Check: If in ACTION_SUBMISSION_UNKNOWN, reconcile first
    if (ndr.ndr_status === 'ACTION_SUBMISSION_UNKNOWN') {
      const rec = await this.reconcileNdrStatus(input.companyId, ndr.id);
      if (rec.actionStatus === 'CONFIRMED') {
        return {
          success: true,
          ndrRecordId: ndr.id,
          awb: ndr.awb,
          action: ndr.selected_action || input.action,
          actionStatus: 'CONFIRMED',
          delhiveryResponse: { message: 'Action verified via reconciliation after previous timeout' },
          correlationId: corrId
        };
      }
    }

    // 3. Atomically acquire lock on NDR record (Prisma transaction)
    const lockedNdr = await prisma.$transaction(async (tx) => {
      const current = await tx.ndrRecord.findUnique({ where: { id: ndr.id } });
      if (current?.action_status === 'SUBMITTED' || current?.action_status === 'CONFIRMED') {
        return null;
      }
      return await tx.ndrRecord.update({
        where: { id: ndr.id },
        data: {
          ndr_status: 'ACTION_SUBMITTED',
          selected_action: input.action,
          action_status: 'SUBMITTED',
          action_requested_at: new Date(),
          action_remarks: input.remarks,
          new_consignee_phone: input.consigneePhone,
          new_consignee_address: input.consigneeAddress,
          scheduled_reattempt_date: input.scheduledDate ? new Date(input.scheduledDate) : null,
          correlation_id: corrId
        }
      });
    });

    if (!lockedNdr) {
      return {
        success: true,
        ndrRecordId: ndr.id,
        awb: ndr.awb,
        action: input.action,
        actionStatus: 'DUPLICATE_IGNORED',
        correlationId: corrId
      };
    }

    // 4. Resolve Credentials
    const courier = await prisma.courierPartner.findFirst({
      where: { company_id: input.companyId, courier_id: 'DELHIVERY' }
    });

    let apiKey = process.env.DELHIVERY_STAGING_API_KEY || 'mock_token';
    let isMock = false;
    if (courier?.api_credentials) {
      try {
        const creds = JSON.parse(courier.api_credentials);
        apiKey = creds.api_key || creds.token || apiKey;
        isMock = creds.mode === 'mock';
      } catch (e) {}
    }

    const endpoint = isMock ? 'https://mock.delhivery.com/api/p/update/ndr'
      : (process.env.DELHIVERY_ENV === 'production'
        ? 'https://track.delhivery.com/api/p/update/ndr'
        : 'https://staging-express.delhivery.com/api/p/update/ndr');

    const payload = {
      waybill: ndr.awb,
      action: input.action,
      remarks: input.remarks || 'NDR action updated via LogiFlow',
      ...(input.consigneePhone ? { consignee_phone: input.consigneePhone } : {}),
      ...(input.consigneeAddress ? { consignee_address: input.consigneeAddress } : {}),
      ...(input.scheduledDate ? { scheduled_date: input.scheduledDate } : {})
    };

    try {
      let apiRes: any = { status: true, message: 'NDR action accepted successfully' };

      if (!isMock) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const httpRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!httpRes.ok) {
          const errText = await httpRes.text();
          throw new Error(`Delhivery NDR API returned HTTP ${httpRes.status}: ${errText}`);
        }
        apiRes = await httpRes.json();
      }

      // Mark CONFIRMED in DB
      await prisma.ndrRecord.update({
        where: { id: ndr.id },
        data: {
          ndr_status: 'ACTION_CONFIRMED',
          action_status: 'CONFIRMED',
          action_completed_at: new Date()
        }
      });

      await ApiLogService.log({
        companyId: input.companyId,
        courierId: 'DELHIVERY',
        shipmentId: ndr.shipment_id,
        operation: 'NDR',
        httpStatus: 200,
        success: true,
        requestMeta: { endpoint, payload, correlationId: corrId },
        responseMeta: apiRes,
        correlationId: corrId
      });

      return {
        success: true,
        ndrRecordId: ndr.id,
        awb: ndr.awb,
        action: input.action,
        actionStatus: 'CONFIRMED',
        delhiveryResponse: apiRes,
        correlationId: corrId
      };

    } catch (err: any) {
      console.error('[DelhiveryNdrService] API Error:', err.message);

      const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT') || err.message?.includes('ECONNRESET');

      if (isTimeout) {
        // TIMEOUT SAFETY: Set state to ACTION_SUBMISSION_UNKNOWN
        await prisma.ndrRecord.update({
          where: { id: ndr.id },
          data: {
            ndr_status: 'ACTION_SUBMISSION_UNKNOWN',
            action_status: 'UNKNOWN',
            action_remarks: `Timeout during dispatch: ${err.message}`
          }
        });

        await ApiLogService.log({
          companyId: input.companyId,
          courierId: 'DELHIVERY',
          shipmentId: ndr.shipment_id,
          operation: 'NDR',
          httpStatus: 408,
          success: false,
          errorCode: 'NDR_API_TIMEOUT',
          requestMeta: { endpoint, payload, correlationId: corrId },
          responseMeta: { error: 'Request timed out. Marked ACTION_SUBMISSION_UNKNOWN for safety.' },
          correlationId: corrId
        });

        return {
          success: false,
          ndrRecordId: ndr.id,
          awb: ndr.awb,
          action: input.action,
          actionStatus: 'FAILED',
          error: 'NDR Action timed out. Status set to ACTION_SUBMISSION_UNKNOWN. Run reconciliation before retrying.',
          correlationId: corrId
        };
      }

      // Revert status to FAILED for explicit 4xx/5xx API rejection
      await prisma.ndrRecord.update({
        where: { id: ndr.id },
        data: {
          ndr_status: 'ACTION_FAILED',
          action_status: 'FAILED'
        }
      });

      await ApiLogService.log({
        companyId: input.companyId,
        courierId: 'DELHIVERY',
        shipmentId: ndr.shipment_id,
        operation: 'NDR',
        httpStatus: err.response?.status || 500,
        success: false,
        errorCode: 'NDR_API_ERROR',
        requestMeta: { endpoint, payload, correlationId: corrId },
        responseMeta: { error: err.message, body: err.response?.data },
        correlationId: corrId
      });

      return {
        success: false,
        ndrRecordId: ndr.id,
        awb: ndr.awb,
        action: input.action,
        actionStatus: 'FAILED',
        error: err.message,
        correlationId: corrId
      };
    }
  }

  /**
   * Reconciles an NDR record in ACTION_SUBMISSION_UNKNOWN state by inspecting tracking scans.
   */
  static async reconcileNdrStatus(companyId: string, ndrRecordId: string, trackingScanOverride?: string): Promise<{ reconciled: boolean; actionStatus: string; message: string }> {
    const ndr = await prisma.ndrRecord.findFirst({
      where: { id: ndrRecordId, company_id: companyId },
      include: { shipment: true }
    });

    if (!ndr) {
      return { reconciled: false, actionStatus: 'FAILED', message: 'NDR Record not found' };
    }

    const currentStatus = trackingScanOverride || ndr.shipment?.courier_status || '';
    const statusUpper = currentStatus.toUpperCase();

    // Verification check: Did Delhivery process the action?
    const isActionAccepted = statusUpper.includes('REATTEMPT') || statusUpper.includes('RTO') || statusUpper.includes('UPDATED') || statusUpper.includes('SCHEDULED');

    if (isActionAccepted) {
      await prisma.ndrRecord.update({
        where: { id: ndr.id },
        data: {
          ndr_status: 'ACTION_CONFIRMED',
          action_status: 'CONFIRMED',
          action_completed_at: new Date()
        }
      });
      return {
        reconciled: true,
        actionStatus: 'CONFIRMED',
        message: 'Action verified as ACCEPTED by Delhivery tracking feed.'
      };
    } else {
      await prisma.ndrRecord.update({
        where: { id: ndr.id },
        data: {
          ndr_status: 'ACTION_FAILED',
          action_status: 'FAILED'
        }
      });
      return {
        reconciled: true,
        actionStatus: 'FAILED',
        message: 'Action verified as NOT processed by Delhivery. Safe to retry.'
      };
    }
  }

  /**
   * Recalculates commercial margins when RTO or NDR charges occur.
   */
  static async updateRtoCommercials(companyId: string, shipmentId: string, charges: {
    rtoCharge?: number;
    ndrCharge?: number;
    returnShippingCost?: number;
    otherCourierCost?: number;
  }): Promise<any> {
    const shipment = await prisma.shipment.findFirst({
      where: { id: shipmentId, company_id: companyId }
    });

    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    const forwardCost = shipment.forward_courier_cost ? Number(shipment.forward_courier_cost) : (shipment.courier_total_cost ? Number(shipment.courier_total_cost) : 0);
    const rtoCost = charges.rtoCharge || (shipment.rto_charge ? Number(shipment.rto_charge) : 0);
    const ndrCost = charges.ndrCharge || (shipment.ndr_charge ? Number(shipment.ndr_charge) : 0);
    const retShipCost = charges.returnShippingCost || (shipment.return_shipping_cost ? Number(shipment.return_shipping_cost) : 0);
    const otherCost = charges.otherCourierCost || (shipment.other_courier_cost ? Number(shipment.other_courier_cost) : 0);

    const courierTotalCost = forwardCost + rtoCost + ndrCost + retShipCost + otherCost;
    const clientCharge = shipment.client_total_charge ? Number(shipment.client_total_charge) : 0;

    // Commercial Rule: client_total_charge is NOT automatically increased
    const grossMargin = clientCharge - courierTotalCost;
    const marginPct = clientCharge > 0 ? (grossMargin / clientCharge) * 100 : 0;

    return await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        forward_courier_cost: forwardCost,
        rto_charge: rtoCost,
        ndr_charge: ndrCost,
        return_shipping_cost: retShipCost,
        other_courier_cost: otherCost,
        courier_total_cost: courierTotalCost,
        gross_margin: grossMargin,
        margin_percentage: marginPct,
        updated_at: new Date()
      }
    });
  }
}
