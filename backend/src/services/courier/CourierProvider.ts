export interface BookingRequest {
  shipmentId: string;
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  weight: number;
  pieces: number;
  isCod: boolean;
  codAmount: number;
}

export interface BookingResponse {
  success: boolean;
  awbNumber?: string;
  labelUrl?: string;
  error?: string;
}

export interface TrackingResponse {
  success: boolean;
  status?: string; // Standardized internal status (e.g., IN_TRANSIT, DELIVERED, EXCEPTION)
  location?: string;
  timestamp?: Date;
  remarks?: string;
  error?: string;
}

export interface ICourierProvider {
  /**
   * Pushes a new shipment to the courier and retrieves the AWB/Label
   */
  bookShipment(request: BookingRequest): Promise<BookingResponse>;

  /**
   * Fetches the latest tracking status for a given AWB
   */
  trackShipment(awbNumber: string): Promise<TrackingResponse>;
}
