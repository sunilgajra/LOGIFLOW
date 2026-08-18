export interface BookingRequest {
  shipmentId: string;
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  senderPincode?: string;
  senderCity?: string;
  senderState?: string;
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  receiverPincode?: string;
  receiverCity?: string;
  receiverState?: string;
  weight: number;
  pieces: number;
  isCod: boolean;
  codAmount: number;
  declaredValue?: number;
  productDescription?: string;
  clientRefNo?: string;
}

export interface BookingResponse {
  success: boolean;
  awbNumber?: string;
  labelUrl?: string;
  rawResponse?: any;
  error?: string;
}

export interface TrackingScan {
  status: string;
  location?: string;
  timestamp?: Date;
  remarks?: string;
}

export interface TrackingResponse {
  success: boolean;
  status?: string; // Standardized internal status (e.g., BOOKED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, RTO, NDR)
  rawStatus?: string;
  location?: string;
  timestamp?: Date;
  remarks?: string;
  scans?: TrackingScan[];
  rawResponse?: any;
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

