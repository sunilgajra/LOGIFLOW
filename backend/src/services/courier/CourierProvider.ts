export interface CourierCapabilities {
  serviceability: boolean;
  awbGeneration: boolean;
  labelGeneration: boolean;
  pickupRequest: boolean;
  tracking: boolean;
  ndrManagement: boolean;
  cancellation: boolean;
}

export interface BookingRequest {
  shipmentId: string;
  companyId?: string;
  courierId?: string;
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

export interface ServiceabilityResponse {
  serviceable: boolean;
  courierName: string;
  estimatedDeliveryDays?: number;
  codAvailable?: boolean;
  rawResponse?: any;
  error?: string;
}

export interface PickupRequestData {
  pickupId: string;
  facilityName: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  phone: string;
  pickupDate: string;
  pickupSlot?: string;
  packageCount: number;
}

export interface PickupResponse {
  success: boolean;
  courierPickupRef?: string;
  scheduledTime?: string;
  rawResponse?: any;
  error?: string;
}

export interface NDRActionData {
  awbNumber: string;
  action: 'REATTEMPT' | 'RTO' | 'ADDRESS_UPDATE';
  remarks?: string;
  newAddress?: string;
  newPhone?: string;
  reattemptDate?: string;
}

export interface NDRResponse {
  success: boolean;
  message?: string;
  rawResponse?: any;
  error?: string;
}

export interface CancelResponse {
  success: boolean;
  message?: string;
  rawResponse?: any;
  error?: string;
}

export interface ICourierProvider {
  capabilities: CourierCapabilities;

  checkServiceability(originPin: string, destPin: string, weight: number, isCod?: boolean): Promise<ServiceabilityResponse>;
  bookShipment(request: BookingRequest): Promise<BookingResponse>;
  trackShipment(awbNumber: string): Promise<TrackingResponse>;
  requestPickup?(pickupData: PickupRequestData): Promise<PickupResponse>;
  processNDRAction?(ndrData: NDRActionData): Promise<NDRResponse>;
  cancelShipment?(awbNumber: string): Promise<CancelResponse>;
  generateLabel?(waybill: string, pdfSize?: 'A4' | '4R', pdf?: boolean): Promise<{ labelUrl: string; rawData?: any }>;
}
