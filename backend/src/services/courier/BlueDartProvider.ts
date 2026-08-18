import { ICourierProvider, BookingRequest, BookingResponse, TrackingResponse, TrackingScan } from './CourierProvider';
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

  async bookShipment(request: BookingRequest): Promise<BookingResponse> {
    // If no valid API key or explicitly set to mock, fallback to MockCourierProvider
    if (!this.apiKey || this.credentials.mode === 'mock') {
      console.log('[BlueDartProvider] Operating in simulation/mock mode (no live credentials provided).');
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
            ProductCode: request.isCod ? 'C' : 'A', // A: Apex (Domestic Air), C: Surface
            ProductType: 1, // 1: Dox, 2: Non-Dox
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
        console.error('[BlueDartProvider] GenerateWayBill HTTP error:', response.status, errorText);
        return {
          success: false,
          error: `BlueDart API returned HTTP ${response.status}: ${errorText}`,
        };
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

      if (resData.GenerateWayBillResult?.Status?.length > 0) {
        const statusErr = resData.GenerateWayBillResult.Status[0].StatusInformation;
        return {
          success: false,
          error: statusErr || 'BlueDart Waybill creation failed',
          rawResponse: resData,
        };
      }

      return {
        success: false,
        error: 'Failed to generate BlueDart Waybill',
        rawResponse: resData,
      };

    } catch (err: any) {
      console.error('[BlueDartProvider] Exception during bookShipment:', err);
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
        const errorText = await response.text();
        console.error('[BlueDartProvider] Tracking HTTP error:', response.status, errorText);
        return {
          success: false,
          error: `BlueDart API HTTP ${response.status}: ${errorText}`,
        };
      }

      const resData: any = await response.json();
      const shipment = resData.ShipmentData?.Shipment?.[0] || resData.TrackingResult?.[0];

      if (!shipment) {
        return {
          success: false,
          error: 'No tracking data returned for BlueDart AWB',
          rawResponse: resData,
        };
      }

      const rawStatusText = shipment.Status || shipment.StatusType || '';
      const location = shipment.Scans?.[0]?.Location || shipment.Destination || '';
      const remarks = shipment.StatusInformation || shipment.Remarks || rawStatusText;
      const timestampStr = shipment.StatusDate || shipment.StatusTime;

      const normalizedStatus = this.mapBlueDartStatusToInternal(rawStatusText);

      const scans: TrackingScan[] = (shipment.Scans || []).map((scan: any) => ({
        status: this.mapBlueDartStatusToInternal(scan.ScanType || scan.Status || ''),
        location: scan.Location || '',
        timestamp: scan.ScanDate ? new Date(`${scan.ScanDate} ${scan.ScanTime || ''}`) : undefined,
        remarks: scan.ScanDetail || scan.Instructions || '',
      }));

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
      console.error('[BlueDartProvider] Exception during trackShipment:', err);
      return this.mockProvider.trackShipment(awbNumber);
    }
  }

  /**
   * Maps raw BlueDart status string to standardized LogiFlow internal status
   */
  private mapBlueDartStatusToInternal(blueDartStatus: string): string {
    if (!blueDartStatus) return 'BOOKED';

    const statusUpper = blueDartStatus.toUpperCase();

    if (statusUpper.includes('DELIVERED')) {
      return 'DELIVERED';
    }
    if (statusUpper.includes('OUT FOR DELIVERY') || statusUpper.includes('OFD') || statusUpper.includes('DISPATCHED')) {
      return 'OUT_FOR_DELIVERY';
    }
    if (statusUpper.includes('IN TRANSIT') || statusUpper.includes('ARRIVED') || statusUpper.includes('DEPARTED') || statusUpper.includes('LOCATION')) {
      return 'IN_TRANSIT';
    }
    if (statusUpper.includes('RTO') || statusUpper.includes('RETURN') || statusUpper.includes('RETURNED')) {
      return 'RTO';
    }
    if (statusUpper.includes('UNDELIVERED') || statusUpper.includes('NDR') || statusUpper.includes('ATTEMPTED')) {
      return 'NDR';
    }
    if (statusUpper.includes('BOOKED') || statusUpper.includes('PICKED UP') || statusUpper.includes('SHIPMENT ARRIVED')) {
      return 'BOOKED';
    }

    return 'IN_TRANSIT';
  }
}
