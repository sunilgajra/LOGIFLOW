import * as xlsx from 'xlsx';
import { prisma } from '../prisma';
import { DemurrageService } from './demurrage.service';

// Categorize fields by ownership
export const COMPANY_OWNED_FIELDS = [
  'company', 'sr_no', 'month_tag', 'booking_date', 'ac_code', 'awb_number',
  'b_weight', 'amt', 'consignor', 'pickup_location', 'city', 'state',
  'qty', 'r_weight', 'item_description', 'pincode', 'service_type',
  'zone', 'receiver_name', 'receiver_address', 'receiver_phone',
  'invoice_no', 'rov_type', 'invoice_amt', 'client_id'
];

export const COURIER_OWNED_FIELDS = [
  'internal_status', 'courier_status', 'edd_date', 'delivered_date',
  'rto_docket', 'transit_days', 'time_to_reach_hub', 'date_of_reaching_hub',
  'appointment_date_a', 'appointment_date_b', 'appointment_date_c',
  'attempt_1_date', 'attempt_2_date', 'attempt_3_date', 'attempt_4_date',
  'attempt_5_date', 'attempt_6_date', 'attempt_7_date', 'attempt_8_date',
  'attempt_9_date', 'attempt_10_date', 'attempt_11_date', 'attempt_12_date',
  'rto_date', 'remarks', 'pod_status', 'pod_doc_url'
];

export const SYSTEM_CALCULATED_FIELDS = [
  'days_to_deliver', 'demurrage_free_days', 'demurrage_days',
  'demurrage_rate', 'demurrage_amount', 'demurrage_gst_pct',
  'demurrage_gst_amount', 'total_demurrage', 'profit', 'gross_margin'
];

export interface HeaderMapping {
  awb_number?: string;
  status?: string;
  edd_date?: string;
  delivered_date?: string;
  rto_docket?: string;
  transit_days?: string;
  time_to_reach_hub?: string;
  date_of_reaching_hub?: string;
  appointment_date?: string;
  attempt_1_date?: string;
  attempt_2_date?: string;
  attempt_3_date?: string;
  attempt_4_date?: string;
  rto_date?: string;
  remark?: string;
  pod_status?: string;
}

export interface DiffRow {
  awb_number: string;
  field_name: string;
  field_label: string;
  current_value: string;
  new_value: string;
  ownership: 'COURIER' | 'COMPANY' | 'SYSTEM';
  action: 'UPDATE' | 'PROTECTED' | 'NO_CHANGE';
}

export interface ImportPreviewResult {
  file_name: string;
  total_rows: number;
  matched_count: number;
  unmatched_count: number;
  detected_courier: string;
  detected_headers: string[];
  column_mapping: Record<string, string>;
  reconciliation_diffs: DiffRow[];
  matched_awbs: string[];
  unmatched_rows: Array<{
    awb_number: string;
    raw_status?: string;
    delivered_date?: string;
    remark?: string;
    raw_row: Record<string, any>;
  }>;
}

export class MasterImportService {
  /**
   * Auto-detect header mapping based on header string aliases.
   */
  static detectColumnMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    headers.forEach(h => {
      const n = norm(h);
      if (n.includes('awb') || n.includes('docket') || n.includes('tracking') || n.includes('waybill') || n.includes('cnno')) {
        if (!mapping.awb_number) mapping.awb_number = h;
      } else if (n.includes('delivereddate') || n.includes('dlydate') || n.includes('deliverydate')) {
        if (!mapping.delivered_date) mapping.delivered_date = h;
      } else if (n.includes('status') || n.includes('currstatus') || n.includes('dlystatus')) {
        if (!mapping.status) mapping.status = h;
      } else if (n.includes('edd') || n.includes('expecteddate') || n.includes('estdate')) {
        if (!mapping.edd_date) mapping.edd_date = h;
      } else if (n.includes('rtodocket') || n.includes('rtocn')) {
        if (!mapping.rto_docket) mapping.rto_docket = h;
      } else if (n.includes('reachinghub') || n.includes('hubdate')) {
        if (!mapping.date_of_reaching_hub) mapping.date_of_reaching_hub = h;
      } else if (n.includes('transitday') || n.includes('transit')) {
        if (!mapping.transit_days) mapping.transit_days = h;
      } else if (n.includes('1stattempt') || n.includes('attempt1')) {
        if (!mapping.attempt_1_date) mapping.attempt_1_date = h;
      } else if (n.includes('2ndattempt') || n.includes('attempt2')) {
        if (!mapping.attempt_2_date) mapping.attempt_2_date = h;
      } else if (n.includes('3rdattempt') || n.includes('attempt3')) {
        if (!mapping.attempt_3_date) mapping.attempt_3_date = h;
      } else if (n.includes('rtodate')) {
        if (!mapping.rto_date) mapping.rto_date = h;
      } else if (n.includes('remark') || n.includes('reason') || n.includes('comment')) {
        if (!mapping.remark) mapping.remark = h;
      } else if (n.includes('pod') || n.includes('podstatus')) {
        if (!mapping.pod_status) mapping.pod_status = h;
      }
    });

