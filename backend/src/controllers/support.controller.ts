import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const getSupportTickets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const where: any = { company_id: String(companyId) };
    if (req.user?.role === 'CLIENT' && req.user?.client_id) {
      where.client_id = req.user.client_id;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch support tickets', details: error.message });
  }
};

export const createSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      awb_number,
      category,
      sub_category,
      description,
      cc_emails,
      client_id
    } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required to raise a support ticket' });
    }

    const assignedClientId = req.user?.role === 'CLIENT' ? req.user.client_id : (client_id || null);
    const userEmail = (req.user as any)?.email || 'cs@pswarehousing.com';

    // Generate unique 16-character Ticket ID matching Delhivery format: J1787056533769436
    const ticketId = `J${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        company_id: String(companyId),
        client_id: assignedClientId,
        ticket_id: ticketId,
        awb_number: awb_number || null,
        raised_by: userEmail,
        category,
        sub_category: sub_category || null,
        description: description || 'Issue raised regarding shipment/account',
        status: 'Open',
        priority: 'Medium',
        cc_emails: cc_emails || null,
        last_update: new Date()
      }
    });

    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create support ticket', details: error.message });
  }
};

export const updateTicketStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { status, priority } = req.body;

    const existing = await prisma.supportTicket.findFirst({
      where: { id: String(id), company_id: String(companyId) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Support ticket record not found' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: String(id) },
      data: {
        status: status !== undefined ? status : undefined,
        priority: priority !== undefined ? priority : undefined,
        last_update: new Date()
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update support ticket', details: error.message });
  }
};
