import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { syncSingleShipment, syncTrackingStatuses } from '../jobs/tracking.cron';

/**
 * Public shipment tracking lookup endpoint
 * GET /api/public/track/:awb
 */
export const getPublicTracking = async (req: Request, res: Response) => {
  try {
    const awb = String(req.params.awb || '');
    if (!awb) {
      return res.status(400).json({ error: 'AWB number is required' });
    }

    const shipment = await prisma.shipment.findFirst({
      where: { awb_number: awb },
      include: {
        courier: {
          select: { courier_name: true }
        },
        status_history: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const s: any = shipment;

    // Return only safe customer-facing data
    const trackingData = {
      awb_number: s.awb_number,
      status: s.internal_status,
      booking_date: s.booking_date,
      expected_delivery: s.delivery_date,
      delivered_at: s.deliveredAt,
      receiver_name: s.receiver_name,
      destination_city: s.city,
      destination_state: s.state,
      courier_name: s.courier?.courier_name || 'Standard',
      podImageUrl: s.podImageUrl,
      podSignature: s.podSignature,
      history: s.status_history || []
    };

    res.json(trackingData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve tracking data', details: error.message });
  }
};

/**
 * On-demand manual live status sync for a single AWB
 * POST /api/tracking/sync/:awb
 */
export const syncShipmentTracking = async (req: Request, res: Response) => {
  try {
    const awb = String(req.params.awb || '');
    if (!awb) {
      return res.status(400).json({ error: 'AWB number is required' });
    }

    const result = await syncSingleShipment(awb);
    res.json(result);
  } catch (error: any) {
    console.error('Error syncing single shipment tracking:', error);
    res.status(500).json({ error: 'Failed to sync tracking status', details: error.message });
  }
};

/**
 * On-demand manual live status sync for all active shipments
 * POST /api/tracking/sync-all
 */
export const syncAllActiveShipments = async (req: Request, res: Response) => {
  try {
    const result = await syncTrackingStatuses();
    res.json({
      success: true,
      message: `Background tracking sync triggered successfully`,
      result
    });
  } catch (error: any) {
    console.error('Error syncing all active shipments tracking:', error);
    res.status(500).json({ error: 'Failed to trigger tracking sync', details: error.message });
  }
};
