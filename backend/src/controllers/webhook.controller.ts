import { Request, Response } from 'express';
import { prisma } from '../prisma';

/**
 * Normalizes raw courier status codes/strings to LogiFlow standard internal status values.
 */
function normalizeStatus(rawStatus: string): string {
  const statusUpper = (rawStatus || '').toUpperCase().trim();
  
  if (statusUpper.includes('DELIVERED') || statusUpper === 'DL' || statusUpper === 'FULFILLED') {
    return 'DELIVERED';
  }
  if (statusUpper.includes('OUT FOR DELIVERY') || statusUpper.includes('OFD') || statusUpper.includes('DISPATCHED') || statusUpper === 'UD') {
    return 'OUT_FOR_DELIVERY';
  }
  if (statusUpper.includes('RTO') || statusUpper.includes('RETURN') || statusUpper === 'RT' || statusUpper === 'DTO') {
    return 'RTO';
  }
  if (statusUpper.includes('NDR') || statusUpper.includes('UNDELIVERED') || statusUpper.includes('EXCEPTION') || statusUpper.includes('FAILED') || statusUpper === 'EX') {
    return 'NDR';
  }
  if (statusUpper.includes('BOOKED') || statusUpper.includes('MANIFEST') || statusUpper.includes('PICKUP') || statusUpper === 'BK') {
    return 'BOOKED';
  }
  
  return 'IN_TRANSIT';
}

/**
 * Webhook handler for Delhivery, BlueDart & generic courier webhooks.
 * Public endpoints:
 * POST /api/webhooks/courier
 * POST /api/webhooks/delhivery
 * POST /api/webhooks/bluedart
 */
export const handleCourierWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    let awbNumber = '';
    let rawStatus = '';
    let location = '';
    let remarks = '';
    let podUrl = '';
    let eventTime: Date = new Date();

    if (payload?.ScanDetail) {
      // Delhivery Push Webhook Format
      const detail = payload.ScanDetail;
      awbNumber = detail.Waybill || detail.AWB || detail.waybill || '';
      rawStatus = detail.Status?.Status || detail.Scan || detail.StatusType || '';
      location = detail.ScannedLocation || detail.Location || '';
      remarks = detail.Status?.Instructions || detail.Instructions || detail.Remarks || '';
      eventTime = detail.ScanDateTime ? new Date(detail.ScanDateTime) : new Date();
    } else if (payload?.ShipmentDetails || payload?.AWBNo) {
      // BlueDart Push Webhook Format
      const details = payload.ShipmentDetails || payload;
      awbNumber = details.AWBNo || details.WayBillNo || details.awb || '';
      rawStatus = details.Status || details.ScanType || details.StatusType || '';
      location = details.Location || details.ScannedLocation || '';
      remarks = details.Remarks || details.Instructions || details.StatusInformation || '';
      eventTime = details.ScanDate ? new Date(`${details.ScanDate} ${details.ScanTime || ''}`) : new Date();
    } else if (payload?.awb || payload?.awb_number || payload?.waybill) {
      // Standard JSON format
      awbNumber = payload.awb || payload.awb_number || payload.waybill;
      rawStatus = payload.status || payload.courier_status || payload.raw_status || '';
      location = payload.location || payload.hub || '';
      remarks = payload.remarks || payload.instructions || '';
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
      where: { awb_number: String(awbNumber) }
    });

    if (!shipment) {
      return res.status(404).json({ error: `Shipment with AWB ${awbNumber} not found` });
    }

    const internalStatus = normalizeStatus(rawStatus);

    // Build update object
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
    } else if (internalStatus === 'NDR') {
      updateData.delivery_attempt = (shipment.delivery_attempt || 0) + 1;
      updateData.exception_reason = remarks || rawStatus || 'Delivery exception flagged by courier';
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
          location,
          remarks
        })
      }
    });

    console.log(`[Webhook] Updated AWB ${awbNumber} -> Status: ${internalStatus} (${rawStatus})`);

    res.json({
      success: true,
      message: `Webhook processed for AWB ${awbNumber}`,
      awb: awbNumber,
      status: internalStatus,
      raw_status: rawStatus
    });

  } catch (error: any) {
    console.error('[Webhook Error]:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook', 
      details: error.message 
    });
  }
};
