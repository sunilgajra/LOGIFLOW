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
    const data = req.body;
    const rateCard = await prisma.rateCard.update({
      where: { id, company_id: req.user?.company_id },
      data: {
        name: data.name,
        client_id: data.client_id ? data.client_id : null,
        courier_id: data.courier_id ? data.courier_id : null,
        min_weight_kg: data.min_weight_kg,
        docket_charge: data.docket_charge,
        min_booking_amount: data.min_booking_amount,
        volumetric_divisor: data.volumetric_divisor,
        fov_percentage: data.fov_percentage,
        fov_minimum: data.fov_minimum,
        fsc_percentage: data.fsc_percentage,
        idc_percentage: data.idc_percentage,
        oda_charge: data.oda_charge,
        green_tax_rate: data.green_tax_rate,
        rates_matrix: typeof data.rates_matrix === 'string' ? data.rates_matrix : JSON.stringify(data.rates_matrix || {})
      }
    });
    res.json(rateCard);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update rate card', details: error.message });
  }
};

export const deleteRateCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id || '');
    await prisma.rateCard.delete({
      where: { id, company_id: req.user?.company_id }
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

// Helper function to be called from import.controller.ts
export const calculateShipmentCost = async (shipmentData: any, companyId: string) => {
  if (!shipmentData.client_id) return null; // We can't calculate without a client

  // 1. Find Client's Rate Card
  const rateCard = await prisma.rateCard.findFirst({
    where: { client_id: shipmentData.client_id, company_id: companyId }
  });

  if (!rateCard) return null;

  // 2. Determine Chargeable Weight
  const actualWeight = parseFloat(shipmentData.actual_weight) || 0;
  const volumetricWeight = parseFloat(shipmentData.volumetric_weight) || 0;
  let chargeableWeight = Math.max(actualWeight, volumetricWeight);

  // Apply minimum weight from Rate Card
  if (rateCard.min_weight_kg > 0) {
    chargeableWeight = Math.max(chargeableWeight, rateCard.min_weight_kg);
  }

  // 3. Find Zones
  // Default to flat rate (no matrix) if no origin/dest provided
  let ratePerKg = 0;
  
  try {
    const matrix = JSON.parse(rateCard.rates_matrix || '{}');
    
    // We assume shipmentData has origin_state and dest_state. If not, maybe use city.
    // For now, if matrix is a simple object { "N1": 10, "S1": 15 }, we just need destZone.
    // If it's a nested object { "W1": { "S1": 15 } }, we need originZone and destZone.

    // Let's get dest zone
    const destZoneMapping = shipmentData.state ? await prisma.zoneMapping.findUnique({
      where: { company_id_state_name: { company_id: companyId, state_name: shipmentData.state } }
    }) : null;
    
    const destZone = destZoneMapping?.zone_name || 'DEFAULT';

    // Check if matrix is 2D (origin -> dest)
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
    console.error('Failed to parse rates matrix', e);
  }

  // Calculate base freight
  let freight = chargeableWeight * ratePerKg;

  // Apply minimum booking
  if (rateCard.min_booking_amount > 0) {
    freight = Math.max(freight, rateCard.min_booking_amount);
  }

  // Add Docket Charge
  let totalCost = freight + (rateCard.docket_charge || 0);

  // FOV Calculation
  const declaredValue = parseFloat(shipmentData.declared_value) || 0;
  if (rateCard.fov_percentage > 0) {
    let fov = declaredValue * (rateCard.fov_percentage / 100);
    if (rateCard.fov_minimum > 0) fov = Math.max(fov, rateCard.fov_minimum);
    totalCost += fov;
  }

  // FSC Calculation (on freight)
  const fsc_amount = freight * ((rateCard.fsc_percentage || 0) / 100);
  
  // IDC Calculation (on freight)
  const idc_amount = freight * ((rateCard.idc_percentage || 0) / 100);

  // ODA Amount (applied if shipment is ODA - for now apply standard rate if set and shipment marked as ODA)
  const oda_amount = shipmentData.is_oda ? (rateCard.oda_charge || 0) : 0;

  // Green Tax
  const green_tax_amount = rateCard.green_tax_rate || 0;

  totalCost += fsc_amount + idc_amount + oda_amount + green_tax_amount;

  return totalCost > 0 ? {
    client_charge: totalCost,
    fsc_amount,
    idc_amount,
    oda_amount,
    green_tax_amount
  } : null;
};
// Helper function to calculate COURIER cost (what the courier charges US)
export const calculateCourierCost = async (shipmentData: any, companyId: string): Promise<number | null> => {
  if (!shipmentData.courier_id) return null;

  const rateCard = await prisma.rateCard.findFirst({
    where: { courier_id: shipmentData.courier_id, company_id: companyId, type: 'COURIER' }
  });

  if (!rateCard) return null;

  const actualWeight = parseFloat(shipmentData.actual_weight) || 0;
  const volumetricWeight = parseFloat(shipmentData.volumetric_weight) || 0;
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

  let totalCost = freight + (rateCard.docket_charge || 0);

  const declaredValue = parseFloat(shipmentData.declared_value) || 0;
  if (rateCard.fov_percentage > 0) {
    let fov = declaredValue * (rateCard.fov_percentage / 100);
    if (rateCard.fov_minimum > 0) fov = Math.max(fov, rateCard.fov_minimum);
    totalCost += fov;
  }

  const fsc = freight * ((rateCard.fsc_percentage || 0) / 100);
  const idc = freight * ((rateCard.idc_percentage || 0) / 100);
  const oda = shipmentData.is_oda ? (rateCard.oda_charge || 0) : 0;
  const green_tax = rateCard.green_tax_rate || 0;

  totalCost += fsc + idc + oda + green_tax;

  return totalCost > 0 ? totalCost : null;
};
