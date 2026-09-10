import { Response } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { prisma } from '../prisma';
import * as xlsx from 'xlsx';

export const getMasterReportData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      clientId,
      courierId,
      month,
      startDate,
      endDate,
      status,
      state,
      city,
      service,
      zone,
      isRto,
      isDemurrage,
      podStatus,
      invoice,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const where: any = { company_id: companyId };

    if (req.user?.role === 'CLIENT' && req.user.client_id) {
      where.client_id = req.user.client_id;
    } else if (clientId) {
      where.client_id = clientId as string;
    }

    if (courierId) where.courier_id = courierId as string;
    if (month) where.month_tag = (month as string).toUpperCase();
    if (status) where.internal_status = status as string;
    if (state) where.state = { contains: state as string, mode: 'insensitive' };
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (service) where.service_type = service as string;
    if (zone) where.client_zone = zone as string;
    if (podStatus) where.pod_status = podStatus as string;

    if (isRto === 'true') {
      where.internal_status = 'RTO';
    }

    if (isDemurrage === 'true') {
      where.demurrage_days = { gt: 0 };
    }

    if (invoice) {
      where.OR = [
        { invoice_no: { contains: invoice as string, mode: 'insensitive' } },
        { client_reference_no: { contains: invoice as string, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.booking_date = {};
      if (startDate) where.booking_date.gte = new Date(startDate as string);
      if (endDate) where.booking_date.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { awb_number: { contains: search as string, mode: 'insensitive' } },
        { receiver_name: { contains: search as string, mode: 'insensitive' } },
        { consignor: { contains: search as string, mode: 'insensitive' } },
        { invoice_no: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const p = Math.max(1, parseInt(page as string) || 1);
    const l = Math.max(1, parseInt(limit as string) || 50);
    const skip = (p - 1) * l;

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: l,
        orderBy: { booking_date: 'desc' },
        include: {
          client: true,
          courier: true,
          shipment_events: { orderBy: { event_date: 'desc' } }
        }
      }),
      prisma.shipment.count({ where })
    ]);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    });
  } catch (error: any) {
    console.error('Error fetching master report data:', error);
    res.status(500).json({ error: 'Failed to fetch report data', details: error.message });
  }
};

