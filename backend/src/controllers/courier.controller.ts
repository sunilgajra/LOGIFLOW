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
        rateCards: {
          where: { type: 'COURIER' },
          select: { id: true, name: true, type: true }
        }
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

export const updateCourier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const courier = await prisma.courierPartner.update({
      where: { id, company_id: req.user?.company_id as string },
      data: {
        courier_name: data.courier_name,
        contact_person: data.contact_person,
        phone: data.phone,
        email: data.email,
        account_number: data.account_number,
        gst_number: data.gst_number,
        billing_cycle: data.billing_cycle,
        status: data.status,
        notes: data.notes,
        api_credentials: data.api_credentials,
        agreement_document: data.agreement_document,
      }
    });
    res.json(courier);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update courier', details: error.message });
  }
};
