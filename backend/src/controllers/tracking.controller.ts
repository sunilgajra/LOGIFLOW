import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getPublicTracking = async (req: Request, res: Response) => {
  try {
    const { awb } = req.params;
    if (!awb) {
      return res.status(400).json({ error: 'AWB number is required' });
    }

    const shipment = await prisma.shipment.findUnique({
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

    // Return only safe customer-facing data
    const trackingData = {
      awb_number: shipment.awb_number,
      status: shipment.internal_status,
      booking_date: shipment.booking_date,
      expected_delivery: shipment.expected_delivery_date,
      delivered_at: shipment.deliveredAt,
      receiver_name: shipment.receiver_name,
      destination_city: shipment.city,
      destination_state: shipment.state,
      courier_name: shipment.courier?.courier_name || 'Standard',
      podImageUrl: shipment.podImageUrl,
      podSignature: shipment.podSignature,
      history: shipment.status_history
    };

    res.json(trackingData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve tracking data', details: error.message });
  }
};
