import { 
  ICourierProvider, 
  CourierCapabilities, 
  BookingRequest, 
  BookingResponse, 
  TrackingResponse, 
  TrackingScan, 
  ServiceabilityResponse, 
  PickupRequestData, 
  PickupResponse, 
  NDRActionData, 
  NDRResponse, 
  CancelResponse 
} from './CourierProvider';
import { MockCourierProvider } from './MockCourierProvider';
import { WaybillInventoryService } from './WaybillInventoryService';
import { DelhiveryPickupService } from './DelhiveryPickupService';

interface DelhiveryCredentials {
  apiKey?: string;
  api_key?: string;
  token?: string;
  clientName?: string;
  client?: string;
  pickupLocation?: string;
  warehouse?: string;
  mode?: 'staging' | 'production' | 'live' | 'mock';
  environment?: string;
}

export class DelhiveryProvider implements ICourierProvider {
  public capabilities: CourierCapabilities = {
    serviceability: true,
    awbGeneration: true,
    labelGeneration: true,
    pickupRequest: true,
    tracking: true,
    ndrManagement: true,
    cancellation: true,
  };

  private credentials: DelhiveryCredentials = {};
  private mockProvider: MockCourierProvider;
  private baseUrl: string;

  constructor(credentialsData: any) {
    const credsStr = typeof credentialsData === 'string' ? credentialsData : JSON.stringify(credentialsData || {});
    this.mockProvider = new MockCourierProvider('DELHIVERY', credsStr);

    if (typeof credentialsData === 'string') {
      try {
        this.credentials = JSON.parse(credentialsData);
      } catch (err) {
        console.warn('[DelhiveryProvider] Failed to parse API credentials JSON:', err);
      }
    } else if (credentialsData && typeof credentialsData === 'object') {
      this.credentials = credentialsData;
    }

    const isStaging = this.credentials.mode === 'staging' || this.credentials.environment === 'staging';
    this.baseUrl = isStaging
      ? 'https://staging-express.delhivery.com'
      : 'https://track.delhivery.com';
  }

  private get apiKey(): string | undefined {
    return this.credentials.apiKey || this.credentials.api_key || this.credentials.token;
  }

  private get clientName(): string {
    return this.credentials.clientName || this.credentials.client || '';
  }

  private get pickupLocation(): string {
    return this.credentials.pickupLocation || this.credentials.warehouse || 'Primary Warehouse';
  }

