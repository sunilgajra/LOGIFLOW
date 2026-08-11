import { Request, Response } from 'express';
import { parseDeliverySheetWithAI } from '../services/ai.service';
import { prisma } from '../prisma';
import fs from 'fs';
import pdf from 'pdf-parse';
import * as xlsx from 'xlsx';

export const aiUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop()?.toLowerCase();
    
    let rawText = '';

    if (fileExt === 'pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      rawText = data.text;
    } else if (fileExt === 'csv' || fileExt === 'xlsx' || fileExt === 'xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawText = xlsx.utils.sheet_to_csv(sheet);
    } else {
      rawText = fs.readFileSync(filePath, 'utf-8');
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Call AI to parse
    const shipments = await parseDeliverySheetWithAI(rawText);

    // Assuming company_id is provided in headers or body, for now default to a placeholder or the first company
    // For a real app, this comes from req.user
    const company = await prisma.company.findFirst();
    if (!company) {
      return res.status(500).json({ error: 'No company found in database to associate shipments' });
    }

    const company_id = company.id;

    // Save to database
    let importedCount = 0;
    for (const shipment of shipments) {
      if (shipment.awb_number) {
        await prisma.shipment.upsert({
          where: {
            company_id_awb_number: {
              company_id: company_id,
              awb_number: shipment.awb_number
            }
          },
          update: {
            ...shipment,
            company_id: undefined // Don't update company_id
          },
          create: {
            ...shipment,
            company_id: company_id
          }
        });
        importedCount++;
      }
    }

    res.json({ 
      message: `Successfully processed ${importedCount} shipments via AI`,
      shipments 
    });
  } catch (error: any) {
    console.error('AI Upload Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during AI upload' });
  }
};
