import { prisma } from '../../prisma';
import { ApiLogService } from '../logger/ApiLogService';
import { DelhiveryTrackingService } from './DelhiveryTrackingService';

export interface ProcessWebhookInput {
  headers: any;
  body: any;
  query: any;
}

export interface ProcessWebhookResult {
  success: boolean;
  httpStatus: number;
  message?: string;
  awb?: string;
  internalStatus?: string;
  eventInserted?: boolean;
  statusUpdated?: boolean;
  isDuplicate?: boolean;
  error?: string;
  correlationId?: string;
}

export class DelhiveryWebhookService {
  /**
   * Validates incoming webhook authentication headers & tokens.
   */
  static async validateWebhookSecret(headers: any, query: any, body: any, companyId?: string): Promise<{ valid: boolean; companyId?: string; error?: string }> {
    const tokenHeader = headers['x-delhivery-token'] || headers['x-webhook-secret'] || headers['authorization'] || query?.token || body?.Token;
    const tokenStr = typeof tokenHeader === 'string' ? tokenHeader.replace(/^Bearer\s+/i, '').replace(/^Token\s+/i, '').trim() : '';

    // If companyId is passed, check specific courier credentials
    if (companyId) {
      const courier = await prisma.courierPartner.findFirst({
        where: { company_id: companyId, courier_id: 'DELHIVERY' }
      });
      if (courier?.api_credentials) {
        try {
          const creds = JSON.parse(courier.api_credentials);
          const validSecret = creds.webhook_secret || creds.api_key || creds.apiKey || creds.token;
          if (creds.mode !== 'mock' && validSecret && tokenStr !== validSecret) {
            return { valid: false, error: 'Unauthorized: Invalid webhook secret token' };
          }
        } catch (e) {}
      }
      return { valid: true, companyId };
    }

    // Lookup company by matching token across courier accounts
    if (tokenStr) {
      const couriers = await prisma.courierPartner.findMany({
        where: { courier_id: 'DELHIVERY' }
      });
      for (const c of couriers) {
        if (c.api_credentials) {
          try {
            const creds = JSON.parse(c.api_credentials);
            const validSecret = creds.webhook_secret || creds.api_key || creds.apiKey || creds.token;
            if (validSecret === tokenStr) {
              return { valid: true, companyId: c.company_id };
            }
          } catch (e) {}
        }
      }
    }

    // Fallback: If no token configured or mock mode, allow request cleanly
    return { valid: true };
  }

  /**
   * Processes incoming Delhivery B2C webhook payload with strict idempotency and terminal protection.
   */
  static async processWebhook(input: ProcessWebhookInput): Promise<ProcessWebhookResult> {
    const correlationId = `DELH-WH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      const body = input.body || {};
      const payloadItems = Array.isArray(body) ? body : (body.ShipmentData || body.scans || [body]);

      let processedCount = 0;
      let lastResult: ProcessWebhookResult = {
        success: true, httpStatus: 200, message: 'Webhook received', correlationId
      };

      for (const rawItem of payloadItems) {
        const item = rawItem.ScanDetail || rawItem.Shipment || rawItem;
        const awb = String(item.Waybill || item.AWB || item.waybill || item.awb || '').trim();
        const refNo = String(item.RefNo || item.OrderNo || item.order || '').trim();
        const rawStatus = item.Status?.Status || item.Status || item.Scan || item.raw_status || '';
        const location = item.ScannedLocation || item.Location || item.StatusLocation || '';
        const eventTime = item.ScanDateTime || item.StatusDateTime || item.timestamp || new Date();
        const instructions = item.Instructions || item.Remarks || item.instructions || '';

        if (!awb && !refNo) continue;

        // 1. Resolve Shipment & Tenant Scoping
        const shipment = await prisma.shipment.findFirst({
          where: {
            OR: [
              { awb_number: awb },
              { client_reference_no: refNo }
            ]
          }
        });

        if (!shipment) {
          await ApiLogService.log({
            companyId: 'unknown',
            operation: 'WEBHOOK',
            httpStatus: 404,
            success: false,
            errorCode: 'SHIPMENT_NOT_FOUND',
            requestMeta: { awb, refNo, rawStatus, correlationId }
          });
          lastResult = {
            success: false,
            httpStatus: 404,
            error: `Shipment not found for AWB: ${awb || refNo}`,
            correlationId
          };
          continue;
        }

        // 2. Validate Secret against resolved Shipment company
        const authCheck = await this.validateWebhookSecret(input.headers, input.query, input.body, shipment.company_id);
        if (!authCheck.valid) {
          await ApiLogService.log({
            companyId: shipment.company_id,
            operation: 'WEBHOOK',
            httpStatus: 401,
            success: false,
            errorCode: 'UNAUTHORIZED_WEBHOOK_SECRET',
            requestMeta: { awb, correlationId }
          });
          return {
            success: false,
            httpStatus: 401,
            error: authCheck.error || 'Unauthorized webhook secret',
            correlationId
          };
        }

        // 3. Delegate to Tracking Engine for Idempotency & Terminal Protection
        const trkRes = await DelhiveryTrackingService.processTrackingEvent(shipment.company_id, {
          awb: shipment.awb_number,
          courierStatus: rawStatus,
          eventTime,
          location,
          instructions,
          rawStatus
        }, correlationId);

        // 4. Trigger Notifications ONLY IF status actually transitioned (Notification Duplication Protection)
        if (trkRes.statusUpdated) {
          console.log(`[Webhook Notification Trigger]: AWB ${shipment.awb_number} status updated -> ${trkRes.internalStatus}`);
          // Send notification / webhook callback to merchant app safely
        }

        processedCount++;
        lastResult = {
          success: true,
          httpStatus: 200,
          awb: shipment.awb_number,
          internalStatus: trkRes.internalStatus,
          eventInserted: trkRes.eventInserted,
          statusUpdated: trkRes.statusUpdated,
          isDuplicate: !trkRes.eventInserted,
          correlationId
        };
      }

      await ApiLogService.log({
        companyId: lastResult.awb ? 'multi-tenant' : 'system',
        operation: 'WEBHOOK',
        httpStatus: 200,
        success: true,
        requestMeta: { processedCount, correlationId },
        responseMeta: lastResult
      });

      return lastResult;

    } catch (err: any) {
      console.error('[DelhiveryWebhookService] Webhook Exception:', err);
      return {
        success: false,
        httpStatus: 500,
        error: err.message || 'Webhook processing exception',
        correlationId
      };
    }
  }
}
