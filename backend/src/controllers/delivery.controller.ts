import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const deliverShipment = async (req: Request, res: Response) => {
  try {
    const awb = String(req.params.awb || '');
    const { podImageUrl, podSignature, receivedBy } = req.body;
    // @ts-ignore
    const user = req.user;

    const shipment = await prisma.shipment.findFirst({
      where: {
        awb_number: awb,
        company_id: user?.company_id,
      },
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        internal_status: 'DELIVERED',
        courier_status: 'Delivered',
        podImageUrl: podImageUrl || null,
        podSignature: podSignature || null,
        receiver_name: receivedBy || shipment.receiver_name,
        deliveredAt: new Date(),
      },
    });

    await prisma.shipmentStatusHistory.create({
      data: {
        shipment_id: shipment.id,
        status: 'DELIVERED',
        raw_status: 'Delivered via E-POD',
        timestamp: new Date(),
      },
    });

    res.json(updatedShipment);
  } catch (error: any) {
    console.error('Error delivering shipment:', error);
    res.status(500).json({ error: 'Failed to mark shipment as delivered', details: error.message });
  }
};
