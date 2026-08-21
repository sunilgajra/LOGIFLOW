import { Response } from 'express';
import { prisma } from '../prisma';
import { PrismaClient } from '@prisma/client';
import { calculateShipmentCost, calculateCourierCost } from './rate.controller';
import { CourierFactory } from '../services/courier/CourierFactory';
import { AuthenticatedRequest } from '../auth.middleware';

export const getShipments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let { status, clientId, courierId, search } = req.query;

    if (req.user?.role === 'CLIENT') {
      clientId = req.user.client_id;
    }

    const where: any = { company_id: req.user?.company_id };

    if (status) where.internal_status = status;
    if (clientId) where.client_id = clientId;
    if (courierId) where.courier_id = courierId;
    if (search) {
      where.OR = [
        { awb_number: { contains: search as string, mode: 'insensitive' } },
        { receiver_name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { booking_date: 'desc' },
        include: {
          client: true,
          courier: true,
        }
      }),
      prisma.shipment.count({ where })
    ]);

    res.json({
      data: shipments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch shipments', details: error.message });
  }
};

export const bookShipment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const payload = req.body;
    
    if (req.user?.role === 'CLIENT' && req.user?.client_id) {
      payload.client_id = req.user.client_id;
    }
    // Auto-calculate volumetric weight if dimensions are provided but volumetric weight is not
    let volumetric_weight = parseFloat(payload.volumetric_weight) || 0;
    if (volumetric_weight === 0 && payload.length && payload.width && payload.height) {
      let divisor = 5000;
      if (payload.client_id) {
        const rc = await prisma.rateCard.findFirst({ where: { client_id: payload.client_id, company_id: companyId } });
        if (rc && rc.volumetric_divisor > 0) divisor = rc.volumetric_divisor;
      }
      volumetric_weight = (parseFloat(payload.length) * parseFloat(payload.width) * parseFloat(payload.height)) / divisor;
    }

    let chargeable_weight = parseFloat(payload.chargeable_weight) || Math.max(parseFloat(payload.actual_weight) || 0, volumetric_weight);

    // Call calculateShipmentCost to assign rates
    const shipmentDataForPricing = {
      ...payload,
      awb_number: payload.awb_number || 'TEMP_AWB',
      volumetric_weight,
      chargeable_weight,
      actual_weight: parseFloat(payload.actual_weight) || 0,
    };

    const costDetails = await calculateShipmentCost(shipmentDataForPricing, companyId);

    // Courier Integration
    let finalAwbNumber = payload.awb_number || `AWB${Math.floor(Date.now() / 1000)}${Math.floor(Math.random() * 100)}`;
    let labelUrl = null;

    if (payload.courier_id) {
      const courierPartner = await prisma.courierPartner.findUnique({
        where: { id: payload.courier_id }
      });

      if (courierPartner) {
        const provider = CourierFactory.getProvider(courierPartner.courier_name, courierPartner.api_credentials);
        try {
          const bookingRes = await provider.bookShipment({
            shipmentId: 'PENDING_CREATION',
            senderName: payload.sender_name || 'Sender',
            senderAddress: payload.sender_address || '',
            senderPhone: payload.sender_phone || '',
            receiverName: payload.receiver_name || 'Receiver',
            receiverAddress: payload.receiver_address || '',
            receiverPhone: payload.receiver_phone || '',
            weight: chargeable_weight,
            pieces: parseInt(payload.number_of_pieces) || 1,
            isCod: parseFloat(payload.cod_amount) > 0,
            codAmount: parseFloat(payload.cod_amount) || 0,
          });

          if (bookingRes.success && bookingRes.awbNumber) {
            finalAwbNumber = bookingRes.awbNumber;
            labelUrl = bookingRes.labelUrl || null;
          } else {
            console.warn(`Courier API returned error or no AWB:`, bookingRes.error);
          }
        } catch (error) {
          console.error(`Error booking with courier ${courierPartner.courier_name}:`, error);
          // Fallback to auto-generated AWB if API fails
        }
      }
    }

    // Calculate courier cost (what the courier charges us) and profit
    const courierCostData = await calculateCourierCost({
      ...payload,
      courier_id: payload.courier_id,
      actual_weight: parseFloat(payload.actual_weight) || 0,
      volumetric_weight,
      state: payload.state,
      origin: payload.origin,
      declared_value: payload.declared_value,
    }, companyId);
    const courierCostAmount = courierCostData || 0;
    const clientChargeAmount = costDetails?.client_charge || 0;
    const profitAmount = clientChargeAmount > 0 && courierCostAmount > 0 ? clientChargeAmount - courierCostAmount : null;

    const clientId = payload.client_id && String(payload.client_id).trim() !== '' ? String(payload.client_id) : null;
    const courierId = payload.courier_id && String(payload.courier_id).trim() !== '' ? String(payload.courier_id) : null;

    // Save to database
    const shipment = await prisma.shipment.create({
      data: {
        company_id: companyId,
        awb_number: finalAwbNumber,
        client_id: clientId,
        courier_id: courierId,
        booking_date: payload.booking_date ? new Date(payload.booking_date) : new Date(),
        origin: payload.origin,
        destination: payload.destination,
        city: payload.city,
        state: payload.state,
        pincode: payload.pincode,
        receiver_name: payload.receiver_name,
        receiver_phone: payload.receiver_phone,
        receiver_address: payload.receiver_address,
        sender_name: payload.sender_name,
        sender_phone: payload.sender_phone,
        sender_address: payload.sender_address,
        service_type: payload.service_type || 'EXPRESS',
        package_type: payload.package_type || 'PARCEL',
        number_of_pieces: parseInt(payload.number_of_pieces) || 1,
        actual_weight: parseFloat(payload.actual_weight) || 0,
        volumetric_weight: volumetric_weight,
        chargeable_weight: chargeable_weight,
        declared_value: parseFloat(payload.declared_value) || 0,
        internal_status: req.user?.role === 'CLIENT' ? 'PENDING_APPROVAL' : (payload.internal_status || 'BOOKED'),
        label_url: labelUrl,

        appointment_date: payload.appointment_date ? new Date(payload.appointment_date) : null,
        appointment_slot: payload.appointment_slot || null,
        appointment_token: payload.appointment_token || (payload.appointment_date ? `APT-${Math.floor(100000 + Math.random() * 900000)}` : null),
        dock_number: payload.dock_number || null,
        appointment_status: payload.appointment_status || (payload.appointment_date ? 'SCHEDULED' : 'NOT_REQUIRED'),
        appointment_notes: payload.appointment_notes || null,
        po_number: payload.po_number || null,
        po_expiry_date: payload.po_expiry_date ? new Date(payload.po_expiry_date) : null,
        promised_delivery_date: payload.promised_delivery_date ? new Date(payload.promised_delivery_date) : null,
        
        // Add assigned rates
        client_charge: clientChargeAmount,
        courier_cost: courierCostAmount || null,
        profit: profitAmount,
        fsc_amount: costDetails?.fsc_amount || 0,
        idc_amount: costDetails?.idc_amount || 0,
        oda_amount: costDetails?.oda_amount || 0,
        green_tax_amount: costDetails?.green_tax_amount || 0,
        
        status_history: {
          create: {
            status: 'BOOKED',
            timestamp: new Date()
          }
        }
      }
    });

    res.json({ message: 'Shipment booked successfully', shipment });
  } catch (error: any) {
    console.error('Book shipment error:', error);
    res.status(500).json({ error: 'Failed to book shipment', details: error.message });
  }
};

