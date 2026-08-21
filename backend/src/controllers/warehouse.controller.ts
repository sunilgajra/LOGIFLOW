import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const getWarehouses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const warehouses = await prisma.warehouse.findMany({
      where: { company_id: String(companyId) },
      orderBy: { created_at: 'desc' }
    });

    res.json(warehouses);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch warehouses', details: error.message });
  }
};

export const createWarehouse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      facility_name,
      contact_person,
      contact_phone,
      email,
      address_line,
      pincode,
      city,
      state,
      default_pickup_slot,
      working_days,
      return_same_as_pickup,
      return_address
    } = req.body;

    if (!facility_name || !address_line || !pincode || !city || !state || !contact_phone) {
      return res.status(400).json({ error: 'Missing required address or facility fields' });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        company_id: String(companyId),
        facility_name,
        contact_person: contact_person || null,
        contact_phone,
        email: email || null,
        address_line,
        pincode,
        city,
        state,
        default_pickup_slot: default_pickup_slot || '10:00 AM - 01:00 PM',
        working_days: Array.isArray(working_days) ? working_days.join(',') : working_days || 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
        return_same_as_pickup: return_same_as_pickup !== false,
        return_address: return_same_as_pickup ? address_line : (return_address || address_line),
        status: 'ACTIVE'
      }
    });

    res.status(201).json(warehouse);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create pickup location', details: error.message });
  }
};

export const updateWarehouse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.warehouse.findFirst({
      where: { id: String(id), company_id: String(companyId) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Warehouse location not found' });
    }

    const updated = await prisma.warehouse.update({
      where: { id: String(id) },
      data: {
        facility_name: data.facility_name !== undefined ? data.facility_name : undefined,
        contact_person: data.contact_person !== undefined ? data.contact_person : undefined,
        contact_phone: data.contact_phone !== undefined ? data.contact_phone : undefined,
        email: data.email !== undefined ? data.email : undefined,
        address_line: data.address_line !== undefined ? data.address_line : undefined,
        pincode: data.pincode !== undefined ? data.pincode : undefined,
        city: data.city !== undefined ? data.city : undefined,
        state: data.state !== undefined ? data.state : undefined,
        default_pickup_slot: data.default_pickup_slot !== undefined ? data.default_pickup_slot : undefined,
        working_days: Array.isArray(data.working_days) ? data.working_days.join(',') : data.working_days,
        return_same_as_pickup: data.return_same_as_pickup,
        return_address: data.return_address,
        status: data.status !== undefined ? data.status : undefined
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update pickup location', details: error.message });
  }
};
