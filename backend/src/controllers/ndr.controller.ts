import { Request, Response } from 'express';
import { prisma } from '../prisma';

/**
 * Get all NDR / Exception shipments for the authenticated user's company.
 * GET /api/ndr
 */
export const getNDRShipments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const whereCondition: any = {
      company_id: user.company_id,
      OR: [
        { internal_status: 'EXCEPTION' },
        { courier_status: { contains: 'NDR', mode: 'insensitive' } },
        { courier_status: { contains: 'UNDELIVERED', mode: 'insensitive' } },
        { delivery_attempt: { gt: 0 } }
      ]
    };

    // If logged in as CLIENT, restrict to their shipments
    if (user.role === 'CLIENT' && user.client_id) {
      whereCondition.client_id = user.client_id;
    }

    const ndrShipments = await prisma.shipment.findMany({
      where: whereCondition,
      include: {
        client: {
          select: { company_name: true, contact_person: true, phone: true }
        },
        courier: {
          select: { courier_name: true }
        },
        status_history: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      },
      orderBy: { updated_at: 'desc' }
    });

    res.json(ndrShipments);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch NDR shipments', details: error.message });
  }
};

/**
 * Process client/admin action for NDR resolution.
 * POST /api/ndr/:id/action
 * Body: { action: 'REATTEMPT' | 'UPDATE_ADDRESS' | 'UPDATE_PHONE' | 'RTO', remarks?: string, new_phone?: string, new_address?: string, preferred_date?: string }
 */
export const processNDRAction = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { action, remarks, new_phone, new_address, preferred_date } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action type is required (REATTEMPT, UPDATE_ADDRESS, UPDATE_PHONE, RTO)' });
    }

    const shipment = await prisma.shipment.findFirst({
      where: { id, company_id: user.company_id }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    let updateData: any = {
      updated_at: new Date()
    };
    let newInternalStatus = shipment.internal_status;
    let historyRemarks = `[NDR Action: ${action}] ${remarks || ''}`;

    if (action === 'REATTEMPT') {
      newInternalStatus = 'IN_TRANSIT';
      updateData.internal_status = 'IN_TRANSIT';
      updateData.delivery_attempt = (shipment.delivery_attempt || 0) + 1;
      if (preferred_date) historyRemarks += ` (Preferred Date: ${preferred_date})`;
    } else if (action === 'UPDATE_ADDRESS') {
      if (!new_address) return res.status(400).json({ error: 'new_address is required' });
      updateData.receiver_address = new_address;
      updateData.internal_status = 'IN_TRANSIT';
      newInternalStatus = 'IN_TRANSIT';
      historyRemarks += ` (Updated Address: ${new_address})`;
    } else if (action === 'UPDATE_PHONE') {
      if (!new_phone) return res.status(400).json({ error: 'new_phone is required' });
      updateData.receiver_phone = new_phone;
      updateData.internal_status = 'IN_TRANSIT';
      newInternalStatus = 'IN_TRANSIT';
      historyRemarks += ` (Updated Phone: ${new_phone})`;
    } else if (action === 'RTO') {
      updateData.internal_status = 'RTO';
      newInternalStatus = 'RTO';
      updateData.rto_reason = remarks || 'RTO requested by client';
    }

    updateData.remarks = historyRemarks;

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: updateData
    });

    // Record in history
    await prisma.shipmentStatusHistory.create({
      data: {
        shipment_id: shipment.id,
        status: newInternalStatus,
        raw_status: `NDR_ACTION_${action}`,
        location: 'NDR Management Desk',
        timestamp: new Date()
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        company_id: user.company_id,
        user_id: user.id,
        action: 'NDR_ACTION_SUBMITTED',
        entity_type: 'SHIPMENT',
        entity_id: shipment.id,
        details: JSON.stringify({ action, remarks, new_phone, new_address, preferred_date })
      }
    });

    res.json({
      success: true,
      message: `NDR action '${action}' recorded successfully`,
      shipment: updated
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process NDR action', details: error.message });
  }
};
