import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const calculateRateQuotes = async (req: Request, res: Response) => {
  try {
    const {
      origin_pincode,
      destination_pincode,
      actual_weight = 1.0,
      length = 0,
      width = 0,
      height = 0,
      payment_mode = 'PREPAID',
      cod_amount = 0,
      declared_value = 0,
      service_type = 'ALL'
    } = req.body;

    if (!origin_pincode || !destination_pincode) {
      return res.status(400).json({ error: 'Origin and Destination Pincodes are required' });
    }

    const numericActual = parseFloat(actual_weight.toString()) || 1.0;
    const l = parseFloat(length.toString()) || 0;
    const w = parseFloat(width.toString()) || 0;
    const h = parseFloat(height.toString()) || 0;
    const numericCod = parseFloat(cod_amount.toString()) || 0;
    const numericValue = parseFloat(declared_value.toString()) || 0;

    // Volumetric Weight Calculation
    const volumetric_weight = l > 0 && w > 0 && h > 0 ? (l * w * h) / 5000 : 0;
    const chargeable_weight = Math.max(numericActual, parseFloat(volumetric_weight.toFixed(2)));

    // Zone Auto-Detection Logic
    let zone = 'REST_OF_INDIA';
    let zoneName = 'Zone D (Rest of India)';
    
    const origPrefix = origin_pincode.substring(0, 2);
    const destPrefix = destination_pincode.substring(0, 2);
    const metroPrefixes = ['11', '40', '56', '60', '70', '50']; // Delhi, Mumbai, Blr, Chennai, Kolkata, Hyd

    if (origin_pincode === destination_pincode) {
      zone = 'INTRA_CITY';
      zoneName = 'Zone A (Intra-City)';
    } else if (origPrefix === destPrefix) {
      zone = 'REGIONAL';
      zoneName = 'Zone B (Regional / Same State)';
    } else if (metroPrefixes.includes(origPrefix) && metroPrefixes.includes(destPrefix)) {
      zone = 'METRO';
      zoneName = 'Zone C (Metro to Metro)';
    } else if (['79', '78', '19', '74'].includes(destPrefix)) {
      zone = 'SPECIAL';
      zoneName = 'Zone E (NE / J&K / Special Region)';
    }

    // Fetch Active Couriers from DB
    const activeCouriers = await prisma.courierPartner.findMany({
      where: { status: 'ACTIVE' }
    });

    // Default Courier Catalog if none in DB
    const defaultCouriers = [
      { id: 'c1', courier_name: 'Delhivery Express Air', service_type: 'EXPRESS', base_rate_per_kg: 90, docket: 40, fsc: 12, rating: 4.8, sla: zone === 'INTRA_CITY' ? '1 Day' : zone === 'REGIONAL' ? '1-2 Days' : zone === 'METRO' ? '2 Days' : '3-4 Days' },
      { id: 'c2', courier_name: 'BlueDart Air Apex', service_type: 'EXPRESS', base_rate_per_kg: 110, docket: 50, fsc: 15, rating: 4.9, sla: zone === 'INTRA_CITY' ? 'Same Day' : zone === 'REGIONAL' ? '1 Day' : zone === 'METRO' ? '1-2 Days' : '2-3 Days' },
      { id: 'c3', courier_name: 'Ecom Express Surface', service_type: 'SURFACE', base_rate_per_kg: 65, docket: 30, fsc: 10, rating: 4.6, sla: zone === 'INTRA_CITY' ? '1-2 Days' : zone === 'REGIONAL' ? '2-3 Days' : zone === 'METRO' ? '3-4 Days' : '4-5 Days' },
      { id: 'c4', courier_name: 'Shadowfax Quick Delivery', service_type: 'EXPRESS', base_rate_per_kg: 80, docket: 35, fsc: 10, rating: 4.5, sla: zone === 'INTRA_CITY' ? '1 Day' : zone === 'REGIONAL' ? '2 Days' : zone === 'METRO' ? '2-3 Days' : '3-4 Days' },
      { id: 'c5', courier_name: 'DTDC Plus Air', service_type: 'EXPRESS', base_rate_per_kg: 95, docket: 45, fsc: 12, rating: 4.7, sla: zone === 'INTRA_CITY' ? '1 Day' : zone === 'REGIONAL' ? '1-2 Days' : zone === 'METRO' ? '2 Days' : '3-4 Days' }
    ];

    const courierList = activeCouriers.length > 0 
      ? activeCouriers.map((ac, idx) => ({
          id: ac.id,
          courier_name: ac.courier_name,
          service_type: idx % 2 === 0 ? 'EXPRESS' : 'SURFACE',
          base_rate_per_kg: 70 + (idx * 15),
          docket: 35 + (idx * 5),
          fsc: 10 + (idx * 2),
          rating: (4.9 - (idx * 0.1)).toFixed(1),
          sla: zone === 'INTRA_CITY' ? '1 Day' : zone === 'REGIONAL' ? '1-2 Days' : zone === 'METRO' ? '2-3 Days' : '3-5 Days'
        }))
      : defaultCouriers;

    // Filter by service type if requested
    const filteredCouriers = service_type !== 'ALL'
      ? courierList.filter(c => c.service_type === service_type)
      : courierList;

    // Calculate Quotes
    const quotes = filteredCouriers.map(courier => {
      // Zone Multiplier
      let zoneMultiplier = 1.0;
      if (zone === 'INTRA_CITY') zoneMultiplier = 0.75;
      else if (zone === 'REGIONAL') zoneMultiplier = 0.9;
      else if (zone === 'METRO') zoneMultiplier = 1.1;
      else if (zone === 'SPECIAL') zoneMultiplier = 1.6;

      const baseFreight = Math.round(chargeable_weight * courier.base_rate_per_kg * zoneMultiplier);
      const docketFee = courier.docket;
      const fscAmount = Math.round((baseFreight * courier.fsc) / 100);
      const codFee = payment_mode === 'COD' ? Math.max(45, Math.round(numericCod * 0.02)) : 0;
      const fovFee = numericValue > 5000 ? Math.round(numericValue * 0.002) : 0;

      const subtotal = baseFreight + docketFee + fscAmount + codFee + fovFee;
      const gstAmount = Math.round(subtotal * 0.18);
      const totalCost = subtotal + gstAmount;

      return {
        courier_id: courier.id,
        courier_name: courier.courier_name,
        service_type: courier.service_type,
        rating: courier.rating,
        estimated_sla: courier.sla,
        chargeable_weight,
        breakdown: {
          baseFreight,
          docketFee,
          fscAmount,
          codFee,
          fovFee,
          subtotal,
          gstAmount,
          totalCost
        }
      };
    });

    // Sort quotes by total cost ascending (cheapest first)
    quotes.sort((a, b) => a.breakdown.totalCost - b.breakdown.totalCost);

    return res.json({
      summary: {
        origin_pincode,
        destination_pincode,
        zone,
        zoneName,
        actual_weight: numericActual,
        volumetric_weight: parseFloat(volumetric_weight.toFixed(2)),
        chargeable_weight,
        payment_mode,
        cod_amount: numericCod,
        declared_value: numericValue
      },
      quotes
    });
  } catch (error: any) {
    console.error('Error calculating rate quotes:', error);
    return res.status(500).json({ error: 'Failed to calculate rate quotes: ' + error.message });
  }
};
