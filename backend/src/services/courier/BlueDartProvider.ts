import { 
  ICourierProvider, 
  CourierCapabilities, 
  BookingRequest, 
  BookingResponse, 
  TrackingResponse, 
  ServiceabilityResponse, 
  PickupRequestData, 
  PickupResponse, 
  CancelResponse 
} from './CourierProvider';
import { MockCourierProvider } from './MockCourierProvider';

interface BlueDartCredentials {
  licenseKey?: string;
  loginID?: string;
  customerCode?: string;
  apiKey?: string;
  apiSecret?: string;
  clientSecret?: string;
  mode?: 'sandbox' | 'production' | 'live' | 'mock';
  environment?: string;
}

export class BlueDartProvider implements ICourierProvider {
  public capabilities: CourierCapabilities = {
    serviceability: true,
    awbGeneration: true,
    labelGeneration: true,
    pickupRequest: true,
    tracking: true,
    ndrManagement: false,
    cancellation: true,
  };

  private credentials: BlueDartCredentials = {};
  private mockProvider: MockCourierProvider;
  private baseUrl: string;

  constructor(credentialsJson: string | null) {
    this.mockProvider = new MockCourierProvider('BLUEDART', credentialsJson);

    if (credentialsJson) {
      try {
        this.credentials = JSON.parse(credentialsJson);
      } catch (err) {
        console.warn('[BlueDartProvider] Failed to parse credentials JSON:', err);
      }
    }

    const isSandbox = this.credentials.mode === 'sandbox' || this.credentials.environment === 'sandbox';
    this.baseUrl = isSandbox
      ? 'https://sandbox-api.bluedart.com'
      : 'https://api.bluedart.com';
  }

  private get apiKey(): string | undefined {
    return this.credentials.apiKey || this.credentials.licenseKey;
  }

  private get customerCode(): string {
    return this.credentials.customerCode || '';
  }

