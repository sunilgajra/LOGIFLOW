import { ICourierProvider, BookingRequest, BookingResponse, TrackingResponse } from './CourierProvider';

/**
 * A mock provider that simulates a real courier API (e.g., when API keys are not provided or in DEMO mode).
 * It automatically generates AWBs and progresses tracking statuses dynamically.
 */
export class MockCourierProvider implements ICourierProvider {
  private courierName: string;

  constructor(courierName: string, credentialsJson: string | null = null) {
    this.courierName = courierName || 'MOCK_COURIER';
  }

  async bookShipment(request: BookingRequest): Promise<BookingResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Generate a mock AWB
    const prefix = (this.courierName || 'MC').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const randomNum = Math.floor(100000000 + Math.random() * 900000000); // 9 digit number
    const awb = `${prefix}${randomNum}`;

    return {
      success: true,
      awbNumber: awb,
      labelUrl: `https://dummy-labels.com/label/${awb}.pdf`,
      rawResponse: {
        message: 'Mock shipment created successfully',
        awb: awb
      }
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    // Simulate network delay
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
    if (roll > 0.85) stateIndex = 4; // 15% chance to be delivered
    else if (roll > 0.65) stateIndex = 3; // 20% chance out for delivery
    else if (roll > 0.3) stateIndex = 2; // 35% chance transit hub B
    
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
}
