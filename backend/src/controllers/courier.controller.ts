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
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const data = req.body;
    const courier = await prisma.courierPartner.create({
      data: {
        company_id: companyId,
        courier_id: data.courier_id || `CP-${Math.floor(100 + Math.random() * 900)}`,
        courier_name: data.courier_name || 'New Courier Partner',
        contact_person: data.contact_person || null,
        phone: data.phone || null,
        email: data.email || null,
        account_number: data.account_number || null,
        billing_cycle: data.billing_cycle || null,
        gst_number: data.gst_number || null,
        status: data.status || 'ACTIVE',
        notes: data.notes || null,
        api_credentials: typeof data.api_credentials === 'string' ? data.api_credentials : JSON.stringify(data.api_credentials || {}),
        agreement_document: data.agreement_document || null,
      }
    });
    res.status(201).json(courier);
  } catch (error: any) {
    console.error('Failed to create courier:', error);
    res.status(500).json({ error: 'Failed to create courier', details: error.message });
  }
};

export const updateCourier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.courierPartner.findFirst({
      where: { id, company_id: companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Courier partner not found' });
    }

    const data = req.body;
    const courier = await prisma.courierPartner.update({
      where: { id },
      data: {
        courier_name: data.courier_name !== undefined ? data.courier_name : existing.courier_name,
        contact_person: data.contact_person !== undefined ? data.contact_person || null : existing.contact_person,
        phone: data.phone !== undefined ? data.phone || null : existing.phone,
        email: data.email !== undefined ? data.email || null : existing.email,
        account_number: data.account_number !== undefined ? data.account_number || null : existing.account_number,
        gst_number: data.gst_number !== undefined ? data.gst_number || null : existing.gst_number,
        billing_cycle: data.billing_cycle !== undefined ? data.billing_cycle || null : existing.billing_cycle,
        status: data.status !== undefined ? data.status : existing.status,
        notes: data.notes !== undefined ? data.notes || null : existing.notes,
        api_credentials: data.api_credentials !== undefined ? (typeof data.api_credentials === 'string' ? data.api_credentials : JSON.stringify(data.api_credentials)) : existing.api_credentials,
        agreement_document: data.agreement_document !== undefined ? data.agreement_document || null : existing.agreement_document,
      }
    });
    res.json(courier);
  } catch (error: any) {
    console.error('Failed to update courier:', error);
    res.status(500).json({ error: 'Failed to update courier', details: error.message });
  }
};

export const deleteCourier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.rateCard.deleteMany({
      where: { courier_id: id, company_id: companyId }
    });

    const deleted = await prisma.courierPartner.deleteMany({
      where: { id, company_id: companyId }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Courier partner not found or unauthorized' });
    }

    res.json({ success: true, message: 'Courier partner deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete courier:', error);
    res.status(500).json({ error: 'Failed to delete courier partner', details: error.message });
  }
};