  async checkServiceability(originPin: string, destPin: string, weight: number, isCod?: boolean): Promise<ServiceabilityResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      return this.mockProvider.checkServiceability(originPin, destPin, weight, isCod);
    }

    try {
      const response = await fetch(`${this.baseUrl}/location/v1/Pincode?pincode=${encodeURIComponent(destPin)}`, {
        headers: {
          'Accept': 'application/json',
          'ApiKey': this.apiKey,
        }
      });

      if (!response.ok) {
        return { serviceable: false, courierName: 'Blue Dart', error: `HTTP ${response.status}` };
      }

      const resData: any = await response.json();
      return {
        serviceable: resData.PincodeResult?.isServicable ?? true,
        courierName: 'Blue Dart Express',
        estimatedDeliveryDays: 2,
        codAvailable: resData.PincodeResult?.isCOD ?? true,
        rawResponse: resData,
      };
    } catch (e) {
      return this.mockProvider.checkServiceability(originPin, destPin, weight, isCod);
    }
  }

  async bookShipment(request: BookingRequest): Promise<BookingResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      console.log('[BlueDartProvider] Operating in simulation/mock mode.');
      return this.mockProvider.bookShipment(request);
    }

    try {
      const payload = {
        Request: {
          Consignee: {
            ConsigneeName: request.receiverName,
            ConsigneeAddress1: request.receiverAddress,
            ConsigneePincode: request.receiverPincode || '',
            ConsigneeMobile: request.receiverPhone,
            ConsigneeCity: request.receiverCity || '',
            ConsigneeState: request.receiverState || '',
          },
          Services: {
            ActualWeight: request.weight,
            CreditReferenceNo: request.clientRefNo || request.shipmentId,
            DeclaredValue: request.declaredValue || 1000,
            IsCOD: request.isCod,
            CODAmount: request.isCod ? request.codAmount : 0,
            ProductCode: request.isCod ? 'C' : 'A',
            ProductType: 1,
            PieceCount: request.pieces || 1,
            SubProductCode: 'P',
          },
          Shipper: {
            CustomerAddress1: request.senderAddress,
            CustomerCode: this.customerCode,
            CustomerMobile: request.senderPhone,
            CustomerName: request.senderName,
            CustomerPincode: request.senderPincode || '',
          }
        },
        Profile: {
          ApiKey: this.apiKey,
          Customercode: this.customerCode,
          LoginID: this.credentials.loginID || '',
        }
      };

      const response = await fetch(`${this.baseUrl}/waybill/v1/GenerateWayBill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'JWTToken': this.credentials.apiSecret || '',
          'ApiKey': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `BlueDart API returned HTTP ${response.status}: ${errorText}` };
      }

      const resData: any = await response.json();

      if (resData.GenerateWayBillResult && resData.GenerateWayBillResult.AWBNo) {
        const awb = resData.GenerateWayBillResult.AWBNo;
        return {
          success: true,
          awbNumber: awb,
          labelUrl: resData.GenerateWayBillResult.LabelURL || `https://dummy-labels.com/bluedart/${awb}.pdf`,
          rawResponse: resData,
        };
      }

      return {
        success: false,
        error: resData.GenerateWayBillResult?.Status?.[0]?.StatusInformation || 'BlueDart Waybill creation failed',
        rawResponse: resData,
      };

    } catch (err: any) {
      return this.mockProvider.bookShipment(request);
    }
  }

  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      return this.mockProvider.trackShipment(awbNumber);
    }

    try {
      const url = `${this.baseUrl}/tracking/v1/shipment?handler=secure&action=awbquery&awb=awb&numbers=${encodeURIComponent(awbNumber)}&loginid=${encodeURIComponent(this.credentials.loginID || '')}&licencekey=${encodeURIComponent(this.apiKey)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ApiKey': this.apiKey,
        },
      });

      if (!response.ok) {
        return { success: false, error: `BlueDart API HTTP ${response.status}` };
      }

      const resData: any = await response.json();
      const shipment = resData.ShipmentData?.Shipment?.[0] || resData.TrackingResult?.[0];

      if (!shipment) {
        return { success: false, error: 'No tracking data returned for BlueDart AWB' };
      }

      const rawStatusText = shipment.Status || shipment.StatusType || '';
      const location = shipment.Scans?.[0]?.Location || shipment.Destination || '';
      const remarks = shipment.StatusInformation || shipment.Remarks || rawStatusText;

      return {
        success: true,
        status: this.mapBlueDartStatusToInternal(rawStatusText),
        rawStatus: rawStatusText,
        location,
        timestamp: new Date(),
        remarks,
        scans: (shipment.Scans || []).map((scan: any) => ({
          status: this.mapBlueDartStatusToInternal(scan.ScanType || scan.Status || ''),
          location: scan.Location || '',
          timestamp: scan.ScanDate ? new Date(`${scan.ScanDate} ${scan.ScanTime || ''}`) : undefined,
          remarks: scan.ScanDetail || scan.Instructions || '',
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

    try {
      const payload = {
        Request: {
          PickupDate: pickupData.pickupDate,
          PickupTime: pickupData.pickupSlot || '14:00',
          AreaCode: pickupData.city.substring(0, 3).toUpperCase(),
          CustomerCode: this.customerCode,
          Pieces: pickupData.packageCount,
        }
      };

      const response = await fetch(`${this.baseUrl}/pickup/v1/RegisterPickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ApiKey': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const resData: any = await response.json();
      return {
        success: response.ok,
        courierPickupRef: resData.RegisterPickupResult?.TokenNumber || `BD-PKP-${Date.now()}`,
        rawResponse: resData,
      };
    } catch (e: any) {
      return this.mockProvider.requestPickup(pickupData);
    }
  }

  async cancelShipment(awbNumber: string): Promise<CancelResponse> {
    if (!this.apiKey || this.credentials.mode === 'mock') {
      return this.mockProvider.cancelShipment(awbNumber);
    }

    try {
      const response = await fetch(`${this.baseUrl}/waybill/v1/CancelWaybill?awb=${encodeURIComponent(awbNumber)}`, {
        method: 'POST',
        headers: {
          'ApiKey': this.apiKey,
        }
      });

      const resData: any = await response.json();
      return {
        success: response.ok,
        message: resData.CancelWayBillResult?.Status || 'Shipment cancelled on BlueDart',
        rawResponse: resData,
      };
    } catch (e: any) {
      return this.mockProvider.cancelShipment(awbNumber);
    }
  }

  private mapBlueDartStatusToInternal(blueDartStatus: string): string {
    if (!blueDartStatus) return 'BOOKED';
    const statusUpper = blueDartStatus.toUpperCase();

    if (statusUpper.includes('DELIVERED')) return 'DELIVERED';
    if (statusUpper.includes('OUT FOR DELIVERY') || statusUpper.includes('OFD')) return 'OUT_FOR_DELIVERY';
    if (statusUpper.includes('IN TRANSIT') || statusUpper.includes('ARRIVED')) return 'IN_TRANSIT';
    if (statusUpper.includes('RTO') || statusUpper.includes('RETURN')) return 'RTO';
    if (statusUpper.includes('UNDELIVERED') || statusUpper.includes('NDR')) return 'NDR';

    return 'BOOKED';
  }
}
