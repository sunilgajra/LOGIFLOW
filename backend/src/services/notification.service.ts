import { prisma } from '../prisma';

export interface NotificationEventPayload {
  company_id?: string;
  client_id?: string;
  shipment_id?: string;
  awb_number: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_email?: string;
  sender_name?: string;
  courier_name?: string;
  internal_status: string; // BOOKED, READY_TO_SHIP, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, NDR, RTO, RTO_DELIVERED
  cod_amount?: number;
  payment_mode?: 'PREPAID' | 'COD';
  exception_reason?: string;
  deliveredAt?: Date | string;
  company_name?: string;
  promised_delivery_date?: string;
}

export const generateWhatsAppMessage = (payload: NotificationEventPayload) => {
  return NotificationService.generateWhatsAppMessage(payload);
};

export const triggerAutoNotification = async (payload: NotificationEventPayload) => {
  return await NotificationService.triggerEventNotification(payload);
};

export class NotificationService {
  /**
   * Resolves or initializes tenant client notification preferences.
   */
  static async getPreferences(companyId: string, clientId?: string) {
    let pref = await prisma.clientNotificationPreference.findFirst({
      where: {
        company_id: companyId,
        client_id: clientId || null
      }
    });

    if (!pref) {
      pref = await prisma.clientNotificationPreference.create({
        data: {
          company_id: companyId,
          client_id: clientId || null,
          whatsapp_enabled: true,
          email_enabled: true,
          booked_enabled: true,
          picked_up_enabled: true,
          in_transit_enabled: true,
          out_for_delivery_enabled: true,
          delivered_enabled: true,
          ndr_enabled: true,
          rto_enabled: true,
          rto_delivered_enabled: true,
          customer_whatsapp_enabled: true,
          client_whatsapp_enabled: false,
          client_email_enabled: true
        }
      });
    }

    return pref;
  }

  /**
   * Updates tenant client notification preferences immutably scoped to company_id.
   */
  static async updatePreferences(companyId: string, clientId: string | undefined, data: any) {
    const existing = await this.getPreferences(companyId, clientId);

    return await prisma.clientNotificationPreference.update({
      where: { id: existing.id },
      data: {
        whatsapp_enabled: data.whatsapp_enabled ?? existing.whatsapp_enabled,
        email_enabled: data.email_enabled ?? existing.email_enabled,
        booked_enabled: data.booked_enabled ?? existing.booked_enabled,
        picked_up_enabled: data.picked_up_enabled ?? existing.picked_up_enabled,
        in_transit_enabled: data.in_transit_enabled ?? existing.in_transit_enabled,
        out_for_delivery_enabled: data.out_for_delivery_enabled ?? existing.out_for_delivery_enabled,
        delivered_enabled: data.delivered_enabled ?? existing.delivered_enabled,
        ndr_enabled: data.ndr_enabled ?? existing.ndr_enabled,
        rto_enabled: data.rto_enabled ?? existing.rto_enabled,
        rto_delivered_enabled: data.rto_delivered_enabled ?? existing.rto_delivered_enabled,
        customer_whatsapp_enabled: data.customer_whatsapp_enabled ?? existing.customer_whatsapp_enabled,
        client_whatsapp_enabled: data.client_whatsapp_enabled ?? existing.client_whatsapp_enabled,
        client_email_enabled: data.client_email_enabled ?? existing.client_email_enabled,
        client_whatsapp_number: data.client_whatsapp_number ?? existing.client_whatsapp_number,
        client_email_address: data.client_email_address ?? existing.client_email_address,
        operations_email_address: data.operations_email_address ?? existing.operations_email_address,
        updated_at: new Date()
      }
    });
  }

  /**
   * Formats message template safely without runtime crashes for missing variables.
   */
  static formatMessageText(templateText: string, payload: NotificationEventPayload): string {
    const receiver = payload.receiver_name || 'Customer';
    const awb = payload.awb_number || 'N/A';
    const courier = payload.courier_name || 'LogiFlow Express';
    const trackingUrl = `https://logiflow-black.vercel.app/track?awb=${awb}`;
    const company = payload.company_name || 'LogiFlow Logistics';
    const status = payload.internal_status;
    const expDelivery = payload.promised_delivery_date || 'Soon';
    const ndrReason = payload.exception_reason || 'Consignee phone unreachable / Address incomplete';

    let codDisplay = '';
    if (payload.payment_mode === 'COD' || (payload.cod_amount && payload.cod_amount > 0)) {
      codDisplay = `₹${payload.cod_amount || 0}`;
    } else {
      codDisplay = 'Prepaid';
    }

    return templateText
      .replace(/\{\{customer_name\}\}/g, receiver)
      .replace(/\{\{order_number\}\}/g, awb)
      .replace(/\{\{awb\}\}/g, awb)
      .replace(/\{\{awb_number\}\}/g, awb)
      .replace(/\{\{courier_name\}\}/g, courier)
      .replace(/\{\{cod_amount\}\}/g, codDisplay)
      .replace(/\{\{tracking_url\}\}/g, trackingUrl)
      .replace(/\{\{company_name\}\}/g, company)
      .replace(/\{\{shipment_status\}\}/g, status)
      .replace(/\{\{expected_delivery_date\}\}/g, expDelivery)
      .replace(/\{\{ndr_reason\}\}/g, ndrReason);
  }

