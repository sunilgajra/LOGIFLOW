import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const getShipments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { status, clientId, courierId, search } = req.query;

    const where: any = { company_id: req.user?.company_id };

    if (status) where.internal_status = status;
    if (clientId) where.client_id = clientId;
    if (courierId) where.courier_id = courierId;
    if (search) {
      where.OR = [
        { awb_number: { contains: search as string, mode: 'insensitive' } },
        { receiver_name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { booking_date: 'desc' },
        include: {
          client: { select: { company_name: true } },
          courier: { select: { courier_name: true } },
        }
      }),
      prisma.shipment.count({ where })
    ]);

    res.json({
      data: shipments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch shipments', details: error.message });
  }
};
