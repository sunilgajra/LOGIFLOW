import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const generateInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { clientId } = req.body;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Find unbilled shipments for this client
    const shipments = await prisma.shipment.findMany({
      where: {
        client_id: clientId,
        company_id: req.user?.company_id,
        invoice_id: null,
        client_charge: { not: null }
      }
    });

    if (shipments.length === 0) {
      return res.status(400).json({ error: 'No unbilled shipments found for this client' });
    }

    // Calculate totals
    let subtotal = 0;
    let total_fsc = 0;
    let total_idc = 0;
    let total_oda = 0;
    let total_green_tax = 0;

    shipments.forEach(s => {
      subtotal += s.client_charge || 0;
      total_fsc += s.fsc_amount || 0;
      total_idc += s.idc_amount || 0;
      total_oda += s.oda_amount || 0;
      total_green_tax += s.green_tax_amount || 0;
    });

    const off_loading_charges = parseFloat(req.body.off_loading_charges) || 0;
    const vehicle_charges = parseFloat(req.body.vehicle_charges) || 0;
    const insurance_charges = parseFloat(req.body.insurance_charges) || 0;
    const rto_charges = parseFloat(req.body.rto_charges) || 0;

    // Subtotal already contains fsc_amount, idc_amount, oda_amount, green_tax_amount because we added it to client_charge in rate.controller
    // So the new taxable amount adds the extra invoice-level charges:
    const taxable_amount = subtotal + off_loading_charges + vehicle_charges + insurance_charges + rto_charges;

    const cgstAmount = taxable_amount * 0.09; // 9% CGST
    const sgstAmount = taxable_amount * 0.09; // 9% SGST
    
    // Total with exact decimals
    const rawTotal = taxable_amount + cgstAmount + sgstAmount;
    const roundedTotal = Math.round(rawTotal);
    const roundOff = roundedTotal - rawTotal;

    // Generate Invoice Number (INV-YYYYMMDD-XXXX)
    const count = await prisma.clientInvoice.count({
      where: { company_id: req.user?.company_id }
    });
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;

    // Create Invoice
    const invoice = await prisma.clientInvoice.create({
      data: {
        company_id: req.user?.company_id as string,
        client_id: clientId,
        invoice_number: invoiceNumber,
        invoice_date: new Date(),
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        shipment_count: shipments.length,
        subtotal,
        total_fsc,
        total_idc,
        total_oda,
        total_green_tax,
        off_loading_charges,
        vehicle_charges,
        insurance_charges,
        rto_charges,
        taxable_amount,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        round_off: roundOff,
        total_amount: roundedTotal,
        status: 'SENT',
        shipments: {
          connect: shipments.map(s => ({ id: s.id }))
        }
      },
      include: {
        client: true,
        shipments: true
      }
    });

    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate invoice', details: error.message });
  }
};

export const getInvoicesByClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = String(req.params.clientId || '');

    if (req.user?.role === 'CLIENT' && req.user?.client_id !== clientId) {
      return res.status(403).json({ error: 'Access denied: You can only view your own invoices.' });
    }
    
    const invoices = await prisma.clientInvoice.findMany({
      where: {
        company_id: req.user?.company_id,
        client_id: clientId
      },
      orderBy: { created_at: 'desc' },
      include: {
        shipments: true
      }
    });

    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch invoices', details: error.message });
  }
};
