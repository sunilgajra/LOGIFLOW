import { prisma } from '../../prisma';
import { ApiLogService } from '../logger/ApiLogService';

export interface TrackingScanInput {
  awb: string;
  courierStatus: string;
  eventTime: string | Date;
  location?: string;
  description?: string;
  rawStatus?: string;
  instructions?: string;
}

export interface ProcessTrackingResult {
  success: boolean;
  awb: string;
  internalStatus: string;
  courierStatus: string;
  isTerminal: boolean;
  eventInserted: boolean;
  statusUpdated: boolean;
  error?: string;
  correlationId?: string;
}

const TERMINAL_STATUSES = ['DELIVERED', 'RTO_DELIVERED', 'CANCELLED', 'LOST'];

export class DelhiveryTrackingService {
  /**
   * Normalizes Delhivery raw status string into standard LogiFlow internal status.
   */
  static normalizeStatus(courierStatus: string, scanType?: string): string {
    if (!courierStatus) return 'BOOKED';
    const s = courierStatus.trim().toUpperCase();
    const st = scanType ? scanType.trim().toUpperCase() : '';

    if (s.includes('RTO DELIVERED') || s.includes('RETURNED TO SELLER') || s.includes('RTO COMPLETED') || st === 'RTOD') {
      return 'RTO_DELIVERED';
    }
    if (s.includes('DELIVERED') || st === 'DL') {
      return 'DELIVERED';
    }
    if (s.includes('RTO') || s.includes('RETURN TO ORIGIN') || s.includes('RETURN IN TRANSIT') || st === 'RTO') {
      return 'RTO';
    }
    if (s.includes('UNDELIVERED') || s.includes('NDR') || s.includes('REFUSED') || s.includes('OUT OF STATION') || st === 'UD') {
      return 'NDR';
    }
    if (s.includes('OUT FOR DELIVERY') || s.includes('DISPATCHED FOR DELIVERY') || st === 'OFD') {
      return 'OUT_FOR_DELIVERY';
    }
    if (s.includes('IN TRANSIT') || s.includes('ARRIVED') || s.includes('REACHED HUB') || s.includes('BAGGED') || st === 'IT') {
      return 'IN_TRANSIT';
    }
    if (s.includes('PICKED UP') || s.includes('PICKUP COMPLETED') || s.includes('INBOUND AT') || st === 'PU') {
      return 'PICKED_UP';
    }
    if (s.includes('DISPATCHED FOR PICKUP') || s.includes('PICKUP SCHEDULED') || st === 'PUD') {
      return 'READY_TO_SHIP';
    }
    if (s.includes('CANCELLED') || s.includes('CANCELLATION')) {
      return 'CANCELLED';
    }
    if (s.includes('LOST') || s.includes('DAMAGED')) {
      return 'LOST';
    }
    if (s.includes('EXCEPTION') || s.includes('HELD AT HUB')) {
      return 'EXCEPTION';
    }

    return 'BOOKED';
  }