export const exportMasterReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      clientId,
      courierId,
      month,
      startDate,
      endDate,
      status,
      state,
      city,
      service,
      zone,
      isRto,
      isDemurrage,
      podStatus,
      invoice,
      search,
      format = 'excel'
    } = req.query;

    const where: any = { company_id: companyId };

    if (req.user?.role === 'CLIENT' && req.user.client_id) {
      where.client_id = req.user.client_id;
    } else if (clientId) {
      where.client_id = clientId as string;
    }

    if (courierId) where.courier_id = courierId as string;
    if (month) where.month_tag = (month as string).toUpperCase();
    if (status) where.internal_status = status as string;
    if (state) where.state = { contains: state as string, mode: 'insensitive' };
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (service) where.service_type = service as string;
    if (zone) where.client_zone = zone as string;
    if (podStatus) where.pod_status = podStatus as string;

    if (isRto === 'true') where.internal_status = 'RTO';
    if (isDemurrage === 'true') where.demurrage_days = { gt: 0 };

    if (invoice) {
      where.OR = [
        { invoice_no: { contains: invoice as string, mode: 'insensitive' } },
        { client_reference_no: { contains: invoice as string, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.booking_date = {};
      if (startDate) where.booking_date.gte = new Date(startDate as string);
      if (endDate) where.booking_date.lte = new Date(endDate as string);
    }

    if (search) {
      where.OR = [
        { awb_number: { contains: search as string, mode: 'insensitive' } },
        { receiver_name: { contains: search as string, mode: 'insensitive' } },
        { consignor: { contains: search as string, mode: 'insensitive' } },
        { invoice_no: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const shipments = await prisma.shipment.findMany({
      where,
      orderBy: { booking_date: 'desc' },
      include: {
        client: true,
        courier: true,
        shipment_events: { orderBy: { event_date: 'asc' } }
      }
    });

    const formatRow = (s: any, idx: number) => {
      const bDate = s.booking_date ? new Date(s.booking_date).toISOString().split('T')[0] : '';
      const dDate = s.delivery_date ? new Date(s.delivery_date).toISOString().split('T')[0] : '';
      const edd = s.edd_date ? new Date(s.edd_date).toISOString().split('T')[0] : '';
      const rtoD = s.rto_date ? new Date(s.rto_date).toISOString().split('T')[0] : '';

      return {
        'COMPANY': s.client?.company_name || 'LOGIFLOW',
        'SR': s.sr_no || idx + 1,
        'MONTH': s.month_tag || (bDate ? new Date(bDate).toLocaleString('default', { month: 'long' }).toUpperCase() : '2026'),
        'DATE': bDate,
        'A/C': s.ac_code || s.client_id || '',
        'AWB NO': s.awb_number,
        'B. WEIGHT': s.b_weight ? Number(s.b_weight) : Number(s.chargeable_weight || 0),
        'AMT': Number(s.client_charge || s.client_total_charge || 0),
        'CONSIGNOR': s.consignor || s.sender_name || '',
        'PICKUP': s.pickup_location || s.origin || '',
        'CITY': s.city || '',
        'STATE': s.state || '',
        'QTY': s.qty || s.number_of_pieces || 1,
        'R.WGT': s.r_weight ? Number(s.r_weight) : Number(s.actual_weight || 0),
        'ITEM': s.item_description || s.package_type || '',
        'PINCODE': s.pincode || '',
        'SERVICE': s.service_type || '',
        'Z': s.client_zone || s.courier_zone || '',
        'CONSIGNEE': s.receiver_name || '',
        'INVOICE': s.invoice_no || s.client_reference_no || '',
        'ROV TYPE': s.rov_type || 'STANDARD',
        'INVOICE AMT': Number(s.invoice_amt || s.declared_value || 0),
        'STATUS': s.internal_status,
        'EDD DATE': edd,
        'DELIVERED DATE': dDate,
        'RTO DOCKET': s.rto_docket || '',
        'Transit Days': s.transit_days || 0,
        'Days to Deliver': s.days_to_deliver || 0,
        'Demurrage Free Days': s.demurrage_free_days || 3,
        'Demurrage Days': s.demurrage_days || 0,
        'Demurrage Rate': Number(s.demurrage_rate || 0),
        'Demurrage Amount': Number(s.demurrage_amount || 0),
        'GST (%)': Number(s.demurrage_gst_pct || 18),
        'Total Demurrage': Number(s.total_demurrage || 0),
        'POD STATUS': s.pod_status || 'PENDING',
        'REMARK': s.remarks || ''
      };
    };

    const formattedData = shipments.map((s, i) => formatRow(s, i));

    if (format === 'csv') {
      const worksheet = xlsx.utils.json_to_sheet(formattedData);
      const csvOutput = xlsx.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="MASTER_TRACKING_REPORT.csv"');
      return res.send(csvOutput);
    } else if (format === 'pdf') {
      // Simplified HTML -> PDF payload simulation / json representation
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        success: true,
        type: 'pdf',
        total_rows: formattedData.length,
        summary: `Master Tracking PDF Report generated with ${formattedData.length} records.`
      });
    } else {
      // Excel (.xlsx) output with monthly sheets if requested or single master sheet
      const workbook = xlsx.utils.book_new();

      // Group by month if month wasn't strictly single-filtered
      const monthGroups = new Map<string, any[]>();
      formattedData.forEach(row => {
        const m = row['MONTH'] || 'MASTER';
        const list = monthGroups.get(m) || [];
        list.push(row);
        monthGroups.set(m, list);
      });

      if (monthGroups.size > 1) {
        // Add single MASTER sheet first
        const masterSheet = xlsx.utils.json_to_sheet(formattedData);
        xlsx.utils.book_append_sheet(workbook, masterSheet, 'ALL_SHIPMENTS');

        // Add monthly sheets
        for (const [mName, mRows] of monthGroups.entries()) {
          const mSheet = xlsx.utils.json_to_sheet(mRows);
          xlsx.utils.book_append_sheet(workbook, mSheet, mName.substring(0, 31));
        }
      } else {
        const sheetName = month ? String(month).toUpperCase() : 'MASTER_TRACKING';
        const worksheet = xlsx.utils.json_to_sheet(formattedData);
        xlsx.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));
      }

      const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="TRACKING_SHEET_2026.xlsx"');
      return res.send(buffer);
    }
  } catch (error: any) {
    console.error('Error exporting master report:', error);
    res.status(500).json({ error: 'Failed to export master report', details: error.message });
  }
};

export const updatePodStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = String(req.user?.company_id || '');
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const targetId = String(id || '');
    const { pod_status, pod_doc_url } = req.body;

    const shipment = await prisma.shipment.findFirst({
      where: {
        company_id: companyId,
        OR: [{ id: targetId }, { awb_number: targetId }]
      }
    });

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        pod_status: pod_status || shipment.pod_status,
        pod_doc_url: pod_doc_url || shipment.pod_doc_url,
        pod_uploaded_at: pod_doc_url ? new Date() : shipment.pod_uploaded_at
      }
    });

    // Create event log for POD update
    await prisma.shipmentEvent.create({
      data: {
        company_id: companyId,
        shipment_id: shipment.id,
        event_type: 'POD_UPDATED',
        event_date: new Date(),
        description: `POD Status changed to ${updated.pod_status}${pod_doc_url ? ' with file upload' : ''}`,
        source: 'COMPANY'
      }
    });

    res.json({ success: true, message: 'POD status updated successfully', shipment: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update POD status', details: error.message });
  }
};
