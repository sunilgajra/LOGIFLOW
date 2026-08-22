import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

// CRUD for RateCards
export const getRateCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rateCards = await prisma.rateCard.findMany({
      where: { company_id: req.user?.company_id },
      include: { client: true, courier: true }
    });
    res.json(rateCards);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch rate cards', details: error.message });
  }
};

export const createRateCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const rateCard = await prisma.rateCard.create({
      data: {
        company_id: req.user?.company_id as string,
        name: data.name,
        type: data.type || 'CLIENT',
        client_id: data.client_id ? data.client_id : null,
        courier_id: data.courier_id ? data.courier_id : null,
        min_weight_kg: data.min_weight_kg || 0,
        docket_charge: data.docket_charge || 0,
        min_booking_amount: data.min_booking_amount || 0,
        volumetric_divisor: data.volumetric_divisor || 5000,
        fov_percentage: data.fov_percentage || 0,
        fov_minimum: data.fov_minimum || 0,
        fsc_percentage: data.fsc_percentage || 0,
        idc_percentage: data.idc_percentage || 0,
        oda_charge: data.oda_charge || 0,
        green_tax_rate: data.green_tax_rate || 0,
        rates_matrix: typeof data.rates_matrix === 'string' ? data.rates_matrix : JSON.stringify(data.rates_matrix || {})
      }
    });
    res.status(201).json(rateCard);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create rate card', details: error.message });
  }
};

export const updateRateCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.rateCard.findFirst({
      where: { id, company_id: companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rate card not found' });
    }

    const data = req.body;
    const rateCard = await prisma.rateCard.update({
      where: { id },
      data: {
        name: data.name || existing.name,
        type: data.type || existing.type,
        client_id: data.client_id !== undefined ? (data.client_id || null) : existing.client_id,
        courier_id: data.courier_id !== undefined ? (data.courier_id || null) : existing.courier_id,
        min_weight_kg: data.min_weight_kg !== undefined ? parseFloat(data.min_weight_kg) : existing.min_weight_kg,
        docket_charge: data.docket_charge !== undefined ? parseFloat(data.docket_charge) : existing.docket_charge,
        min_booking_amount: data.min_booking_amount !== undefined ? parseFloat(data.min_booking_amount) : existing.min_booking_amount,
        volumetric_divisor: data.volumetric_divisor !== undefined ? parseFloat(data.volumetric_divisor) : existing.volumetric_divisor,
        fov_percentage: data.fov_percentage !== undefined ? parseFloat(data.fov_percentage) : existing.fov_percentage,
        fov_minimum: data.fov_minimum !== undefined ? parseFloat(data.fov_minimum) : existing.fov_minimum,
        fsc_percentage: data.fsc_percentage !== undefined ? parseFloat(data.fsc_percentage) : existing.fsc_percentage,
        idc_percentage: data.idc_percentage !== undefined ? parseFloat(data.idc_percentage) : existing.idc_percentage,
        oda_charge: data.oda_charge !== undefined ? parseFloat(data.oda_charge) : existing.oda_charge,
        green_tax_rate: data.green_tax_rate !== undefined ? parseFloat(data.green_tax_rate) : existing.green_tax_rate,
        rates_matrix: typeof data.rates_matrix === 'string' ? data.rates_matrix : JSON.stringify(data.rates_matrix || {})
      }
    });
    res.json(rateCard);
  } catch (error: any) {
    console.error('Failed to update rate card:', error);
    res.status(500).json({ error: 'Failed to update rate card', details: error.message });
  }
};

export const deleteRateCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.rateCard.findFirst({
      where: { id, company_id: companyId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rate card not found' });
    }

    await prisma.rateCard.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete rate card', details: error.message });
  }
};

// Zone Mappings
export const getZoneMappings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const zones = await prisma.zoneMapping.findMany({
      where: { company_id: req.user?.company_id }
    });
    res.json(zones);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch zones', details: error.message });
  }
};

export const saveZoneMapping = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { state_name, zone_name } = req.body;
    const zone = await prisma.zoneMapping.upsert({
      where: {
        company_id_state_name: {
          company_id: req.user?.company_id as string,
          state_name
        }
      },
      update: { zone_name },
      create: {
        company_id: req.user?.company_id as string,
        state_name,
        zone_name
      }
    });
    res.json(zone);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save zone mapping', details: error.message });
  }
};

export interface ClientCostSnapshot {
  client_base_freight: number;
  client_docket_charge: number;
  client_fov_charge: number;
  client_fsc_amount: number;
  client_idc_amount: number;
  client_oda_amount: number;
  client_green_tax: number;
  client_gst_amount: number;
  client_total_charge: number;
}

export interface CourierCostSnapshot {
  courier_base_cost: number;
  courier_docket_cost: number;
  courier_fov_cost: number;
  courier_fsc_cost: number;
  courier_idc_cost: number;
  courier_oda_cost: number;
  courier_green_tax: number;
  courier_gst_amount: number;
  courier_total_cost: number;
}

