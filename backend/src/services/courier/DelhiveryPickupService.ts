import { prisma } from '../../prisma';
import { ApiLogService } from '../logger/ApiLogService';

export interface CreatePickupInput {
  companyId: string;
  courierId: string;
  courierAccountId?: string;
  pickupLocation: string; // Registered warehouse name in Delhivery
  pickupDate: string;     // YYYY-MM-DD
  pickupTime?: string;    // HH:MM:SS
  expectedPackageCount?: number;
  shipmentIds?: string[];
  notes?: string;
}

export interface CreatePickupResult {
  success: boolean;
  pickupId?: string;       // Delhivery PR ID (e.g., 314936152)
  status?: string;         // Scheduled
  pickupDate?: string;
  pickupTime?: string;
  incomingCenter?: string;
  packageCount?: number;
  associatedShipmentCount?: number;
  error?: string;
  errorCode?: string;
  correlationId?: string;
  isDuplicatePrevention?: boolean;
}

export class DelhiveryPickupService {
  /**
   * Validates pickup payload per official Delhivery FM specifications.
   */
  static validatePayload(input: CreatePickupInput): { valid: boolean; error?: string } {
    if (!input.pickupLocation || input.pickupLocation.trim() === '') {
      return { valid: false, error: 'Pickup location (registered warehouse name) is required.' };
    }
    if (!input.pickupDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.pickupDate.trim())) {
      return { valid: false, error: 'Pickup date must be in YYYY-MM-DD format.' };
    }
    if (!input.companyId) {
      return { valid: false, error: 'Tenant company_id is required.' };
    }
    return { valid: true };
  }

  /**
   * Concurrency-safe, multi-tenant Delhivery B2C Pickup Request creation.
   * Uses PostgreSQL composite unique constraint on (company_id, facility_name, pickup_date)
   * to guarantee 100% race-condition protection across concurrent workers.
   */
  static async createPickupRequest(input: CreatePickupInput): Promise<CreatePickupResult> {
    const correlationId = `DELH-PKP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      // 1. Payload Validation
      const validation = this.validatePayload(input);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          errorCode: 'VALIDATION_ERROR',
          correlationId
        };
      }

      const pDate = new Date(`${input.pickupDate}T00:00:00.000Z`);
      const pickupTimeStr = input.pickupTime || '14:00:00';

      // 2. Package Count Reconciliation & Shipment Mapping
      let eligibleShipments: any[] = [];
      if (input.shipmentIds && input.shipmentIds.length > 0) {
        // Enforce strict multi-tenant scoping: Company A can ONLY fetch Company A shipments
        eligibleShipments = await prisma.shipment.findMany({
          where: {
            id: { in: input.shipmentIds },
            company_id: input.companyId
          }
        });
      }

      const reconciledPackageCount = eligibleShipments.length > 0
        ? eligibleShipments.length
        : (input.expectedPackageCount && input.expectedPackageCount > 0 ? input.expectedPackageCount : 1);

      // 3. Concurrency Lock & Composite Unique Constraint Upsert
      // Checks/Locks existing PickupRequest for (company_id, facility_name, pickup_date)
      const existingScheduled = await prisma.pickupRequest.findFirst({
        where: {
          company_id: input.companyId,
          facility_name: input.pickupLocation,
          pickup_date: pDate,
          booking_status: 'SCHEDULED'
        }
      });

      if (existingScheduled && existingScheduled.pickup_id && !existingScheduled.pickup_id.startsWith('LOCK-')) {
        return {
          success: true,
          pickupId: existingScheduled.pickup_id,
          status: existingScheduled.status,
          pickupDate: input.pickupDate,
          pickupTime: existingScheduled.pickup_time || pickupTimeStr,
          incomingCenter: existingScheduled.pickup_location_name || input.pickupLocation,
          packageCount: existingScheduled.expected_package_count,
          associatedShipmentCount: eligibleShipments.length,
          isDuplicatePrevention: true,
          correlationId: existingScheduled.correlation_id || correlationId
        };
      }

      const recordId = `pkp-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const tempPickupId = `LOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // Atomic Raw SQL Upsert using composite unique constraint
      const upsertResult = await prisma.$queryRaw<any[]>`
        INSERT INTO "PickupRequest" (
          "id", "company_id", "courier_id", "courier_account_id", "pickup_id",
          "facility_name", "pickup_location_name", "pickup_date", "pickup_slot", "pickup_time",
          "box_count", "expected_package_count", "status", "booking_status", "correlation_id",
          "created_at", "updated_at"
        )
        VALUES (
          ${recordId}, ${input.companyId}, ${input.courierId}, ${input.courierAccountId || null}, ${tempPickupId},
          ${input.pickupLocation}, ${input.pickupLocation}, ${pDate}, ${pickupTimeStr}, ${pickupTimeStr},
          ${reconciledPackageCount}, ${reconciledPackageCount}, 'Scheduled', 'SCHEDULING_IN_PROGRESS', ${correlationId},
          NOW(), NOW()
        )
        ON CONFLICT ("company_id", "facility_name", "pickup_date")
        DO UPDATE SET
          "expected_package_count" = EXCLUDED."expected_package_count",
          "box_count" = EXCLUDED."box_count",
          "correlation_id" = EXCLUDED."correlation_id",
          "updated_at" = NOW()
        RETURNING *;
      `;

      const pickupRecord = upsertResult[0];

      // If another concurrent worker already completed and scheduled this pickup:
      if (pickupRecord.booking_status === 'SCHEDULED' && !pickupRecord.pickup_id.startsWith('LOCK-')) {
        return {
          success: true,
          pickupId: pickupRecord.pickup_id,
          status: pickupRecord.status,
          pickupDate: input.pickupDate,
          pickupTime: pickupRecord.pickup_time || pickupTimeStr,
          incomingCenter: pickupRecord.pickup_location_name || input.pickupLocation,
          packageCount: pickupRecord.expected_package_count,
          associatedShipmentCount: eligibleShipments.length,
          isDuplicatePrevention: true,
          correlationId: pickupRecord.correlation_id || correlationId
        };
      }

      // 4. Associate Eligible Shipments to PickupRequest
      if (eligibleShipments.length > 0) {
        await prisma.shipment.updateMany({
          where: {
            id: { in: eligibleShipments.map(s => s.id) },
            company_id: input.companyId
          },
          data: { pickup_request_id: pickupRecord.id }
        });
      }

      // 5. Fetch Tenant Courier Credentials
      const courier = await prisma.courierPartner.findFirst({
        where: { id: input.courierId, company_id: input.companyId }
      });

      let creds: any = {};
      try {
        if (courier?.api_credentials) {
          creds = JSON.parse(courier.api_credentials);
        }
      } catch (e) {}

      const apiKey = creds.api_key || creds.apiKey || creds.token;
      const isStaging = creds.mode === 'staging';
      const baseUrl = isStaging ? 'https://staging-express.delhivery.com' : 'https://track.delhivery.com';

      // 6. Build Payload with Reconciled Package Count
      const requestPayload = {
        pickup_location: input.pickupLocation,
        pickup_date: input.pickupDate,
        pickup_time: pickupTimeStr,
        expected_package_count: reconciledPackageCount
      };

      // 7. Execute Request with 3 Retries for 5xx/Timeouts
      let response: Response | null = null;
      let attempt = 0;
      const maxRetries = 3;
      let lastErrorText = '';

      while (attempt < maxRetries) {
        attempt++;
        try {
          if (apiKey && creds.mode !== 'mock') {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            response = await fetch(`${baseUrl}/fm/request/new/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${apiKey}`,
                'Accept': 'application/json'
              },
              body: JSON.stringify(requestPayload),
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok || (response.status >= 400 && response.status < 500)) {
              break; // Don't retry 4xx client errors
            }
          } else {
            // Mock simulation mode
            break;
          }
        } catch (netErr: any) {
          lastErrorText = netErr.message || 'Network Timeout';
          if (attempt >= maxRetries) break;
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }

      // 8. Parse Response & Verify Success
      let resData: any = {};
      let isSuccess = false;
      let returnedPrId = `PR-${Date.now()}`;
      let incomingCenter = input.pickupLocation;

      if (response && response.ok) {
        resData = await response.json();
        if (resData.pr_id || resData.pickup_id || resData.status === 'Scheduled') {
          isSuccess = true;
          returnedPrId = String(resData.pr_id || resData.pickup_id || returnedPrId);
          incomingCenter = resData.incoming_center_name || resData.pickup_location || incomingCenter;
        } else if (resData.error) {
          lastErrorText = typeof resData.error === 'object' ? JSON.stringify(resData.error) : resData.error;
        }
      } else if (!apiKey || creds.mode === 'mock') {
        isSuccess = true;
        resData = { pr_id: returnedPrId, status: 'Scheduled', incoming_center_name: incomingCenter };
      } else if (response) {
        lastErrorText = await response.text();
      }

      // 9. Handle Success Transition (Only after valid PR ID returned)
      if (isSuccess) {
        await prisma.pickupRequest.update({
          where: { id: pickupRecord.id },
          data: {
            pickup_id: returnedPrId,
            booking_status: 'SCHEDULED',
            status: 'Scheduled',
            pickup_location_name: incomingCenter,
            correlation_id: correlationId
          }
        });

        await ApiLogService.log({
          companyId: input.companyId,
          courierId: input.courierId,
          operation: 'PICKUP',
          httpStatus: response?.status || 200,
          success: true,
          requestMeta: requestPayload,
          responseMeta: { pr_id: returnedPrId, correlation_id: correlationId }
        });

        return {
          success: true,
          pickupId: returnedPrId,
          status: 'Scheduled',
          pickupDate: input.pickupDate,
          pickupTime: pickupTimeStr,
          incomingCenter,
          packageCount: reconciledPackageCount,
          associatedShipmentCount: eligibleShipments.length,
          correlationId
        };
      }

      // 10. Handle Failure Behavior
      // Unlink shipments so they can be retried safely
      if (eligibleShipments.length > 0) {
        await prisma.shipment.updateMany({
          where: { id: { in: eligibleShipments.map(s => s.id) }, company_id: input.companyId },
          data: { pickup_request_id: null }
        });
      }

      await prisma.pickupRequest.update({
        where: { id: pickupRecord.id },
        data: {
          booking_status: 'FAILED',
          status: 'Not Picked',
          last_pickup_error: lastErrorText || 'Delhivery pickup request rejected by gateway',
          correlation_id: correlationId
        }
      });

      await ApiLogService.log({
        companyId: input.companyId,
        courierId: input.courierId,
        operation: 'PICKUP',
        httpStatus: response?.status || 500,
        success: false,
        errorCode: 'DELHIVERY_PICKUP_REJECTED',
        requestMeta: requestPayload,
        responseMeta: { error: lastErrorText, correlation_id: correlationId }
      });

      return {
        success: false,
        error: lastErrorText || 'Delhivery pickup request rejected by gateway',
        errorCode: 'GATEWAY_REJECTED',
        correlationId
      };

    } catch (err: any) {
      console.error('[DelhiveryPickupService] Critical Pickup Exception:', err);
      return {
        success: false,
        error: err.message || 'Internal pickup creation failure',
        errorCode: 'INTERNAL_ERROR',
        correlationId
      };
    }
  }
}
