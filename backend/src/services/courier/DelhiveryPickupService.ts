import { prisma } from '../../prisma';
import { ApiLogService } from '../logger/ApiLogService';

export interface CreatePickupInput {
  companyId: string;
  courierId: string;
  courierAccountId?: string;
  pickupLocation: string; // Registered warehouse name in Delhivery
  pickupDate: string;     // YYYY-MM-DD
  pickupTime?: string;    // HH:MM:SS
  expectedPackageCount: number;
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
    if (!input.expectedPackageCount || input.expectedPackageCount < 1) {
      return { valid: false, error: 'Expected package count must be at least 1.' };
    }
    return { valid: true };
  }

  /**
   * Idempotent, concurrency-safe Delhivery B2C Pickup Request creation.
   * Endpoint: POST /fm/request/new/
   */
  static async createPickupRequest(input: CreatePickupInput): Promise<CreatePickupResult> {
    const correlationId = `DELH-PKP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      // 1. Validate Payload
      const validation = this.validatePayload(input);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          errorCode: 'VALIDATION_ERROR',
          correlationId
        };
      }

      const pDate = new Date(input.pickupDate);
      const pickupTimeStr = input.pickupTime || '14:00:00';

      // 2. Idempotency Check: Existing Scheduled Pickup for same Location & Date
      const existing = await prisma.pickupRequest.findFirst({
        where: {
          company_id: input.companyId,
          facility_name: input.pickupLocation,
          pickup_date: pDate,
          booking_status: 'SCHEDULED'
        }
      });

      if (existing && existing.pickup_id && existing.pickup_id !== 'PENDING') {
        return {
          success: true,
          pickupId: existing.pickup_id,
          status: existing.status,
          pickupDate: input.pickupDate,
          pickupTime: existing.pickup_time || pickupTimeStr,
          incomingCenter: existing.pickup_location_name || input.pickupLocation,
          isDuplicatePrevention: true,
          correlationId: existing.correlation_id || correlationId
        };
      }

      // 3. Acquire / Upsert State Lock
      const pickupRecord = await prisma.pickupRequest.upsert({
        where: { pickup_id: `LOCK-${input.companyId}-${input.pickupLocation}-${input.pickupDate}` },
        create: {
          company_id: input.companyId,
          courier_id: input.courierId,
          courier_account_id: input.courierAccountId || null,
          pickup_id: `LOCK-${input.companyId}-${input.pickupLocation}-${input.pickupDate}`,
          facility_name: input.pickupLocation,
          pickup_location_name: input.pickupLocation,
          pickup_date: pDate,
          pickup_slot: pickupTimeStr,
          pickup_time: pickupTimeStr,
          expected_package_count: input.expectedPackageCount,
          box_count: input.expectedPackageCount,
          booking_status: 'SCHEDULING_IN_PROGRESS',
          status: 'Scheduled',
          correlation_id: correlationId
        },
        update: {
          booking_status: 'SCHEDULING_IN_PROGRESS',
          expected_package_count: input.expectedPackageCount,
          box_count: input.expectedPackageCount,
          correlation_id: correlationId
        }
      });

      // 4. Fetch Courier API Credentials
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

      // 5. Official Delhivery /fm/request/new/ Payload
      const requestPayload = {
        pickup_location: input.pickupLocation,
        pickup_date: input.pickupDate,
        pickup_time: pickupTimeStr,
        expected_package_count: input.expectedPackageCount
      };

      // 6. Execute Request with 3 Retries for 5xx/Timeouts
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
              break; // Don't retry 4xx errors
            }
          } else {
            // Simulation / Mock mode
            break;
          }
        } catch (netErr: any) {
          lastErrorText = netErr.message || 'Network Timeout';
          if (attempt >= maxRetries) break;
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }

      // 7. Parse Response
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
          lastErrorText = resData.error;
        }
      } else if (!apiKey || creds.mode === 'mock') {
        // Simulation mode success
        isSuccess = true;
        resData = { pr_id: returnedPrId, status: 'Scheduled', incoming_center_name: incomingCenter };
      } else if (response) {
        lastErrorText = await response.text();
      }

      // 8. Handle Success Transition
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
          correlationId
        };
      }

      // 9. Handle Failure Transition
      await prisma.pickupRequest.update({
        where: { id: pickupRecord.id },
        data: {
          booking_status: 'FAILED',
          status: 'Not Picked',
          last_pickup_error: lastErrorText || 'Delhivery pickup creation rejected',
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