// Helper function to calculate CLIENT SELLING RATE
export const calculateShipmentCost = async (shipmentData: any, companyId: string): Promise<ClientCostSnapshot | null> => {
  if (!shipmentData.client_id) return null;

  const rateCard = await prisma.rateCard.findFirst({
    where: { client_id: shipmentData.client_id, company_id: companyId }
  });

  if (!rateCard) return null;

  const divisor = rateCard.volumetric_divisor && rateCard.volumetric_divisor > 0 ? rateCard.volumetric_divisor : 5000;
  const length = parseFloat(shipmentData.length) || 0;
  const width = parseFloat(shipmentData.width) || 0;
  const height = parseFloat(shipmentData.height) || 0;
  
  let volumetricWeight = parseFloat(shipmentData.volumetric_weight) || 0;
  if (volumetricWeight === 0 && length > 0 && width > 0 && height > 0) {
    volumetricWeight = (length * width * height) / divisor;
  }

  const actualWeight = parseFloat(shipmentData.actual_weight) || 0;
  let chargeableWeight = Math.max(actualWeight, volumetricWeight);

  if (rateCard.min_weight_kg > 0) {
    chargeableWeight = Math.max(chargeableWeight, rateCard.min_weight_kg);
  }

  let ratePerKg = 0;
  try {
    const matrix = JSON.parse(rateCard.rates_matrix || '{}');
    const destZoneMapping = shipmentData.state ? await prisma.zoneMapping.findUnique({
      where: { company_id_state_name: { company_id: companyId, state_name: shipmentData.state } }
    }) : null;
    const destZone = destZoneMapping?.zone_name || 'DEFAULT';

    const originZoneMapping = shipmentData.origin ? await prisma.zoneMapping.findUnique({
      where: { company_id_state_name: { company_id: companyId, state_name: shipmentData.origin } }
    }) : null;
    const originZone = originZoneMapping?.zone_name || 'DEFAULT';

    if (matrix[originZone] && matrix[originZone][destZone]) {
      ratePerKg = parseFloat(String(matrix[originZone][destZone]));
    } else if (matrix[destZone] && (typeof matrix[destZone] === 'number' || typeof matrix[destZone] === 'string')) {
      ratePerKg = parseFloat(String(matrix[destZone]));
    }
  } catch (e) {
    console.error('Failed to parse client rates matrix', e);
  }

  let freight = chargeableWeight * ratePerKg;
  if (rateCard.min_booking_amount > 0) freight = Math.max(freight, rateCard.min_booking_amount);

  const docket = rateCard.docket_charge || 0;
  const declaredValue = parseFloat(shipmentData.declared_value) || 0;
  let fov = 0;
  if (rateCard.fov_percentage > 0) {
    fov = declaredValue * (rateCard.fov_percentage / 100);
    if (rateCard.fov_minimum > 0) fov = Math.max(fov, rateCard.fov_minimum);
  }

  const fsc = freight * ((rateCard.fsc_percentage || 0) / 100);
  const idc = freight * ((rateCard.idc_percentage || 0) / 100);
  const oda = shipmentData.is_oda ? (rateCard.oda_charge || 0) : 0;
  const green_tax = rateCard.green_tax_rate || 0;

  const subtotal = freight + docket + fov + fsc + idc + oda + green_tax;
  const gst = subtotal * 0.18; // Standard 18% GST
  const total = subtotal + gst;

  return subtotal > 0 ? {
    client_base_freight: Math.round(freight * 100) / 100,
    client_docket_charge: Math.round(docket * 100) / 100,
    client_fov_charge: Math.round(fov * 100) / 100,
    client_fsc_amount: Math.round(fsc * 100) / 100,
    client_idc_amount: Math.round(idc * 100) / 100,
    client_oda_amount: Math.round(oda * 100) / 100,
    client_green_tax: Math.round(green_tax * 100) / 100,
    client_gst_amount: Math.round(gst * 100) / 100,
    client_total_charge: Math.round(total * 100) / 100,
  } : null;
};