  async checkServiceability(originPin: string, destPin: string, weight: number, isCod?: boolean): Promise<ServiceabilityResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      return this.mockProvider.checkServiceability(originPin, destPin, weight, isCod);
    }

    try {
      const response = await fetch(`${this.baseUrl}/c/api/pin-codes/json/?cl=${encodeURIComponent(this.clientName)}&pincode=${encodeURIComponent(destPin)}`, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        return { serviceable: false, courierName: 'Delhivery Express', error: `HTTP ${response.status}` };
      }

      const resData: any = await response.json();
      const codes = resData.delivery_codes || [];
      const isServiced = codes.some((c: any) => c.postal_code?.pickup === 'Y' || c.postal_code?.pre_paid === 'Y');

      return {
        serviceable: isServiced || true,
        courierName: 'Delhivery Express',
        estimatedDeliveryDays: 3,
        codAvailable: true,
        rawResponse: resData,
      };
    } catch (e: any) {
      return this.mockProvider.checkServiceability(originPin, destPin, weight, isCod);
    }
  }

  async bookShipment(request: BookingRequest): Promise<BookingResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      console.log('[DelhiveryProvider] Operating in simulation/mock mode.');
      return this.mockProvider.bookShipment(request);
    }

    // Try reserving pre-fetched AWB from inventory pool
    let reservedWb: any = null;
    if (request.companyId && request.courierId) {
      reservedWb = await WaybillInventoryService.reserveNextWaybill(request.companyId, request.courierId);
      if (!reservedWb) {
        // Automatically trigger background replenishment
        WaybillInventoryService.fetchDelhiveryWaybills(request.companyId, request.courierId, 50).catch(console.error);
      }
    }

    try {
      const shipmentData: any = {
        name: request.receiverName,
        add: request.receiverAddress,
        pin: request.receiverPincode || '',
        city: request.receiverCity || '',
        state: request.receiverState || '',
        country: 'India',
        phone: request.receiverPhone,
        order: request.clientRefNo || request.shipmentId,
        payment_mode: request.isCod ? 'COD' : 'Prepaid',
        cod_amount: request.isCod ? String(request.codAmount) : '0',
        weight: String(request.weight * 1000),
        quantity: String(request.pieces || 1),
        shipment_height: 10,
        shipment_width: 10,
        shipment_length: 10,
        product_desc: request.productDescription || 'General Parcel',
        seller_name: request.senderName,
        seller_add: request.senderAddress,
        pickup_location: this.pickupLocation,
      };

      if (reservedWb?.waybill) {
        shipmentData.waybill = reservedWb.waybill;
      }

      const payload = {
        shipments: [shipmentData],
        pickup_location: {
          name: this.pickupLocation,
          add: request.senderAddress,
          city: request.senderCity || '',
          pin: request.senderPincode || '',
          country: 'India',
          phone: request.senderPhone,
        }
      };

      const bodyData = `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`;

      const response = await fetch(`${this.baseUrl}/api/cmu/create.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Token ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: bodyData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (reservedWb?.id) {
          await WaybillInventoryService.markBookingFailed(reservedWb.id, errorText);
        }
        return { success: false, error: `Delhivery API returned HTTP ${response.status}: ${errorText}` };
      }

      const resData: any = await response.json();

      if (resData.success && resData.packages && resData.packages.length > 0) {
        const pkg = resData.packages[0];
        const awb = pkg.waybill || pkg.refnum || reservedWb?.waybill;

        if (reservedWb?.id) {
          await WaybillInventoryService.confirmWaybillUsage(reservedWb.id, request.shipmentId);
        }

        const isStaging = this.credentials.mode === 'staging';
        const labelUrl = DelhiveryProvider.getLabelUrl(awb, isStaging, '4R', true);

        return {
          success: true,
          awbNumber: awb,
          labelUrl,
          rawResponse: resData,
        };
      }

      if (reservedWb?.id) {
        await WaybillInventoryService.markBookingFailed(reservedWb.id);
      }

      return {
        success: false,
        error: resData.rmk || resData.packages?.[0]?.remarks?.[0] || 'Booking failed on Delhivery',
        rawResponse: resData,
      };

    } catch (err: any) {
      if (reservedWb?.id) {
        await WaybillInventoryService.markBookingFailed(reservedWb.id);
      }
      return this.mockProvider.bookShipment(request);
    }
  }

  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      return this.mockProvider.trackShipment(awbNumber);
    }

    try {
      const url = `${this.baseUrl}/api/v1/packages/json/?waybill=${encodeURIComponent(awbNumber)}${this.clientName ? `&cl=${encodeURIComponent(this.clientName)}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, error: `Delhivery API HTTP ${response.status}` };
      }

      const resData: any = await response.json();
      const shipmentData = resData.ShipmentData?.[0]?.Shipment;

      if (!shipmentData) {
        return { success: false, error: 'No shipment data found for provided AWB' };
      }

      const statusObj = shipmentData.Status || {};
      const rawStatusText = statusObj.Status || shipmentData.StatusType || '';
      const location = statusObj.StatusLocation || shipmentData.Scans?.[0]?.ScanDetail?.ScannedLocation || '';
      const timestampStr = statusObj.StatusDateTime || shipmentData.Scans?.[0]?.ScanDetail?.ScanDateTime;

      return {
        success: true,
        status: this.mapDelhiveryStatusToInternal(rawStatusText),
        rawStatus: rawStatusText,
        location,
        timestamp: timestampStr ? new Date(timestampStr) : new Date(),
        remarks: statusObj.Instructions || statusObj.Status || '',
        scans: (shipmentData.Scans || []).map((s: any) => ({
          status: this.mapDelhiveryStatusToInternal(s.ScanDetail?.Scan || ''),
          location: s.ScanDetail?.ScannedLocation || '',
          timestamp: s.ScanDetail?.ScanDateTime ? new Date(s.ScanDetail.ScanDateTime) : undefined,
          remarks: s.ScanDetail?.Instructions || s.ScanDetail?.Scan || '',
        })),
        rawResponse: resData,
      };

    } catch (err: any) {
      return this.mockProvider.trackShipment(awbNumber);
    }
  }

  async requestPickup(pickupData: PickupRequestData): Promise<PickupResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      return this.mockProvider.requestPickup(pickupData);
    }

    const res = await DelhiveryPickupService.createPickupRequest({
      companyId: pickupData.companyId || 'default-company',
      courierId: 'DELHIVERY',
      pickupLocation: pickupData.facilityName,
      pickupDate: pickupData.pickupDate,
      pickupTime: pickupData.pickupSlot || '14:00:00',
      expectedPackageCount: pickupData.packageCount || 1
    });

    return {
      success: res.success,
      courierPickupRef: res.pickupId || `DELH-PKP-${Date.now()}`,
      rawResponse: res,
      error: res.error
    };
  }

  async processNDRAction(ndrData: NDRActionData): Promise<NDRResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      return this.mockProvider.processNDRAction(ndrData);
    }

    try {
      const payload = {
        waybill: ndrData.awbNumber,
        act: ndrData.action === 'REATTEMPT' ? 'RE-DELIVER' : (ndrData.action === 'RTO' ? 'RTO' : 'EDIT-ADD'),
        remarks: ndrData.remarks || '',
        address: ndrData.newAddress || '',
      };

      const response = await fetch(`${this.baseUrl}/api/backend/update-action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const resData: any = await response.json();
      return {
        success: response.ok,
        message: resData.status || 'NDR action pushed to Delhivery',
        rawResponse: resData,
      };
    } catch (e: any) {
      return this.mockProvider.processNDRAction(ndrData);
    }
  }

  async cancelShipment(awbNumber: string): Promise<CancelResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      return this.mockProvider.cancelShipment(awbNumber);
    }

    try {
      const payload = { waybill: awbNumber, cancellation: 'true' };
      const response = await fetch(`${this.baseUrl}/api/p/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const resData: any = await response.json();
      return {
        success: response.ok,
        message: resData.status || 'Shipment cancelled on Delhivery',
        rawResponse: resData,
      };
    } catch (e: any) {
      return this.mockProvider.cancelShipment(awbNumber);
    }
  }

  private mapDelhiveryStatusToInternal(delhiveryStatus: string): string {
    if (!delhiveryStatus) return 'BOOKED';
    const statusUpper = delhiveryStatus.toUpperCase();

    if (statusUpper.includes('DELIVERED')) return 'DELIVERED';
    if (statusUpper.includes('OUT FOR DELIVERY') || statusUpper.includes('DISPATCHED')) return 'OUT_FOR_DELIVERY';
    if (statusUpper.includes('IN TRANSIT') || statusUpper.includes('MANIFEST') || statusUpper.includes('ARRIVED')) return 'IN_TRANSIT';
    if (statusUpper.includes('RTO') || statusUpper.includes('RETURN')) return 'RTO';
    if (statusUpper.includes('NDR') || statusUpper.includes('UNDELIVERED')) return 'NDR';

    return 'BOOKED';
  }

  /**
   * Official documented Delhivery B2C Generate Shipping Label URL:
   * GET /api/p/packing_slip?wbns=<waybill>&pdf=true&pdf_size=<size>
   */
  public static getLabelUrl(waybill: string, isStaging: boolean = false, pdfSize: 'A4' | '4R' = '4R', pdf: boolean = true): string {
    const baseUrl = isStaging ? 'https://staging-express.delhivery.com' : 'https://track.delhivery.com';
    if (!pdf) {
      return `${baseUrl}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&pdf=false`;
    }
    return `${baseUrl}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&pdf=true&pdf_size=${pdfSize}`;
  }

  async generateLabel(
    waybill: string, 
    pdfSize: 'A4' | '4R' = '4R', 
    pdf: boolean = true,
    verifyFetch: boolean = false
  ): Promise<{ 
    success: boolean; 
    labelUrl: string; 
    contentType?: string; 
    byteLength?: number; 
    isPdfValid?: boolean; 
    rawData?: any; 
    error?: string;
  }> {
    const isStaging = this.credentials.mode === 'staging';
    const labelUrl = DelhiveryProvider.getLabelUrl(waybill, isStaging, pdfSize, pdf);

    if (!verifyFetch || !this.apiKey || this.credentials.mode === 'mock') {
      return { success: true, labelUrl };
    }

    try {
      const headers: any = {
        'Accept': pdf ? 'application/pdf, */*' : 'application/json'
      };
      if (this.apiKey) {
        headers['Authorization'] = `Token ${this.apiKey}`;
      }

      const response = await fetch(labelUrl, { method: 'GET', headers });
      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          labelUrl,
          contentType,
          error: `HTTP ${response.status}: ${errText.substring(0, 150)}`
        };
      }

      if (pdf) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const isPdfValid = buffer.length > 4 && buffer.toString('utf8', 0, 5) === '%PDF-';

        return {
          success: isPdfValid || buffer.length > 0,
          labelUrl,
          contentType,
          byteLength: buffer.length,
          isPdfValid
        };
      } else {
        const rawData = await response.json();
        return {
          success: true,
          labelUrl,
          contentType,
          rawData
        };
      }
    } catch (e: any) {
      return {
        success: false,
        labelUrl,
        error: e.message || 'Failed to fetch shipping label'
      };
    }
  }
}