  /**
   * Processes single tracking scan event with strict idempotency, out-of-order protection, and multi-tenant isolation.
   */
  static async processTrackingEvent(
    companyId: string,
    scan: TrackingScanInput,
    correlationId?: string
  ): Promise<ProcessTrackingResult> {
    const corrId = correlationId || `TRK-EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      if (!scan.awb || scan.awb.trim() === '') {
        return { success: false, awb: scan.awb, internalStatus: 'UNKNOWN', courierStatus: '', isTerminal: false, eventInserted: false, statusUpdated: false, error: 'AWB is required', correlationId: corrId };
      }

      // 1. Fetch Shipment (Strict Multi-Tenant Scoping)
      const shipment = await prisma.shipment.findFirst({
        where: {
          awb_number: scan.awb.trim(),
          company_id: companyId
        }
      });

      if (!shipment) {
        return {
          success: false,
          awb: scan.awb,
          internalStatus: 'NOT_FOUND',
          courierStatus: scan.courierStatus,
          isTerminal: false,
          eventInserted: false,
          statusUpdated: false,
          error: `Shipment with AWB ${scan.awb} not found for company ${companyId}`,
          correlationId: corrId
        };
      }

      const eventTimeDate = new Date(scan.eventTime);
      const internalStatus = this.normalizeStatus(scan.courierStatus);
      const isTerminal = TERMINAL_STATUSES.includes(internalStatus);

      // 2. Insert Immutable Tracking Event (Idempotent via Composite Unique Index)
      const eventId = `trkevt-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const insertResult = await prisma.$queryRaw<any[]>`
        INSERT INTO "TrackingEvent" (
          "id", "shipment_id", "company_id", "courier_account_id", "awb",
          "courier_status", "internal_status", "event_time", "location",
          "description", "raw_status", "correlation_id", "created_at"
        )
        VALUES (
          ${eventId}, ${shipment.id}, ${companyId}, ${shipment.courier_account_id || null}, ${scan.awb.trim()},
          ${scan.courierStatus}, ${internalStatus}, ${eventTimeDate}, ${scan.location || null},
          ${scan.description || scan.instructions || null}, ${scan.rawStatus || scan.courierStatus}, ${corrId}, NOW()
        )
        ON CONFLICT ("shipment_id", "awb", "courier_status", "event_time", "location")
        DO NOTHING
        RETURNING *;
      `;

      const eventInserted = insertResult && insertResult.length > 0;

      // 3. Out-of-Order Safety & Status Update Evaluation
      let statusUpdated = false;
      const currentStatusIsTerminal = TERMINAL_STATUSES.includes(shipment.internal_status);
      const lastEventTime = shipment.last_status_event_time ? new Date(shipment.last_status_event_time) : new Date(0);

      // Rules for updating Shipment status:
      // a) Current status is NOT terminal (or new event is terminal)
      // b) Event timestamp is >= last recorded status event timestamp
      const isNewerEvent = eventTimeDate.getTime() >= lastEventTime.getTime();
      const canUpdateStatus = (!currentStatusIsTerminal || isTerminal) && isNewerEvent;

      if (canUpdateStatus) {
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            internal_status: internalStatus,
            courier_status: scan.courierStatus,
            last_status_event_time: eventTimeDate,
            deliveredAt: internalStatus === 'DELIVERED' ? eventTimeDate : shipment.deliveredAt
          }
        });
        statusUpdated = true;
      }

      return {
        success: true,
        awb: scan.awb,
        internalStatus,
        courierStatus: scan.courierStatus,
        isTerminal,
        eventInserted,
        statusUpdated,
        correlationId: corrId
      };

    } catch (err: any) {
      console.error('[DelhiveryTrackingService] Process Event Exception:', err);
      return {
        success: false,
        awb: scan.awb,
        internalStatus: 'ERROR',
        courierStatus: scan.courierStatus,
        isTerminal: false,
        eventInserted: false,
        statusUpdated: false,
        error: err.message || 'Failed to process tracking event',
        correlationId: corrId
      };
    }
  }

  /**
   * Fetches live Delhivery B2C tracking API response and processes events.
   * Endpoint: GET /api/v1/packages/json/?waybill=<waybill>
   */
  static async fetchAndSyncTracking(
    companyId: string,
    courierId: string,
    awbNumber: string
  ): Promise<ProcessTrackingResult> {
    const correlationId = `DELH-TRK-FETCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      // Fetch courier credentials
      const courier = await prisma.courierPartner.findFirst({
        where: { id: courierId, company_id: companyId }
      });

      let creds: any = {};
      try {
        if (courier?.api_credentials) creds = JSON.parse(courier.api_credentials);
      } catch (e) {}

      const apiKey = creds.api_key || creds.apiKey || creds.token;
      const isStaging = creds.mode === 'staging';
      const baseUrl = isStaging ? 'https://staging-express.delhivery.com' : 'https://track.delhivery.com';

      let lastResult: ProcessTrackingResult = {
        success: false, awb: awbNumber, internalStatus: 'BOOKED', courierStatus: '',
        isTerminal: false, eventInserted: false, statusUpdated: false, correlationId
      };

      if (apiKey && creds.mode !== 'mock') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${baseUrl}/api/v1/packages/json/?waybill=${encodeURIComponent(awbNumber)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          await ApiLogService.log({
            companyId, courierId, operation: 'TRACKING', httpStatus: response.status,
            success: false, errorCode: 'GATEWAY_ERROR', responseMeta: { error: errText }
          });
          return { ...lastResult, error: `HTTP ${response.status}: ${errText.substring(0, 100)}` };
        }

        const resData: any = await response.json();
        const shipmentsData = resData.ShipmentData || [];

        if (shipmentsData.length > 0 && shipmentsData[0].Shipment) {
          const shData = shipmentsData[0].Shipment;
          const statusObj = shData.Status || {};
          const scans = shData.Scans || [];

          // Process Scans in chronological order
          for (const scanItem of scans) {
            const detail = scanItem.ScanDetail || scanItem;
            if (detail.Scan) {
              lastResult = await this.processTrackingEvent(companyId, {
                awb: awbNumber,
                courierStatus: detail.Scan || detail.Instructions || statusObj.Status,
                eventTime: detail.ScanDateTime || statusObj.StatusDateTime || new Date(),
                location: detail.ScannedLocation || statusObj.Destination,
                description: detail.Instructions || detail.Scan,
                rawStatus: detail.ScanType || detail.Scan
              }, correlationId);
            }
          }

          // Fallback to top-level Status if no scans
          if (scans.length === 0 && statusObj.Status) {
            lastResult = await this.processTrackingEvent(companyId, {
              awb: awbNumber,
              courierStatus: statusObj.Status,
              eventTime: statusObj.StatusDateTime || new Date(),
              location: statusObj.Destination || statusObj.Origin,
              description: statusObj.Instructions,
              rawStatus: statusObj.StatusType || statusObj.Status
            }, correlationId);
          }
        }
      } else {
        // Simulation / Mock mode
        lastResult = await this.processTrackingEvent(companyId, {
          awb: awbNumber,
          courierStatus: 'In Transit',
          eventTime: new Date(),
          location: 'Delhi Central Hub',
          description: 'Package in transit to destination hub'
        }, correlationId);
      }

      return lastResult;

    } catch (err: any) {
      console.error('[DelhiveryTrackingService] Fetch Exception:', err);
      return {
        success: false, awb: awbNumber, internalStatus: 'ERROR', courierStatus: '',
        isTerminal: false, eventInserted: false, statusUpdated: false, error: err.message || 'Tracking fetch failed', correlationId
      };
    }
  }

  /**
   * Fetches active non-terminal shipments for polling fallback.
   * EXCLUDES terminal shipments ('DELIVERED', 'RTO_DELIVERED', 'CANCELLED', 'LOST').
   */
  static async getActiveShipmentsForPolling(companyId: string, limit: number = 50): Promise<any[]> {
    return prisma.shipment.findMany({
      where: {
        company_id: companyId,
        internal_status: { notIn: TERMINAL_STATUSES },
        awb_number: { not: 'PENDING' }
      },
      take: limit,
      orderBy: { updated_at: 'asc' }
    });
  }
}
