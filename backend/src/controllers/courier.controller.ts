import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const getCouriers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const couriers = await prisma.courierPartner.findMany({
      where: { company_id: req.user?.company_id },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { shipments: true },
        },
      }
    });
    res.json(couriers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch couriers', details: error.message });
  }
};

export const createCourier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const courier = await prisma.courierPartner.create({
      data: {
        ...data,
        company_id: req.user?.company_id,
      }
    });
    res.status(201).json(courier);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create courier', details: error.message });
  }
};
