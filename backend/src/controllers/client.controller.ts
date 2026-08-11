import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const getClients = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      where: { company_id: req.user?.company_id },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { shipments: true },
        },
      }
    });
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
  }
};

export const createClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const client = await prisma.client.create({
      data: {
        ...data,
        company_id: req.user?.company_id,
      }
    });
    res.status(201).json(client);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create client', details: error.message });
  }
};
