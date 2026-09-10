import { Response } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { MasterImportService } from '../services/masterImport.service';
import { prisma } from '../prisma';
import fs from 'fs';

export const previewMasterImport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No courier sheet file uploaded' });
    }

    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const courierName = (req.body.courier_name || 'Courier Partner').toString();

    // Parse spreadsheet rows
    const records = MasterImportService.parseBuffer(fileBuffer, req.file.originalname);
    
    // Clean up uploaded temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (!records || records.length === 0) {
      return res.status(400).json({ error: 'The uploaded file contains no data rows.' });
    }

    // Custom column mapping from request if provided
    let customMapping: Record<string, string> = {};
    if (req.body.mapping) {
      try {
        customMapping = typeof req.body.mapping === 'string' ? JSON.parse(req.body.mapping) : req.body.mapping;
      } catch (e) {
        // Fallback to auto-detect
      }
    }

    const previewResult = await MasterImportService.generatePreview(
      records,
      customMapping,
      companyId,
      courierName
    );

    res.json({
      success: true,
      preview: previewResult
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error generating master import preview:', error);
    res.status(500).json({ error: 'Failed to generate import preview', details: error.message });
  }
};

export const confirmMasterImport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { preview, courier_id } = req.body;
    if (!preview || !preview.reconciliation_diffs) {
      return res.status(400).json({ error: 'Invalid or missing import preview data' });
    }

    const result = await MasterImportService.commitImport(
      preview,
      companyId,
      courier_id,
      req.user?.id
    );

    res.json({
      success: true,
      message: `Import completed successfully. Updated ${result.updatedCount} shipments. Staged ${result.unmatchedCreated} unmatched records.`,
      result
    });
  } catch (error: any) {
    console.error('Error committing master import:', error);
    res.status(500).json({ error: 'Failed to commit import changes', details: error.message });
  }
};

export const getUnmatchedShipments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = String(req.user?.company_id || '');
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const unmatched = await prisma.unmatchedCourierShipment.findMany({
      where: { company_id: companyId, status: 'PENDING' },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, count: unmatched.length, data: unmatched });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch unmatched shipments', details: error.message });
  }
};

export const resolveUnmatchedShipment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = String(req.user?.company_id || '');
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const targetId = String(id || '');
    const { action, target_awb, target_shipment_id } = req.body;

    const unmatched = await prisma.unmatchedCourierShipment.findFirst({
      where: { id: targetId, company_id: companyId }
    });

    if (!unmatched) {
      return res.status(404).json({ error: 'Unmatched shipment record not found' });
    }

    if (action === 'MATCH') {
      // Find existing shipment by target_awb or target_shipment_id
      const existing = await prisma.shipment.findFirst({
        where: {
          company_id: companyId,
          OR: [
            { awb_number: target_awb || unmatched.awb_number },
            { id: target_shipment_id || '' }
          ]
        }
      });

      if (!existing) {
        return res.status(400).json({ error: 'Specified target shipment does not exist.' });
      }

      // Update existing shipment with courier fields
      await prisma.shipment.update({
        where: { id: existing.id },
        data: {
          internal_status: unmatched.raw_status || existing.internal_status,
          delivery_date: unmatched.delivered_date || existing.delivery_date,
          remarks: unmatched.remark || existing.remarks
        }
      });

      await prisma.unmatchedCourierShipment.update({
        where: { id: unmatched.id },
        data: { status: 'MATCHED' }
      });

      return res.json({ success: true, message: `Matched AWB ${unmatched.awb_number} to shipment ${existing.awb_number}` });
    } else if (action === 'CREATE') {
      // Manually create new shipment from unmatched row
      const newShipment = await prisma.shipment.create({
        data: {
          company_id: companyId,
          awb_number: unmatched.awb_number,
          courier_id: unmatched.courier_id,
          internal_status: unmatched.raw_status || 'IN_TRANSIT',
          delivery_date: unmatched.delivered_date,
          remarks: unmatched.remark,
          booking_date: new Date()
        }
      });

      await prisma.unmatchedCourierShipment.update({
        where: { id: unmatched.id },
        data: { status: 'CREATED_SHIPMENT' }
      });

      return res.json({ success: true, message: `Created new shipment for AWB ${unmatched.awb_number}`, shipment: newShipment });
    } else if (action === 'IGNORE') {
      await prisma.unmatchedCourierShipment.update({
        where: { id: unmatched.id },
        data: { status: 'IGNORED' }
      });

      return res.json({ success: true, message: `Ignored unmatched record ${unmatched.awb_number}` });
    }

    res.status(400).json({ error: 'Invalid action specified. Must be MATCH, CREATE, or IGNORE.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to resolve unmatched shipment', details: error.message });
  }
};
