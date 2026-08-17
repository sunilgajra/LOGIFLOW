import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const getCompanySettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user?.company_id }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch company settings', details: error.message });
  }
};

export const updateCompanySettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    
    // Ensure we only update allowed fields
    const { name, address, gst_number, pan_number, invoice_prefix, branding_logo } = data;

    const company = await prisma.company.update({
      where: { id: req.user?.company_id },
      data: {
        name,
        address,
        gst_number,
        pan_number,
        invoice_prefix,
        branding_logo
      }
    });

    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update company settings', details: error.message });
  }
};
