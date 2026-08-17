import { ICourierProvider, BookingRequest, BookingResponse, TrackingResponse } from './CourierProvider';

/**
 * A mock provider that simulates a real courier API like Delhivery or Blue Dart.
 * It automatically generates AWBs and progresses tracking statuses based on time.
 */
export class MockCourierProvider implements ICourierProvider {
  private courierName: string;

  constructor(courierName: string, credentialsJson: string | null) {
    this.courierName = courierName || 'MOCK_COURIER';
    // In a real provider, we would parse credentialsJson and initialize the SDK/Axios
    // const creds = credentialsJson ? JSON.parse(credentialsJson) : {};
  }

  async bookShipment(request: BookingRequest): Promise<BookingResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate a mock AWB
    const prefix = this.courierName.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(10000000 + Math.random() * 90000000); // 8 digit number
    const awb = `${prefix}${randomNum}`;

    return {
      success: true,
      awbNumber: awb,
      labelUrl: `https://dummy-labels.com/label/${awb}.pdf`
    };
  }

  async trackShipment(awbNumber: string): Promise<TrackingResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // A simple mock state machine based on the last digit of the AWB or random chance
    // For demo purposes, we will return random progress
    const states = [
      { status: 'BOOKED', location: 'Origin Hub', remarks: 'Shipment booked' },
      { status: 'IN_TRANSIT', location: 'Transit Hub A', remarks: 'Arrived at transit facility' },
      { status: 'IN_TRANSIT', location: 'Transit Hub B', remarks: 'Departed from transit facility' },
      { status: 'OUT_FOR_DELIVERY', location: 'Destination City', remarks: 'Out for delivery' },
      { status: 'DELIVERED', location: 'Destination Address', remarks: 'Delivered successfully' }
    ];

    // Pick a random state, weighted towards in-transit
    const roll = Math.random();
    let stateIndex = 1;
    if (roll > 0.9) stateIndex = 4; // 10% chance to be delivered
    else if (roll > 0.7) stateIndex = 3; // 20% chance out for delivery
    else if (roll > 0.3) stateIndex = 2; // 40% chance transit hub B
    
    const state = states[stateIndex];

    return {
      success: true,
      status: state.status,
      location: state.location,
      timestamp: new Date(),
      remarks: state.remarks
    };
  }
}