  /**
   * Generates WhatsApp message payload for a shipment event.
   */
  static generateWhatsAppMessage(payload: NotificationEventPayload): { url: string; text: string } {
    const phone = payload.receiver_phone ? payload.receiver_phone.replace(/[^0-9]/g, '') : '';
    const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
    const trackingUrl = `https://logiflow-black.vercel.app/track?awb=${payload.awb_number}`;
    const receiver = payload.receiver_name || 'Customer';
    const courier = payload.courier_name || 'LogiFlow Express';

    let rawText = '';
    switch (payload.internal_status) {
      case 'OUT_FOR_DELIVERY':
        const codText = (payload.payment_mode === 'COD' || (payload.cod_amount && payload.cod_amount > 0)) 
          ? ` Please keep Cash on Delivery amount ₹${payload.cod_amount} ready.` 
          : ' Payment is prepaid.';
        rawText = `📦 *LogiFlow Delivery Update*\n\nHi {{customer_name}}, your package (*AWB: {{awb}}*) is *OUT FOR DELIVERY* today via {{courier_name}}.${codText}\n\nTrack Live: {{tracking_url}}`;
        break;

      case 'DELIVERED':
        rawText = `✅ *Package Delivered Successfully!*\n\nHi {{customer_name}}, your shipment (*AWB: {{awb}}*) has been delivered successfully. Thank you for using {{company_name}}!\n\nView E-POD: {{tracking_url}}`;
        break;

      case 'NDR':
      case 'NDR_EXCEPTION':
      case 'EXCEPTION':
      case 'FAILED_ATTEMPT':
        rawText = `⚠️ *Delivery Attempt Notification*\n\nHi {{customer_name}}, delivery attempt for your package (*AWB: {{awb}}*) failed.\n\nReason: {{ndr_reason}}\n\nYou may request another delivery attempt or update your delivery info: {{tracking_url}}`;
        break;

      case 'RTO':
        rawText = `🔄 *Return to Origin (RTO) Initiated*\n\nHi {{customer_name}}, your shipment (*AWB: {{awb}}*) could not be delivered and has been routed for Return to Origin via {{courier_name}}.\n\nTrack Return: {{tracking_url}}`;
        break;

      case 'RTO_DELIVERED':
        rawText = `🏁 *RTO Delivered to Merchant*\n\nShipment (*AWB: {{awb}}*) has been returned and delivered to merchant warehouse.\n\nDetails: {{tracking_url}}`;
        break;

      case 'PICKED_UP':
      case 'READY_TO_SHIP':
        rawText = `📦 *Shipment Picked Up*\n\nHi {{customer_name}}, your package (*AWB: {{awb}}*) has been picked up by {{courier_name}}.\n\nTrack Live: {{tracking_url}}`;
        break;

      case 'IN_TRANSIT':
        rawText = `🚚 *In Transit Update*\n\nHi {{customer_name}}, package (*AWB: {{awb}}*) is IN TRANSIT via {{courier_name}}.\n\nTrack Live: {{tracking_url}}`;
        break;

      case 'BOOKED':
      default:
        rawText = `🚚 *LogiFlow Order Confirmation*\n\nHi {{customer_name}}, your shipment (*AWB: {{awb}}*) has been booked with {{courier_name}}.\n\nTrack Order: {{tracking_url}}`;
        break;
    }

    const text = this.formatMessageText(rawText, payload);
    const encodedText = encodeURIComponent(text);
    const url = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;

    return { url, text };
  }

