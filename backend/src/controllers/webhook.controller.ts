import { Request, Response } from 'express';
import { prisma } from '../prisma';

/**
 * Normalizes raw courier status codes to internal status values.
 */
function normalizeStatus(rawStatus: string): string {
  const statusUpper = (rawStatus || '').toUpperCase().trim();
  
  if (['DL', 'DELIVERED', 'FULFILLED'].includes(statusUpper) || statusUpper.includes('DELIVERED')) {
    return 'DELIVERED';
  }
  if (['UD', 'OUT FOR DELIVERY', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(statusUpper) || statusUpper.includes('OUT FOR DELIVERY')) {
    return 'OUT_FOR_DELIVERY';
  }
  if (['RT', 'RTO', 'RETURNED', 'RETURN TO ORIGIN'].includes(statusUpper) || statusUpper.includes('RTO')) {
    return 'RTO';
  }
  if (['EX', 'EXCEPTION', 'NDR', 'UNDELIVERED'].includes(statusUpper) || statusUpper.includes('UNDELIVERED')) {
    return 'EXCEPTION';
  }
  if (['BK', 'MANIFESTED', 'BOOKED'].includes(statusUpper)) {
    return 'BOOKED';
  }
  
  return 'IN_TRANSIT';
}

/**
 * Webhook handler for Delhivery & generic courier webhooks.
 * Public endpoint: POST /api/webhooks/courier
 */
export const handleCourierWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Support both Delhivery ScanDetail format and standard LogiFlow webhook format
    let awbNumber = '';
    let rawStatus = '';
    let location = '';
    let remarks = '';
    let podUrl = '';
    let eventTime: Date = new Date();

    if (payload?.ScanDetail) {
      // Delhivery Push Webhook Format
      const detail = payload.ScanDetail;
      awbNumber = detail.Waybill || detail.AWB || '';
      rawStatus = detail.Status?.Status || detail.Scan || '';
      location = detail.ScannedLocation || detail.Location || '';
      remarks = detail.Status?.Instructions || detail.Instructions || '';
      eventTime = detail.ScanDateTime ? new Date(detail.ScanDateTime) : new Date();
    } else if (payload?.awb || payload?.awb_number) {
      // Standard JSON format
      awbNumber = payload.awb || payload.awb_number;
      rawStatus = payload.status || payload.courier_status || '';
      location = payload.location || '';
      remarks = payload.remarks || '';
      podUrl = payload.pod_url || payload.podImageUrl || '';
      eventTime = payload.timestamp ? new Date(payload.timestamp) : new Date();
    } else {
      return res.status(400).json({ 
        error: 'Invalid webhook payload structure', 
        received: payload 
      });
    }

    if (!awbNumber) {
      return res.status(400).json({ error: 'AWB number is missing in webhook payload' });
    }

    // Find target shipment
    const shipment = await prisma.shipment.findFirst({
      where: { awb_number: awbNumber }
    });

    if (!shipment) {
      return res.status(404).json({ error: `Shipment with AWB ${awbNumber} not found` });
    }

    const internalStatus = normalizeStatus(rawStatus);

    // Update shipment details
    const updateData: any = {
      courier_status: rawStatus,
      internal_status: internalStatus,
      updated_at: new Date(),
    };

    if (remarks) {
      updateData.remarks = remarks;
    }

    if (internalStatus === 'DELIVERED') {
      updateData.deliveredAt = eventTime;
      if (podUrl) {
        updateData.podImageUrl = podUrl;
      }
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData
    });

    // Record status history event
    await prisma.shipmentStatusHistory.create({
      data: {
        shipment_id: shipment.id,
        status: internalStatus,
        raw_status: rawStatus,
        location: location || 'Transit Hub',
        timestamp: eventTime
      }
    });

    // Create Audit Log entry
    await prisma.auditLog.create({
      data: {
        company_id: shipment.company_id,
        action: 'WEBHOOK_STATUS_UPDATE',
        entity_type: 'SHIPMENT',
        entity_id: shipment.id,
        details: JSON.stringify({
          awb: awbNumber,
          old_status: shipment.internal_status,
          new_status: internalStatus,
          raw_status: rawStatus,
          location
        })
      }
    });

    console.log(`[Webhook] Updated AWB ${awbNumber} -> Status: ${internalStatus} (${rawStatus})`);

    res.json({
      success: true,
      message: `Webhook processed for AWB ${awbNumber}`,
      awb: awbNumber,
      status: internalStatus
    });

  } catch (error: any) {
    console.error('[Webhook Error]:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook', 
      details: error.message 
    });
  }
};
