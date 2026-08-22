import { 
  ICourierProvider, 
  CourierCapabilities, 
  BookingRequest, 
  BookingResponse, 
  TrackingResponse, 
  ServiceabilityResponse, 
  PickupRequestData, 
  PickupResponse, 
  NDRActionData, 
  NDRResponse, 
  CancelResponse 
} from './CourierProvider';

export class MockCourierProvider implements ICourierProvider {
  public capabilities: CourierCapabilities = {
    serviceability: true,
    awbGeneration: true,
    labelGeneration: true,
    pickupRequest: true,
    tracking: true,
    ndrManagement: true,
    cancellation: true,
  };

  private courierName: string;

  constructor(courierName: string, credentialsJson: string | null = null) {
    this.courierName = courierName || 'MOCK_COURIER';
  }

  async checkServiceability(originPin: string, destPin: string, weight: number, isCod?: boolean): Promise<ServiceabilityResponse> {
    await new Promise(resolve => setTimeout(resolve, 150));
    return {
      serviceable: true,
      courierName: this.courierName,
      estimatedDeliveryDays: 3,
      codAvailable: true,
      rawResponse: { mode: 'simulation' }
    };
  }

  async bookShipment(request: BookingRequest): Promise<BookingResponse> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const prefix = (this.courierName || 'MC').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const randomNum = Math.floor(100000000 + Math.random() * 900000000);
    const awb = `${prefix}${randomNum}`;

    return {
      success: true,
      awbNumber: awb,
      labelUrl: `https://dummy-labels.com/label/${awb}.pdf`,
      rawResponse: { message: 'Mock shipment created successfully', awb }
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const states = [
      { status: 'BOOKED', location: 'Origin Hub', remarks: 'Shipment booked' },
      { status: 'IN_TRANSIT', location: 'Transit Hub A', remarks: 'Arrived at transit facility' },
      { status: 'IN_TRANSIT', location: 'Transit Hub B', remarks: 'Departed from transit facility' },
      { status: 'OUT_FOR_DELIVERY', location: 'Destination City Hub', remarks: 'Out for delivery with field executive' },
      { status: 'DELIVERED', location: 'Destination Address', remarks: 'Delivered to consignee' }
    ];

    const roll = Math.random();
    let stateIndex = 1;
    if (roll > 0.85) stateIndex = 4;
    else if (roll > 0.65) stateIndex = 3;
    else if (roll > 0.3) stateIndex = 2;
    
    const state = states[stateIndex];

    return {
      success: true,
      status: state.status,
      rawStatus: state.remarks,
      location: state.location,
      timestamp: new Date(),
      remarks: state.remarks,
      scans: [
        { status: 'BOOKED', location: 'Origin Hub', timestamp: new Date(Date.now() - 86400000), remarks: 'Shipment booked' },
        { status: state.status, location: state.location, timestamp: new Date(), remarks: state.remarks }
      ]
    };
  }

  async requestPickup(pickupData: PickupRequestData): Promise<PickupResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      success: true,
      courierPickupRef: `MC-PKP-${Date.now()}`,
      scheduledTime: pickupData.pickupSlot || '14:00 - 18:00',
      rawResponse: { mode: 'simulation' }
    };
  }

  async processNDRAction(ndrData: NDRActionData): Promise<NDRResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      success: true,
      message: `NDR action '${ndrData.action}' submitted successfully for AWB ${ndrData.awbNumber}`,
      rawResponse: { mode: 'simulation' }
    };
  }

  async cancelShipment(awbNumber: string): Promise<CancelResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      success: true,
      message: `Shipment ${awbNumber} cancelled successfully`,
      rawResponse: { mode: 'simulation' }
    };
  }
}
