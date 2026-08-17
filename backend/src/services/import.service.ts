import * as xlsx from 'xlsx';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

export interface ParsedRow {
  [key: string]: any;
}

export class ImportService {
  /**
   * Parse an uploaded file (CSV, XLS, XLSX) into an array of objects
   */
  public static parseFile(filePath: string, originalname: string): ParsedRow[] {
    const isCsv = originalname.toLowerCase().endsWith('.csv');
    
    if (isCsv) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });
      return records as ParsedRow[];
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const records = xlsx.utils.sheet_to_json(sheet, { defval: '' });
      return records as ParsedRow[];
    }
  }

  /**
   * Guess the column mapping based on standard terms used by Indian couriers
   */
  public static guessColumnMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    const commonMappings = {
      awb_number: ['awb', 'waybill', 'trackingno', 'consignmentno', 'refno'],
      internal_status: ['status', 'currentstatus', 'deliverystatus', 'state'],
      receiver_name: ['receiver', 'consignee', 'customername', 'to'],
      receiver_phone: ['phone', 'mobile', 'contact', 'telephone'],
      city: ['city', 'destination', 'location'],
      pincode: ['pin', 'pincode', 'zip', 'postalcode'],
      amount_to_collect: ['cod', 'amount', 'value', 'collectable'],
    };

    for (const header of headers) {
      const nHeader = norm(header);
      for (const [standardKey, aliases] of Object.entries(commonMappings)) {
        if (!mapping[standardKey] && aliases.some(alias => nHeader.includes(alias))) {
          mapping[standardKey] = header;
          break;
        }
      }
    }

    return mapping;
  }

  /**
   * Normalize standard courier statuses to LogiFlow Internal Statuses
   */
  public static normalizeStatus(rawStatus: string): string {
    const status = rawStatus.toUpperCase().trim();
    
    if (status.includes('DELIVERED')) return 'DELIVERED';
    if (status.includes('RTO') || status.includes('RETURN')) return 'RTO';
    if (status.includes('OUT FOR DELIVERY') || status.includes('OFD')) return 'OUT_FOR_DELIVERY';
    if (status.includes('TRANSIT') || status.includes('DISPATCHED') || status.includes('SHIPPED')) return 'IN_TRANSIT';
    if (status.includes('CANCEL') || status.includes('EXCEPTION') || status.includes('UNDELIVERED')) return 'EXCEPTION';
    if (status.includes('MANIFEST') || status.includes('BOOKED')) return 'MANIFESTED';
    
    return 'PENDING'; // Default fallback
  }
}
