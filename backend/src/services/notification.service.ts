import { prisma } from '../prisma';

export interface NotificationEventPayload {
  awb_number: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_email?: string;
  sender_name?: string;
  courier_name?: string;
  internal_status: string;
  cod_amount?: number;
  exception_reason?: string;
  deliveredAt?: Date | string;
}

export const generateWhatsAppMessage = (payload: NotificationEventPayload): { url: string; text: string } => {
  const phone = payload.receiver_phone ? payload.receiver_phone.replace(/[^0-9]/g, '') : '';
  const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
  const trackingUrl = `https://logiflow-black.vercel.app/track?awb=${payload.awb_number}`;
  const receiver = payload.receiver_name || 'Customer';
  const courier = payload.courier_name || 'LogiFlow Express';

  let text = '';
  switch (payload.internal_status) {
    case 'OUT_FOR_DELIVERY':
      const codText = payload.cod_amount && payload.cod_amount > 0 ? ` Please keep Cash on Delivery amount ₹${payload.cod_amount} ready.` : ' Payment is prepaid.';
      text = `📦 *LogiFlow Delivery Update*\n\nHi ${receiver}, your package (*AWB: ${payload.awb_number}*) is *OUT FOR DELIVERY* today via ${courier}.${codText}\n\nTrack Live: ${trackingUrl}`;
      break;

    case 'DELIVERED':
      text = `✅ *Package Delivered Successfully!*\n\nHi ${receiver}, your shipment (*AWB: ${payload.awb_number}*) has been delivered successfully. Thank you for using LogiFlow Logistics!\n\nView E-POD: ${trackingUrl}`;
      break;

    case 'NDR_EXCEPTION':
    case 'EXCEPTION':
    case 'FAILED_ATTEMPT':
      const reason = payload.exception_reason || 'Customer Unavailable / Address Issue';
      text = `⚠️ *Delivery Attempt Notification*\n\nHi ${receiver}, delivery attempt for your package (*AWB: ${payload.awb_number}*) failed due to: *${reason}*.\n\nClick here to reschedule delivery: ${trackingUrl}`;
      break;

    case 'BOOKED':
    default:
      text = `🚚 *LogiFlow Order Confirmation*\n\nHi ${receiver}, your shipment (*AWB: ${payload.awb_number}*) has been booked with ${courier}.\n\nTrack Order: ${trackingUrl}`;
      break;
  }

  const encodedText = encodeURIComponent(text);
  const url = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;

  return { url, text };
};

export const triggerAutoNotification = async (payload: NotificationEventPayload) => {
  try {
    const waData = generateWhatsAppMessage(payload);
    console.log(`[Notification Engine] Triggered for AWB ${payload.awb_number} (${payload.internal_status}):`, waData.text);

    // Save notification log to AuditLog in database
    await prisma.auditLog.create({
      data: {
        company_id: 'default',
        action: `NOTIFICATION_${payload.internal_status}`,
        user_id: 'system',
        details: JSON.stringify({
          awb: payload.awb_number,
          receiver: payload.receiver_name,
          phone: payload.receiver_phone,
          status: payload.internal_status,
          whatsappUrl: waData.url,
          message: waData.text,
          sentAt: new Date()
        })
      }
    }).catch(() => {});

    return waData;
  } catch (error) {
    console.error('Error triggering auto notification:', error);
    return null;
  }
};