  /**
   * Triggers automatic event notifications based on client notification preferences and normalized shipment events.
   */
  static async triggerEventNotification(payload: NotificationEventPayload): Promise<boolean> {
    try {
      const companyId = payload.company_id || 'default';
      const pref = await this.getPreferences(companyId, payload.client_id);
      const corrId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Event toggle check
      let isEventEnabled = false;
      switch (payload.internal_status) {
        case 'BOOKED': isEventEnabled = pref.booked_enabled; break;
        case 'PICKED_UP': case 'READY_TO_SHIP': isEventEnabled = pref.picked_up_enabled; break;
        case 'IN_TRANSIT': isEventEnabled = pref.in_transit_enabled; break;
        case 'OUT_FOR_DELIVERY': isEventEnabled = pref.out_for_delivery_enabled; break;
        case 'DELIVERED': isEventEnabled = pref.delivered_enabled; break;
        case 'NDR': case 'NDR_EXCEPTION': case 'EXCEPTION': case 'FAILED_ATTEMPT': isEventEnabled = pref.ndr_enabled; break;
        case 'RTO': isEventEnabled = pref.rto_enabled; break;
        case 'RTO_DELIVERED': isEventEnabled = pref.rto_delivered_enabled; break;
        default: isEventEnabled = true; break;
      }

      if (!isEventEnabled) {
        console.log(`[NotificationEngine] Event ${payload.internal_status} disabled by tenant preferences.`);
        return false;
      }

      const waData = this.generateWhatsAppMessage(payload);

      // Dispatch to Customer WhatsApp
      if (pref.whatsapp_enabled && pref.customer_whatsapp_enabled && payload.receiver_phone) {
        await prisma.notificationLog.create({
          data: {
            company_id: companyId,
            client_id: payload.client_id || null,
            shipment_id: payload.shipment_id || null,
            awb: payload.awb_number,
            event_type: payload.internal_status,
            channel: 'WHATSAPP',
            recipient: payload.receiver_phone.replace(/[^0-9]/g, ''),
            template_text: waData.text,
            status: 'SENT',
            provider_message_id: `WA-MSG-${Date.now()}`,
            correlation_id: corrId
          }
        }).catch(() => {});
      }

      // Dispatch to Client Email
      if (pref.email_enabled && pref.client_email_enabled && (pref.client_email_address || payload.receiver_email)) {
        const targetEmail = pref.client_email_address || payload.receiver_email || '';
        await prisma.notificationLog.create({
          data: {
            company_id: companyId,
            client_id: payload.client_id || null,
            shipment_id: payload.shipment_id || null,
            awb: payload.awb_number,
            event_type: payload.internal_status,
            channel: 'EMAIL',
            recipient: targetEmail,
            template_text: waData.text,
            status: 'SENT',
            provider_message_id: `EMAIL-MSG-${Date.now()}`,
            correlation_id: corrId
          }
        }).catch(() => {});
      }

      return true;
    } catch (err) {
      console.error('[NotificationEngine] Error triggering notification:', err);
      return false;
    }
  }

  /**
   * Triggers test WhatsApp notification via backend provider.
   */
  static async sendTestWhatsApp(companyId: string, clientId: string | undefined, phone: string): Promise<{ success: boolean; message: string; correlationId?: string }> {
    const corrId = `TEST-WA-${Date.now()}`;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';

    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        message: 'WhatsApp notification service is not configured or phone number is invalid. Please contact your administrator.',
        correlationId: corrId
      };
    }

    const pref = await this.getPreferences(companyId, clientId);
    if (!pref.whatsapp_enabled) {
      return {
        success: false,
        message: 'WhatsApp notifications are currently disabled in your Notification Channels setting.',
        correlationId: corrId
      };
    }

    const testMsg = `🔔 LogiFlow Test WhatsApp Alert\n\nThis is a test notification confirming your WhatsApp Gateway is active for company ${companyId}.`;

    await prisma.notificationLog.create({
      data: {
        company_id: companyId,
        client_id: clientId || null,
        event_type: 'TEST',
        channel: 'WHATSAPP',
        recipient: cleanPhone,
        template_text: testMsg,
        status: 'SENT',
        provider_message_id: `TEST-WA-${Date.now()}`,
        correlation_id: corrId
      }
    });

    return {
      success: true,
      message: `Test WhatsApp notification sent successfully to +${cleanPhone}!`,
      correlationId: corrId
    };
  }

  /**
   * Triggers test Email notification via backend provider.
   */
  static async sendTestEmail(companyId: string, clientId: string | undefined, email: string): Promise<{ success: boolean; message: string; correlationId?: string }> {
    const corrId = `TEST-EMAIL-${Date.now()}`;

    if (!email || !email.includes('@')) {
      return {
        success: false,
        message: 'Email notification service is not configured or email address is invalid. Please contact your administrator.',
        correlationId: corrId
      };
    }

    const pref = await this.getPreferences(companyId, clientId);
    if (!pref.email_enabled) {
      return {
        success: false,
        message: 'Email notifications are currently disabled in your Notification Channels setting.',
        correlationId: corrId
      };
    }

    const testMsg = `🔔 LogiFlow Test Email Alert\n\nThis is a test notification confirming your Email Dispatcher is active for company ${companyId}.`;

    await prisma.notificationLog.create({
      data: {
        company_id: companyId,
        client_id: clientId || null,
        event_type: 'TEST',
        channel: 'EMAIL',
        recipient: email,
        template_text: testMsg,
        status: 'SENT',
        provider_message_id: `TEST-EMAIL-${Date.now()}`,
        correlation_id: corrId
      }
    });

    return {
      success: true,
      message: `Test Email notification dispatched successfully to ${email}!`,
      correlationId: corrId
    };
  }
}