    return mapping;
  }

  /**
   * Parse file buffer using xlsx.
   */
  static parseBuffer(fileBuffer: Buffer, fileName: string): any[] {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    return xlsx.utils.sheet_to_json(worksheet, { defval: '' });
  }

  /**
   * Normalize raw status text to standard system statuses.
   */
  static normalizeStatus(rawStatus?: string): string {
    if (!rawStatus) return 'IN_TRANSIT';
    const s = rawStatus.toUpperCase().trim();
    if (s.includes('DELIVERED') || s === 'DLVD' || s === 'DL') return 'DELIVERED';
    if (s.includes('RTO') || s.includes('RETURN') || s.includes('REJECTED')) return 'RTO';
    if (s.includes('OUT FOR DELIVERY') || s.includes('OFD')) return 'OUT_FOR_DELIVERY';
    if (s.includes('HUB') || s.includes('ARRIVED') || s.includes('IN TRANSIT')) return 'IN_TRANSIT';
    if (s.includes('PICK') || s.includes('DISPATCHED')) return 'PICKED_UP';
    if (s.includes('NDR') || s.includes('ATTEMPT') || s.includes('UNDELIVERED')) return 'NDR';
    return s;
  }

  /**
   * Formats dates cleanly into string / Date object.
   */
  static parseDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    const str = String(val).trim();
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  /**
   * Process uploaded sheet to generate a reconciliation diff preview.
   */
  static async generatePreview(
    records: any[],
    customMapping: Record<string, string>,
    companyId: string,
    courierName: string = 'Courier Partner'
  ): Promise<ImportPreviewResult> {
    const headers = records.length > 0 ? Object.keys(records[0]) : [];
    const mapping = Object.keys(customMapping).length > 0
      ? customMapping
      : this.detectColumnMapping(headers);

    const awbKey = mapping.awb_number || headers.find(h => /awb|docket|cn/i.test(h));

    if (!awbKey) {
      throw new Error('Could not identify AWB number column in the uploaded file.');
    }

    // Extract AWBs from records
    const rowAwbMap = new Map<string, any>();
    records.forEach(row => {
      const rawAwb = row[awbKey];
      if (rawAwb) {
        const awb = String(rawAwb).trim();
        if (awb) rowAwbMap.set(awb, row);
      }
    });

    const inputAwbs = Array.from(rowAwbMap.keys());

    // Fetch existing shipments from database
    const existingShipments = await prisma.shipment.findMany({
      where: {
        company_id: companyId,
        awb_number: { in: inputAwbs }
      }
    });

    const existingMap = new Map(existingShipments.map(s => [s.awb_number, s]));

    const diffs: DiffRow[] = [];
    const matchedAwbs: string[] = [];
    const unmatchedRows: ImportPreviewResult['unmatched_rows'] = [];

    inputAwbs.forEach(awb => {
      const row = rowAwbMap.get(awb);
      const existing = existingMap.get(awb);

      if (!existing) {
        // Unmatched Courier Shipment
        const rawStatus = mapping.status ? String(row[mapping.status] || '') : '';
        const delivDate = mapping.delivered_date ? String(row[mapping.delivered_date] || '') : '';
        const remark = mapping.remark ? String(row[mapping.remark] || '') : '';
        unmatchedRows.push({
          awb_number: awb,
          raw_status: rawStatus,
          delivered_date: delivDate,
          remark,
          raw_row: row
        });
      } else {
        matchedAwbs.push(awb);

        // Check courier-owned fields for changes
        const newStatus = mapping.status ? this.normalizeStatus(row[mapping.status]) : null;
        if (newStatus && newStatus !== existing.internal_status) {
          diffs.push({
            awb_number: awb,
            field_name: 'internal_status',
            field_label: 'Status',
            current_value: existing.internal_status || 'BOOKED',
            new_value: newStatus,
            ownership: 'COURIER',
            action: 'UPDATE'
          });
        }

        const newDelivered = mapping.delivered_date ? this.parseDate(row[mapping.delivered_date]) : null;
        const currentDeliveredStr = existing.delivery_date ? existing.delivery_date.toISOString().split('T')[0] : '';
        const newDeliveredStr = newDelivered ? newDelivered.toISOString().split('T')[0] : '';

        if (newDeliveredStr && newDeliveredStr !== currentDeliveredStr) {
          diffs.push({
            awb_number: awb,
            field_name: 'delivered_date',
            field_label: 'Delivered Date',
            current_value: currentDeliveredStr || 'Blank',
            new_value: newDeliveredStr,
            ownership: 'COURIER',
            action: 'UPDATE'
          });
        }

        const newEdd = mapping.edd_date ? this.parseDate(row[mapping.edd_date]) : null;
        const currentEddStr = existing.edd_date ? existing.edd_date.toISOString().split('T')[0] : '';
        const newEddStr = newEdd ? newEdd.toISOString().split('T')[0] : '';

        if (newEddStr && newEddStr !== currentEddStr) {
          diffs.push({
            awb_number: awb,
            field_name: 'edd_date',
            field_label: 'EDD Date',
            current_value: currentEddStr || 'Blank',
            new_value: newEddStr,
            ownership: 'COURIER',
            action: 'UPDATE'
          });
        }

        const newRtoDocket = mapping.rto_docket ? String(row[mapping.rto_docket] || '').trim() : '';
        if (newRtoDocket && newRtoDocket !== (existing.rto_docket || '')) {
          diffs.push({
            awb_number: awb,
            field_name: 'rto_docket',
            field_label: 'RTO Docket',
            current_value: existing.rto_docket || 'Blank',
            new_value: newRtoDocket,
            ownership: 'COURIER',
            action: 'UPDATE'
          });
        }

        const newRemark = mapping.remark ? String(row[mapping.remark] || '').trim() : '';
        if (newRemark && newRemark !== (existing.remarks || '')) {
          diffs.push({
            awb_number: awb,
            field_name: 'remarks',
            field_label: 'Courier Remark',
            current_value: existing.remarks || 'Blank',
            new_value: newRemark,
            ownership: 'COURIER',
            action: 'UPDATE'
          });
        }
      }
    });

    return {
      file_name: 'Courier_Delivery_Sheet',
      total_rows: records.length,
      matched_count: matchedAwbs.length,
      unmatched_count: unmatchedRows.length,
      detected_courier: courierName,
      detected_headers: headers,
      column_mapping: mapping,
      reconciliation_diffs: diffs,
      matched_awbs: matchedAwbs,
      unmatched_rows: unmatchedRows
    };
  }

  /**
   * Execute import: update matched shipments, store unmatched rows, create event logs & audit trails.
   */
  static async commitImport(
    previewData: ImportPreviewResult,
    companyId: string,
    courierId?: string,
    userId?: string
  ): Promise<{ updatedCount: number; unmatchedCreated: number }> {
    let updatedCount = 0;
    let unmatchedCreated = 0;

    // 1. Process matched shipments update
    const awbDiffGroup = new Map<string, DiffRow[]>();
    previewData.reconciliation_diffs.forEach(d => {
      const list = awbDiffGroup.get(d.awb_number) || [];
      list.push(d);
      awbDiffGroup.set(d.awb_number, list);
    });

    for (const [awb, diffs] of awbDiffGroup.entries()) {
      const updateData: any = {};
      let hasStatusChange = false;
      let newStatusStr = '';
      let deliveredDateObj: Date | null = null;

      diffs.forEach(d => {
        if (d.field_name === 'internal_status') {
          updateData.internal_status = d.new_value;
          hasStatusChange = true;
          newStatusStr = d.new_value;
        } else if (d.field_name === 'delivered_date') {
          deliveredDateObj = new Date(d.new_value);
          updateData.delivery_date = deliveredDateObj;
          updateData.deliveredAt = deliveredDateObj;
        } else if (d.field_name === 'edd_date') {
          updateData.edd_date = new Date(d.new_value);
        } else if (d.field_name === 'rto_docket') {
          updateData.rto_docket = d.new_value;
        } else if (d.field_name === 'remarks') {
          updateData.remarks = d.new_value;
        }
      });

      const shipment = await prisma.shipment.findUnique({
        where: { company_id_awb_number: { company_id: companyId, awb_number: awb } }
      });

      if (shipment) {
        // Calculate days to deliver if delivered
        const start = shipment.booking_date || shipment.created_at;
        const end = deliveredDateObj || shipment.delivery_date;
        if (end && start) {
          const diffMs = new Date(end).getTime() - new Date(start).getTime();
          updateData.days_to_deliver = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }

        // Recalculate demurrage
        const demurrageResult = DemurrageService.calculate({
          date_of_reaching_hub: shipment.date_of_reaching_hub,
          booking_date: shipment.booking_date,
          delivery_date: end || shipment.delivery_date,
          demurrage_free_days: shipment.demurrage_free_days,
          demurrage_rate: shipment.demurrage_rate ? Number(shipment.demurrage_rate) : 0,
          demurrage_gst_pct: shipment.demurrage_gst_pct ? Number(shipment.demurrage_gst_pct) : 18
        });

        updateData.demurrage_days = demurrageResult.demurrage_days;
        updateData.demurrage_amount = demurrageResult.demurrage_amount;
        updateData.demurrage_gst_amount = demurrageResult.demurrage_gst_amount;
        updateData.total_demurrage = demurrageResult.total_demurrage;

        await prisma.shipment.update({
          where: { id: shipment.id },
          data: updateData
        });

        // Create ShipmentEvent
        if (hasStatusChange) {
          await prisma.shipmentEvent.create({
            data: {
              company_id: companyId,
              shipment_id: shipment.id,
              event_type: newStatusStr,
              event_date: deliveredDateObj || new Date(),
              description: `Status updated to ${newStatusStr} via courier import`,
              source: 'COURIER',
              courier: previewData.detected_courier
            }
          });

          await prisma.shipmentStatusHistory.create({
            data: {
              shipment_id: shipment.id,
              status: newStatusStr,
              raw_status: newStatusStr,
              timestamp: new Date()
            }
          });
        }

        updatedCount++;
      }
    }

    // 2. Process unmatched courier rows -> insert into UnmatchedCourierShipment queue
    for (const u of previewData.unmatched_rows) {
      await prisma.unmatchedCourierShipment.create({
        data: {
          company_id: companyId,
          courier_id: courierId || null,
          awb_number: u.awb_number,
          courier_name: previewData.detected_courier,
          raw_status: u.raw_status || null,
          delivered_date: u.delivered_date ? this.parseDate(u.delivered_date) : null,
          remark: u.remark || null,
          raw_payload_json: JSON.stringify(u.raw_row),
          status: 'PENDING'
        }
      });
      unmatchedCreated++;
    }

    // 3. Create Audit Log
    await prisma.auditLog.create({
      data: {
        company_id: companyId,
        user_id: userId || null,
        action: 'MASTER_COURIER_IMPORT',
        entity_type: 'SHIPMENT_IMPORT',
        details: JSON.stringify({
          matched_updated: updatedCount,
          unmatched_staged: unmatchedCreated,
          courier_name: previewData.detected_courier,
          total_file_rows: previewData.total_rows
        })
      }
    });

    return { updatedCount, unmatchedCreated };
  }
}
