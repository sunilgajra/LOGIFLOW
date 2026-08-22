import { Request, Response } from 'express';
import { AiParserService } from '../services/ai.service';
import { ImportService } from '../services/import.service';
import { prisma } from '../prisma';
import fs from 'fs';
import { AuthenticatedRequest } from '../auth.middleware';
import { calculateShipmentCost } from './rate.controller';

export const previewImport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop()?.toLowerCase() || '';
    
    let records: any[] = [];
    
    if (['jpg', 'jpeg', 'png', 'pdf'].includes(fileExt)) {
      const mimeType = fileExt === 'pdf' ? 'application/pdf' : `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
      records = await AiParserService.parseUnstructuredDocument(filePath, mimeType);
      
      // Save records to a temp json file for processImport to use, to avoid re-running AI
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(records));
      res.json({
        fileId: `${req.file.filename}.json`,
        headers: Object.keys(records[0] || {}),
        mapping: ImportService.guessColumnMapping(Object.keys(records[0] || {})),
        sampleData: records.slice(0, 5)
      });
      return;
    } else {
      records = ImportService.parseFile(filePath, req.file.originalname);
    }
    
    if (records.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'File is empty or could not be parsed' });
    }

    const headers = Object.keys(records[0]);
    const mapping = ImportService.guessColumnMapping(headers);
    const sampleData = records.slice(0, 5);

    res.json({
      fileId: req.file.filename,
      headers,
      mapping,
      sampleData
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Preview failed', details: error.message });
  }
};

export const processImport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileId, mapping, courierId, clientId } = req.body;
    const isJson = fileId.endsWith('.json');
    const originalFileId = isJson ? fileId.replace('.json', '') : fileId;
    
    const filePath = `uploads/${fileId}`;
    const originalPath = `uploads/${originalFileId}`;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    let records: any[] = [];
    if (isJson) {
      records = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      fs.unlinkSync(filePath);
      if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath); // cleanup original image
    } else {
      records = ImportService.parseFile(filePath, fileId); 
      fs.unlinkSync(filePath); // Cleanup
    }

    const company_id = req.user?.company_id as string;
    let imported = 0;
    let failed = 0;

    for (const record of records) {
      const awb = record[mapping.awb_number];
      if (!awb) {
        failed++;
        continue;
      }

      const rawStatus = mapping.internal_status ? record[mapping.internal_status] : 'PENDING';
      const status = ImportService.normalizeStatus(rawStatus);

      try {
        // Prepare calculation inputs
        const actual_weight = mapping.actual_weight ? parseFloat(record[mapping.actual_weight]) || 0 : 0;
        const volumetric_weight = mapping.volumetric_weight ? parseFloat(record[mapping.volumetric_weight]) || 0 : 0;
        const state = mapping.state ? record[mapping.state] : null;
        const origin = mapping.origin ? record[mapping.origin] : null;
        let client_charge = mapping.client_charge ? parseFloat(record[mapping.client_charge]) || null : null;

        let calculated_fsc = 0;
        let calculated_idc = 0;
        let calculated_oda = 0;
        let calculated_green_tax = 0;

        let calcResult = null;
        if (client_charge === null && clientId) {
           const calcPayload = {
             client_id: clientId,
             actual_weight,
             volumetric_weight,
             state,
             origin,
             declared_value: mapping.declared_value ? parseFloat(record[mapping.declared_value]) || 0 : 0,
             is_oda: mapping.is_oda ? (record[mapping.is_oda]?.toLowerCase() === 'yes' || record[mapping.is_oda] === true) : false
           };
           calcResult = await calculateShipmentCost(calcPayload, company_id);
           if (calcResult) {
             client_charge = calcResult.client_total_charge;
             calculated_fsc = calcResult.client_fsc_amount;
             calculated_idc = calcResult.client_idc_amount;
             calculated_oda = calcResult.client_oda_amount;
             calculated_green_tax = calcResult.client_green_tax;
           }
        }

        await prisma.shipment.upsert({
          where: {
            company_id_awb_number: {
              company_id,
              awb_number: awb.toString().trim()
            }
          },
          update: {
            internal_status: status,
            client_charge: client_charge !== null ? client_charge : undefined,
            client_reference_no: mapping.client_reference_no ? record[mapping.client_reference_no] : undefined,
          },
          create: {
            company_id,
            awb_number: awb.toString().trim(),
            internal_status: status,
            client_id: clientId || null,
            courier_id: courierId || null,
            client_reference_no: mapping.client_reference_no ? record[mapping.client_reference_no] : null,
            receiver_name: mapping.receiver_name ? record[mapping.receiver_name] : null,
            city: mapping.city ? record[mapping.city] : null,
            state,
            origin,
            pincode: mapping.pincode ? record[mapping.pincode] : null,
            actual_weight,
            volumetric_weight,
            client_charge,
            client_base_freight: calcResult?.client_base_freight || 0,
            client_docket_charge: calcResult?.client_docket_charge || 0,
            client_fov_charge: calcResult?.client_fov_charge || 0,
            client_fsc_amount: calculated_fsc,
            client_idc_amount: calculated_idc,
            client_oda_amount: calculated_oda,
            client_green_tax: calculated_green_tax,
            client_gst_amount: calcResult?.client_gst_amount || 0,
            client_total_charge: calcResult?.client_total_charge || client_charge || 0,
            fsc_amount: calculated_fsc,
            idc_amount: calculated_idc,
            oda_amount: calculated_oda,
            green_tax_amount: calculated_green_tax,
            declared_value: mapping.declared_value ? parseFloat(record[mapping.declared_value]) || 0 : 0,
            booking_date: new Date()
          }
        });
        imported++;
      } catch (err) {
        console.error(err);
        failed++;
      }
    }

    res.json({ message: 'Import complete', imported, failed, total: records.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Processing failed', details: error.message });
  }
};