export const updateShipment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const payload = req.body;

    // Verify shipment belongs to this company
    const existing = await prisma.shipment.findFirst({
      where: { id: String(id), company_id: String(companyId) }
    });
    if (!existing) return res.status(404).json({ error: 'Shipment not found' });

    // If courier is being assigned for the first time or changed, hit courier API
    let newAwb = payload.awb_number || existing.awb_number;
    let newLabelUrl = payload.label_url || existing.label_url;

    const courierChanged = payload.courier_id && payload.courier_id !== existing.courier_id;
    const awbNotFromCourier = !existing.courier_id; // first time assigning courier

    if (payload.courier_id && (courierChanged || awbNotFromCourier)) {
      const courierPartner = await prisma.courierPartner.findUnique({
        where: { id: payload.courier_id }
      });

      if (courierPartner) {
        const provider = CourierFactory.getProvider(courierPartner.courier_name, courierPartner.api_credentials);
        try {
          const bookingRes = await provider.bookShipment({
            shipmentId: existing.id,
            senderName: payload.sender_name || existing.sender_name || 'Sender',
            senderAddress: payload.sender_address || existing.sender_address || '',
            senderPhone: payload.sender_phone || existing.sender_phone || '',
            receiverName: payload.receiver_name || existing.receiver_name || 'Receiver',
            receiverAddress: payload.receiver_address || existing.receiver_address || '',
            receiverPhone: payload.receiver_phone || existing.receiver_phone || '',
            weight: parseFloat(payload.actual_weight) || existing.actual_weight || 1,
            pieces: parseInt(payload.number_of_pieces) || existing.number_of_pieces || 1,
            isCod: (parseFloat(payload.cod_amount) || 0) > 0,
            codAmount: parseFloat(payload.cod_amount) || 0,
          });

          if (bookingRes.success && bookingRes.awbNumber) {
            newAwb = bookingRes.awbNumber;
            newLabelUrl = bookingRes.labelUrl || null;
          }
        } catch (err) {
          console.error('Courier API error on update:', err);
          // Continue with manual AWB
        }
      }
    }

    const updated = await prisma.shipment.update({
      where: { id: String(id) },
      data: {
        awb_number: newAwb,
        label_url: newLabelUrl,
        courier_id: payload.courier_id !== undefined ? payload.courier_id || null : undefined,
        client_id: payload.client_id !== undefined ? payload.client_id || null : undefined,
        receiver_name: payload.receiver_name,
        receiver_phone: payload.receiver_phone,
        receiver_address: payload.receiver_address,
        sender_name: payload.sender_name,
        sender_phone: payload.sender_phone,
        sender_address: payload.sender_address,
        city: payload.city,
        state: payload.state,
        pincode: payload.pincode,
        origin: payload.origin,
        destination: payload.destination,
        actual_weight: payload.actual_weight !== undefined ? parseFloat(payload.actual_weight) : undefined,
        number_of_pieces: payload.number_of_pieces !== undefined ? parseInt(payload.number_of_pieces) : undefined,
        declared_value: payload.declared_value !== undefined ? parseFloat(payload.declared_value) : undefined,
        service_type: payload.service_type,
        package_type: payload.package_type,
        internal_status: payload.internal_status,
        remarks: payload.remarks,
        appointment_date: payload.appointment_date !== undefined ? (payload.appointment_date ? new Date(payload.appointment_date) : null) : undefined,
        appointment_slot: payload.appointment_slot !== undefined ? payload.appointment_slot : undefined,
        appointment_token: payload.appointment_token !== undefined ? payload.appointment_token : undefined,
        dock_number: payload.dock_number !== undefined ? payload.dock_number : undefined,
        appointment_status: payload.appointment_status !== undefined ? payload.appointment_status : undefined,
        appointment_notes: payload.appointment_notes !== undefined ? payload.appointment_notes : undefined,
        po_number: payload.po_number !== undefined ? payload.po_number : undefined,
        po_expiry_date: payload.po_expiry_date !== undefined ? (payload.po_expiry_date ? new Date(payload.po_expiry_date) : null) : undefined,
        promised_delivery_date: payload.promised_delivery_date !== undefined ? (payload.promised_delivery_date ? new Date(payload.promised_delivery_date) : null) : undefined,
      },
      include: { client: true, courier: true }
    });

    res.json({ message: 'Shipment updated successfully', shipment: updated });
  } catch (error: any) {
    console.error('Update shipment error:', error);
    res.status(500).json({ error: 'Failed to update shipment', details: error.message });
  }
};
