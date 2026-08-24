import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { triggerAutoNotification } from '../services/notification.service';
import { DelhiveryNdrService } from '../services/courier/DelhiveryNdrService';

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
        { internal_status: 'NDR' },
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
        },
        ndrRecords: {
          orderBy: { event_time: 'desc' }
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
 * Get NDR history for a specific shipment.
 * GET /api/ndr/:id/history
 */
export const getNDRHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const targetId = String(id || '');

    const shipment = await prisma.shipment.findFirst({
      where: {
        company_id: user.company_id,
        OR: [{ id: targetId }, { awb_number: targetId }]
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (user.role === 'CLIENT' && user.client_id && shipment.client_id !== user.client_id) {
      return res.status(403).json({ error: 'Forbidden: Cannot view another client\'s NDR history' });
    }

    const history = await prisma.ndrRecord.findMany({
      where: {
        company_id: user.company_id,
        shipment_id: shipment.id
      },
      orderBy: { event_time: 'desc' }
    });

    res.json({
      success: true,
      awb: shipment.awb_number,
      history
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch NDR history', details: error.message });
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
    const id = String(req.params.id || '');
    const { action, remarks, new_phone, new_address, preferred_date } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action type is required (REATTEMPT, UPDATE_ADDRESS, UPDATE_PHONE, RTO)' });
    }

    const shipment = await prisma.shipment.findFirst({
      where: {
        company_id: user.company_id,
        OR: [{ id }, { awb_number: id }]
      },
      include: { courier: true }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Role-based tenant isolation check
    if (user.role === 'CLIENT' && user.client_id && shipment.client_id !== user.client_id) {
      return res.status(403).json({ error: 'Forbidden: Cannot action another client\'s NDR record' });
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

    // Record in NdrRecord for history
    const ndrRecord = await prisma.ndrRecord.create({
      data: {
        company_id: user.company_id,
        shipment_id: shipment.id,
        courier_id: shipment.courier_id || 'DELHIVERY',
        awb: shipment.awb_number,
        ndr_code: 'NDR_ACTION',
        ndr_reason: historyRemarks,
        ndr_status: 'ACTION_REQUESTED',
        attempt_number: shipment.delivery_attempt || 1,
        selected_action: action,
        action_status: 'SUBMITTED',
        event_time: new Date()
      }
    }).catch(() => null);

    // Trigger DelhiveryNdrService integration if applicable
    if (shipment.courier?.courier_name?.toUpperCase().includes('DELHIVERY') && ndrRecord) {
      let delhiveryAction: 'REATTEMPT' | 'UPDATE_ADDRESS' | 'UPDATE_PHONE' | 'RTO' = 'REATTEMPT';
      if (action === 'RTO') delhiveryAction = 'RTO';
      else if (action === 'UPDATE_ADDRESS') delhiveryAction = 'UPDATE_ADDRESS';
      else if (action === 'UPDATE_PHONE') delhiveryAction = 'UPDATE_PHONE';

      await DelhiveryNdrService.submitNdrAction({
        companyId: user.company_id,
        ndrRecordId: ndrRecord.id,
        action: delhiveryAction,
        remarks,
        consigneePhone: new_phone,
        consigneeAddress: new_address,
        scheduledDate: preferred_date
      }).catch(err => console.error('Delhivery NDR action error:', err.message));
    }

    // Record in status history
    await prisma.shipmentStatusHistory.create({
      data: {
        shipment_id: shipment.id,
        status: newInternalStatus,
        raw_status: `NDR_ACTION_${action}`,
        location: 'NDR Management Desk',
        timestamp: new Date()
      }
    });

    // Trigger WhatsApp & Email Notification
    triggerAutoNotification({
      company_id: user.company_id,
      client_id: shipment.client_id || undefined,
      shipment_id: shipment.id,
      awb_number: updated.awb_number,
      receiver_name: updated.receiver_name || undefined,
      receiver_phone: updated.receiver_phone || undefined,
      internal_status: newInternalStatus,
      exception_reason: historyRemarks
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

