import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const getPickupRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const where: any = { company_id: String(companyId) };
    if (req.user?.role === 'CLIENT' && req.user?.client_id) {
      where.client_id = req.user.client_id;
    }

    const requests = await prisma.pickupRequest.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { warehouse: true }
    });

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch pickup requests', details: error.message });
  }
};

export const createPickupRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      warehouse_id,
      facility_name,
      pickup_date,
      pickup_slot,
      box_count,
      lrn_numbers,
      client_id
    } = req.body;

    if (!facility_name || !pickup_date || !pickup_slot) {
      return res.status(400).json({ error: 'Missing required pickup details (facility, date, or slot)' });
    }

    const assignedClientId = req.user?.role === 'CLIENT' ? req.user.client_id : (client_id || null);

    // Generate 9-digit Pickup ID (e.g. 314936152)
    const count = await prisma.pickupRequest.count({
      where: { company_id: String(companyId) }
    });
    const pickupId = String(314900000 + count + Math.floor(Math.random() * 900));

    const pickupRequest = await prisma.pickupRequest.create({
      data: {
        company_id: String(companyId),
        client_id: assignedClientId,
        pickup_id: pickupId,
        warehouse_id: warehouse_id || null,
        facility_name,
        pickup_date: new Date(pickup_date),
        pickup_slot: pickup_slot || '10:00:00 - 14:00:00',
        box_count: parseInt(box_count) || 1,
        lrn_numbers: Array.isArray(lrn_numbers) ? lrn_numbers.join(',') : lrn_numbers || null,
        status: 'Scheduled',
        escalated: false,
        otp_verified: false
      }
    });

    res.status(201).json(pickupRequest);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create pickup request', details: error.message });
  }
};

export const updatePickupRequestStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { status, escalated, otp_verified } = req.body;

    const existing = await prisma.pickupRequest.findFirst({
      where: { id: String(id), company_id: String(companyId) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pickup request record not found' });
    }

    const updated = await prisma.pickupRequest.update({
      where: { id: String(id) },
      data: {
        status: status !== undefined ? status : undefined,
        escalated: escalated !== undefined ? escalated : undefined,
        otp_verified: otp_verified !== undefined ? otp_verified : undefined
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update pickup request status', details: error.message });
  }
};
