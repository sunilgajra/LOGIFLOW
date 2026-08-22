import { prisma } from '../../prisma';

export interface LogApiInput {
  companyId: string;
  courierId?: string;
  shipmentId?: string;
  operation: 'BOOKING' | 'TRACKING' | 'PICKUP' | 'SERVICEABILITY' | 'NDR' | 'CANCEL' | 'WEBHOOK' | 'FETCH_WAYBILL';
  httpStatus?: number;
  success: boolean;
  errorCode?: string;
  requestMeta?: any;
  responseMeta?: any;
  retryCount?: number;
  correlationId?: string;
}

export class ApiLogService {
  static async log(input: LogApiInput): Promise<void> {
    try {
      let validCompanyId = input.companyId;
      if (!validCompanyId || validCompanyId === 'unknown' || validCompanyId === 'multi-tenant' || validCompanyId === 'system') {
        const comp = await prisma.company.findFirst();
        if (!comp) return;
        validCompanyId = comp.id;
      }

      // Sanitize request and response metadata to mask secrets/tokens
      const sanitizedReq = input.requestMeta ? this.sanitize(input.requestMeta) : null;
      const sanitizedRes = input.responseMeta ? this.sanitize(input.responseMeta) : null;

      await prisma.apiLog.create({
        data: {
          company_id: validCompanyId,
          courier_id: input.courierId || null,
          shipment_id: input.shipmentId || null,
          operation: input.operation,
          http_status: input.httpStatus || (input.success ? 200 : 500),
          success: input.success,
          error_code: input.errorCode || null,
          request_meta: sanitizedReq ? JSON.stringify(sanitizedReq) : null,
          response_meta: sanitizedRes ? JSON.stringify(sanitizedRes) : null,
          retry_count: input.retryCount || 0,
          correlation_id: input.correlationId || `CORR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        }
      });
    } catch (e) {
      console.error('[ApiLogService] Failed to write API log record:', e);
    }
  }

  public static sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const copy = Array.isArray(obj) ? [...obj] : { ...obj };
    const secretKeys = ['password', 'token', 'key', 'apiKey', 'api_key', 'apiSecret', 'clientSecret', 'JWTToken', 'authorization'];

    for (const k of Object.keys(copy)) {
      if (secretKeys.some(sk => k.toLowerCase().includes(sk.toLowerCase()))) {
        copy[k] = '***MASKED_SECRET***';
      } else if (typeof copy[k] === 'object' && copy[k] !== null) {
        copy[k] = this.sanitize(copy[k]);
      }
    }
    return copy;
  }
}
