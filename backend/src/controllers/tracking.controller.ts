import { Request, Response } from 'express';
import { prisma } from '../prisma';

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

