import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';
import bcrypt from 'bcrypt';

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

export const deleteClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.rateCard.deleteMany({ where: { client_id: id, company_id: companyId } });
    await prisma.warehouse.deleteMany({ where: { client_id: id, company_id: companyId } });

    const deleted = await prisma.client.deleteMany({
      where: { 
        id, 
        company_id: companyId 
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Client not found or unauthorized' });
    }

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete client', details: error.message });
  }
};

export const updateClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const data = req.body;
    
    const client = await prisma.client.updateMany({
      where: { 
        id, 
        company_id: req.user?.company_id 
      },
      data
    });

    if (client.count === 0) {
      return res.status(404).json({ error: 'Client not found or unauthorized' });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update client', details: error.message });
  }
};

export const getClientById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    
    const client = await prisma.client.findFirst({
      where: { id, company_id: req.user?.company_id },
      include: { users: { select: { id: true, email: true, created_at: true } } }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const shipments = await prisma.shipment.findMany({
      where: { client_id: id, company_id: req.user?.company_id },
      orderBy: { booking_date: 'desc' },
      take: 100, // Limit to recent 100 for dashboard
      include: {
        courier: { select: { courier_name: true } }
      }
    });

    // Compute stats
    let totalShipments = 0;
    let delivered = 0;
    let inTransit = 0;
    let totalBilling = 0;

    shipments.forEach(s => {
      totalShipments++;
      if (s.internal_status === 'DELIVERED') delivered++;
      if (s.internal_status === 'IN_TRANSIT' || s.internal_status === 'OUT_FOR_DELIVERY') inTransit++;
      if (s.client_charge && s.invoice_id === null) totalBilling += s.client_charge;
    });

    // Fetch Invoices with connected shipments
    const invoices = await prisma.clientInvoice.findMany({
      where: { client_id: id, company_id: req.user?.company_id },
      orderBy: { created_at: 'desc' },
      include: {
        shipments: true,
        client: true,
        company: true
      }
    });

    // Fetch Rate Cards
    const rateCards = await prisma.rateCard.findMany({
      where: { client_id: id, company_id: req.user?.company_id }
    });

    const company = await prisma.company.findUnique({
      where: { id: req.user?.company_id }
    });

    res.json({
      client,
      company,
      stats: {
        totalShipments,
        delivered,
        inTransit,
        totalBilling
      },
      recentShipments: shipments,
      invoices,
      rateCards
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch client details', details: error.message });
  }
};

export const uploadClientAgreement = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const { agreement_document } = req.body;
    const client = await prisma.client.updateMany({
      where: { id, company_id: req.user?.company_id },
      data: { agreement_document }
    });
    if (client.count === 0) return res.status(404).json({ error: 'Client not found' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to upload agreement', details: error.message });
  }
};

export const createClientLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const { email, password } = req.body;

    const client = await prisma.client.findFirst({ where: { id, company_id: req.user?.company_id } });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        company_id: req.user!.company_id,
        email,
        password: hashedPassword,
        first_name: client.contact_person?.split(' ')[0] || client.company_name,
        last_name: client.contact_person?.split(' ').slice(1).join(' ') || '',
        role: 'CLIENT',
        client_id: client.id,
      }
    });

    res.json({ message: 'Client login created successfully', user: { id: user.id, email: user.email } });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create client login' });
  }
};