// Helper function to calculate COURIER PURCHASE COST
export const calculateCourierCost = async (shipmentData: any, companyId: string): Promise<CourierCostSnapshot | null> => {
  if (!shipmentData.courier_id) return null;

  const rateCard = await prisma.rateCard.findFirst({
    where: { courier_id: shipmentData.courier_id, company_id: companyId, type: 'COURIER' }
  });

  if (!rateCard) return null;

  const divisor = rateCard.volumetric_divisor && rateCard.volumetric_divisor > 0 ? rateCard.volumetric_divisor : 5000;
  const length = parseFloat(shipmentData.length) || 0;
  const width = parseFloat(shipmentData.width) || 0;
  const height = parseFloat(shipmentData.height) || 0;

  let volumetricWeight = parseFloat(shipmentData.volumetric_weight) || 0;
  if (volumetricWeight === 0 && length > 0 && width > 0 && height > 0) {
    volumetricWeight = (length * width * height) / divisor;
  }

  const actualWeight = parseFloat(shipmentData.actual_weight) || 0;
  let chargeableWeight = Math.max(actualWeight, volumetricWeight);

  if (rateCard.min_weight_kg > 0) {
    chargeableWeight = Math.max(chargeableWeight, rateCard.min_weight_kg);
  }

  let ratePerKg = 0;
  try {
    const matrix = JSON.parse(rateCard.rates_matrix || '{}');
    const destZoneMapping = shipmentData.state ? await prisma.zoneMapping.findUnique({
      where: { company_id_state_name: { company_id: companyId, state_name: shipmentData.state } }
    }) : null;
    const destZone = destZoneMapping?.zone_name || 'DEFAULT';

    const originZoneMapping = shipmentData.origin ? await prisma.zoneMapping.findUnique({
      where: { company_id_state_name: { company_id: companyId, state_name: shipmentData.origin } }
    }) : null;
    const originZone = originZoneMapping?.zone_name || 'DEFAULT';

    if (matrix[originZone] && matrix[originZone][destZone]) {
      ratePerKg = parseFloat(String(matrix[originZone][destZone]));
    } else if (matrix[destZone] && (typeof matrix[destZone] === 'number' || typeof matrix[destZone] === 'string')) {
      ratePerKg = parseFloat(String(matrix[destZone]));
    }
  } catch (e) {
    console.error('Failed to parse courier rates matrix', e);
  }

  let freight = chargeableWeight * ratePerKg;
  if (rateCard.min_booking_amount > 0) freight = Math.max(freight, rateCard.min_booking_amount);

  const docket = rateCard.docket_charge || 0;
  const declaredValue = parseFloat(shipmentData.declared_value) || 0;
  let fov = 0;
  if (rateCard.fov_percentage > 0) {
    fov = declaredValue * (rateCard.fov_percentage / 100);
    if (rateCard.fov_minimum > 0) fov = Math.max(fov, rateCard.fov_minimum);
  }

  const fsc = freight * ((rateCard.fsc_percentage || 0) / 100);
  const idc = freight * ((rateCard.idc_percentage || 0) / 100);
  const oda = shipmentData.is_oda ? (rateCard.oda_charge || 0) : 0;
  const green_tax = rateCard.green_tax_rate || 0;

  const subtotal = freight + docket + fov + fsc + idc + oda + green_tax;
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  return subtotal > 0 ? {
    courier_base_cost: Math.round(freight * 100) / 100,
    courier_docket_cost: Math.round(docket * 100) / 100,
    courier_fov_cost: Math.round(fov * 100) / 100,
    courier_fsc_cost: Math.round(fsc * 100) / 100,
    courier_idc_cost: Math.round(idc * 100) / 100,
    courier_oda_cost: Math.round(oda * 100) / 100,
    courier_green_tax: Math.round(green_tax * 100) / 100,
    courier_gst_amount: Math.round(gst * 100) / 100,
    courier_total_cost: Math.round(total * 100) / 100,
  } : null;
};

/**
 * Express Controller Endpoint: POST /api/rates/calculate
 * Computes itemized rate breakdown for client & courier, including estimated profit margin.
 */
export const calculateRateEstimate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const payload = req.body;
    
    // Auto-calculate volumetric weight
    const length = parseFloat(payload.length) || 0;
    const width = parseFloat(payload.width) || 0;
    const height = parseFloat(payload.height) || 0;
    const divisor = parseFloat(payload.volumetric_divisor) || 5000;
    
    const actual_weight = parseFloat(payload.actual_weight) || 0;
    let volumetric_weight = parseFloat(payload.volumetric_weight) || 0;
    
    if (volumetric_weight === 0 && length > 0 && width > 0 && height > 0) {
      volumetric_weight = (length * width * height) / divisor;
    }

    const chargeable_weight = Math.max(actual_weight, volumetric_weight);

    const calculationPayload = {
      ...payload,
      actual_weight,
      volumetric_weight,
      chargeable_weight,
    };

    const clientCostData = await calculateShipmentCost(calculationPayload, companyId);
    const courierCostData = await calculateCourierCost(calculationPayload, companyId);

    const clientCharge = clientCostData?.client_total_charge || 0;
    const courierCost = courierCostData?.courier_total_cost || 0;
    const estimatedProfit = clientCharge > 0 && courierCost > 0 ? clientCharge - courierCost : 0;
    const profitMarginPercentage = clientCharge > 0 ? (estimatedProfit / clientCharge) * 100 : 0;

    res.json({
      actual_weight,
      volumetric_weight: Math.round(volumetric_weight * 100) / 100,
      chargeable_weight: Math.round(chargeable_weight * 100) / 100,
      client_charge: Math.round(clientCharge * 100) / 100,
      courier_cost: Math.round(courierCost * 100) / 100,
      estimated_profit: Math.round(estimatedProfit * 100) / 100,
      profit_margin_pct: Math.round(profitMarginPercentage * 10) / 10,
      client_breakdown: clientCostData,
      courier_breakdown: courierCostData
    });
  } catch (error: any) {
    console.error('Error calculating rate estimate:', error);
    res.status(500).json({ error: 'Failed to calculate rate estimate', details: error.message });
  }
};

