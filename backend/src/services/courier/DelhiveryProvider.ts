import { ICourierProvider, BookingRequest, BookingResponse, TrackingResponse, TrackingScan } from './CourierProvider';
import { MockCourierProvider } from './MockCourierProvider';

interface DelhiveryCredentials {
  apiKey?: string;
  token?: string;
  clientName?: string;
  client?: string;
  pickupLocation?: string;
  warehouse?: string;
  mode?: 'staging' | 'production' | 'live' | 'mock';
  environment?: string;
}

export class DelhiveryProvider implements ICourierProvider {
  private credentials: DelhiveryCredentials = {};
  private mockProvider: MockCourierProvider;
  private baseUrl: string;

  constructor(credentialsJson: string | null) {
    this.mockProvider = new MockCourierProvider('DELHIVERY', credentialsJson);

    if (credentialsJson) {
      try {
        this.credentials = JSON.parse(credentialsJson);
      } catch (err) {
        console.warn('[DelhiveryProvider] Failed to parse API credentials JSON:', err);
      }
    }

    const isStaging = this.credentials.mode === 'staging' || this.credentials.environment === 'staging';
    this.baseUrl = isStaging
      ? 'https://staging-express.delhivery.com'
      : 'https://track.delhivery.com';
  }

  private get apiKey(): string | undefined {
    return this.credentials.apiKey || this.credentials.token;
  }

  private get clientName(): string {
    return this.credentials.clientName || this.credentials.client || '';
  }

  private get pickupLocation(): string {
    return this.credentials.pickupLocation || this.credentials.warehouse || 'Primary Warehouse';
  }

  async bookShipment(request: BookingRequest): Promise<BookingResponse> {
    // If no valid API key or explicitly set to mock, fallback to MockCourierProvider
    if (!this.apiKey || this.credentials.mode === 'mock') {
      console.log('[DelhiveryProvider] Operating in simulation/mock mode (no live API key provided).');
      return this.mockProvider.bookShipment(request);
    }

    try {
      const payload = {
        shipments: [
          {
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
            weight: String(request.weight * 1000), // weight in grams for Delhivery
            quantity: String(request.pieces || 1),
            shipment_height: 10,
            shipment_width: 10,
            shipment_length: 10,
            product_desc: request.productDescription || 'General Parcel',
            seller_name: request.senderName,
            seller_add: request.senderAddress,
            pickup_location: this.pickupLocation,
          }
        ],
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
        console.error('[DelhiveryProvider] CMU creation HTTP error:', response.status, errorText);
        return {
          success: false,
          error: `Delhivery API returned HTTP ${response.status}: ${errorText}`,
        };
      }

      const resData: any = await response.json();

      if (resData.success && resData.packages && resData.packages.length > 0) {
        const pkg = resData.packages[0];
        const awb = pkg.waybill || pkg.refnum;
        return {
          success: true,
          awbNumber: awb,
          labelUrl: `${this.baseUrl}/api/v1/packages/label/?waybill=${awb}`,
          rawResponse: resData,
        };
      }

      // If Delhivery response was unsuccessful or returned errors array
      if (resData.rmk || (resData.packages && resData.packages[0]?.remarks)) {
        const errMessage = resData.rmk || resData.packages[0]?.remarks?.[0] || 'Booking failed on Delhivery';
        return {
          success: false,
          error: errMessage,
          rawResponse: resData,
        };
      }

      return {
        success: false,
        error: 'Failed to obtain AWB from Delhivery API response',
        rawResponse: resData,
      };

    } catch (err: any) {
      console.error('[DelhiveryProvider] Exception during bookShipment:', err);
      // Fallback to mock on unexpected network error so system remains functional
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
        const errorText = await response.text();
        console.error('[DelhiveryProvider] Tracking API HTTP error:', response.status, errorText);
        return {
          success: false,
          error: `Delhivery API HTTP ${response.status}: ${errorText}`,
        };
      }

      const resData: any = await response.json();
      const shipmentData = resData.ShipmentData?.[0]?.Shipment;

      if (!shipmentData) {
        return {
          success: false,
          error: 'No shipment data found for provided AWB',
          rawResponse: resData,
        };
      }

      const statusObj = shipmentData.Status || {};
      const rawStatusText = statusObj.Status || shipmentData.StatusType || '';
      const location = statusObj.StatusLocation || shipmentData.Scans?.[0]?.ScanDetail?.ScannedLocation || '';
      const timestampStr = statusObj.StatusDateTime || shipmentData.Scans?.[0]?.ScanDetail?.ScanDateTime;
      const remarks = statusObj.Instructions || statusObj.Status || '';

      const normalizedStatus = this.mapDelhiveryStatusToInternal(rawStatusText);

      const scans: TrackingScan[] = (shipmentData.Scans || []).map((scanWrapper: any) => {
        const scan = scanWrapper.ScanDetail || {};
        return {
          status: this.mapDelhiveryStatusToInternal(scan.Scan || scan.ScanType || ''),
          location: scan.ScannedLocation || '',
          timestamp: scan.ScanDateTime ? new Date(scan.ScanDateTime) : undefined,
          remarks: scan.Instructions || scan.Scan || '',
        };
      });

      return {
        success: true,
        status: normalizedStatus,
        rawStatus: rawStatusText,
        location,
        timestamp: timestampStr ? new Date(timestampStr) : new Date(),
        remarks,
        scans,
        rawResponse: resData,
      };

    } catch (err: any) {
      console.error('[DelhiveryProvider] Exception during trackShipment:', err);
      return this.mockProvider.trackShipment(awbNumber);
    }
  }

  /**
   * Maps raw Delhivery status codes/strings to standardized LogiFlow internal status
   */
  private mapDelhiveryStatusToInternal(delhiveryStatus: string): string {
    if (!delhiveryStatus) return 'BOOKED';

    const statusUpper = delhiveryStatus.toUpperCase();

    if (statusUpper.includes('DELIVERED')) {
      return 'DELIVERED';
    }
    if (statusUpper.includes('OUT FOR DELIVERY') || statusUpper.includes('DISPATCHED')) {
      return 'OUT_FOR_DELIVERY';
    }
    if (statusUpper.includes('IN TRANSIT') || statusUpper.includes('MANIFEST') || statusUpper.includes('ARRIVED') || statusUpper.includes('DEPARTED') || statusUpper.includes('REACHED')) {
      return 'IN_TRANSIT';
    }
    if (statusUpper.includes('RTO') || statusUpper.includes('RETURN') || statusUpper.includes('DTO') || statusUpper.includes('REJECTED')) {
      return 'RTO';
    }
    if (statusUpper.includes('NDR') || statusUpper.includes('UNDELIVERED') || statusUpper.includes('UNCLAIMED') || statusUpper.includes('FAILED ATTEMPT')) {
      return 'NDR';
    }
    if (statusUpper.includes('BOOKED') || statusUpper.includes('PICKUP')) {
      return 'BOOKED';
    }

    return 'IN_TRANSIT';
  }
}
