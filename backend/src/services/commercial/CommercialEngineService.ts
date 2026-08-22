import { prisma } from '../../prisma';
import { ApiLogService } from '../logger/ApiLogService';

export interface CalculateWeightsInput {
  actualKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumetricDivisor?: number;
}

export interface WeightCalculationResult {
  actualKg: number;
  volumetricKg: number;
  chargeableKg: number;
}

export interface RateCalculationInput {
  companyId: string;
  clientId?: string;
  courierId?: string;
  courierAccountId?: string;
  originPincode: string;
  destPincode: string;
  actualKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number;
  serviceType?: 'SURFACE' | 'EXPRESS';
  bookingDate?: Date;
}

export interface ClientRateCalculationResult {
  rateCardId: string;
  rateCardName: string;
  version: string;
  zone: string;
  chargeableKg: number;
  baseFreight: number;
  codCharge: number;
  fuelSurcharge: number;
  handlingFee: number;
  remoteAreaFee: number;
  otherSurcharge: number;
  gstAmount: number;
  totalCharge: number;
}

export interface CourierRateCalculationResult {
  rateCardId: string;
  rateCardName: string;
  version: string;
  zone: string;
  chargeableKg: number;
  baseCost: number;
  codCost: number;
  fuelSurcharge: number;
  rtoCharge: number;
  ndrCharge: number;
  returnShippingCharge: number;
  remoteAreaCharge: number;
  otherCharge: number;
  gstAmount: number;
  totalCost: number;
}

export class CommercialEngineService {
  /**
   * Rounds financial numbers to exactly 2 decimal places to eliminate floating-point drift.
   */
  static round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Calculates volumetric weight and chargeable weight: MAX(actual_weight, volumetric_weight).
   */
  static calculateWeights(input: CalculateWeightsInput): WeightCalculationResult {
    const divisor = input.volumetricDivisor && input.volumetricDivisor > 0 ? input.volumetricDivisor : 5000;
    let volKg = 0;

    if (input.lengthCm && input.widthCm && input.heightCm && input.lengthCm > 0 && input.widthCm > 0 && input.heightCm > 0) {
      volKg = (input.lengthCm * input.widthCm * input.heightCm) / divisor;
    }

    volKg = this.round2(volKg);
    const actualKg = this.round2(input.actualKg || 0);
    const chargeableKg = this.round2(Math.max(actualKg, volKg));

    return { actualKg, volumetricKg: volKg, chargeableKg };
  }

  /**
   * Resolves shipping zone for pincode mapping.
   */
  static async resolveZone(companyId: string, originPincode: string, destPincode: string, courierId?: string, clientId?: string): Promise<string> {
    // 1. Check custom PincodeZoneMapping
    const mapping = await prisma.pincodeZoneMapping.findFirst({
      where: {
        company_id: companyId,
        pincode: destPincode,
        OR: [
          { courier_id: courierId || null },
          { client_id: clientId || null },
          { courier_id: null, client_id: null }
        ]
      }
    });

    if (mapping) return mapping.zone;

    // 2. Default zone rules based on pincode prefix
    if (!originPincode || !destPincode) return 'Zone D';

    const origPrefix = originPincode.substring(0, 2);
    const destPrefix = destPincode.substring(0, 2);

    if (originPincode === destPincode || origPrefix === destPrefix) return 'Zone A'; // Same city/cluster
    if (originPincode.substring(0, 1) === destPincode.substring(0, 1)) return 'Zone B'; // Same state/region

    // Metro pincode prefixes (Mumbai: 40, Delhi: 11, Bangalore: 56, Kolkata: 70, Chennai: 60)
    const metros = ['11', '40', '56', '70', '60'];
    if (metros.includes(origPrefix) && metros.includes(destPrefix)) return 'Zone C'; // Metro-to-Metro

    // Special / Remote areas (NE: 78, 79; J&K: 19; Andaman: 74)
    if (['78', '79', '19', '74'].includes(destPrefix)) return 'Zone E';

    return 'Zone D'; // Rest of India
  }

  /**
   * Calculates Client Selling Charge using ClientRateCard.
   */
  static async calculateClientRate(input: RateCalculationInput): Promise<ClientRateCalculationResult> {
    if (!input.clientId) throw new Error('clientId is required for client rate calculation');

    const bookingDate = input.bookingDate || new Date();
    const zone = await this.resolveZone(input.companyId, input.originPincode, input.destPincode, undefined, input.clientId);

    // 1. Find active versioned ClientRateCard
    const rateCard = await prisma.clientRateCard.findFirst({
      where: {
        company_id: input.companyId,
        client_id: input.clientId,
        active: true,
        effective_from: { lte: bookingDate },
        OR: [
          { effective_to: null },
          { effective_to: { gte: bookingDate } }
        ]
      },
      include: { rules: true },
      orderBy: { effective_from: 'desc' }
    });

    const divisor = rateCard?.volumetric_divisor || 5000;
    const weights = this.calculateWeights({
      actualKg: input.actualKg, lengthCm: input.lengthCm, widthCm: input.widthCm, heightCm: input.heightCm, volumetricDivisor: divisor
    });

    if (!rateCard || rateCard.rules.length === 0) {
      // Fallback standard rate calculation
      const baseFreight = this.round2(60 + (weights.chargeableKg > 0.5 ? Math.ceil((weights.chargeableKg - 0.5) / 0.5) * 40 : 0));
      const codCharge = input.paymentMode === 'COD' ? this.round2(Math.max(30, ((input.codAmount || 0) * 0.02))) : 0;
      const gstAmount = this.round2((baseFreight + codCharge) * 0.18);
      const totalCharge = this.round2(baseFreight + codCharge + gstAmount);

      return {
        rateCardId: 'fallback-client-card', rateCardName: 'Default Fallback Rate', version: '1.0',
        zone, chargeableKg: weights.chargeableKg, baseFreight, codCharge, fuelSurcharge: 0,
        handlingFee: 0, remoteAreaFee: 0, otherSurcharge: 0, gstAmount, totalCharge
      };
    }

    // 2. Find matching ClientRateRule
    const rule = rateCard.rules.find(r => r.zone === zone && r.service_type === (input.serviceType || 'SURFACE'))
      || rateCard.rules[0];

    const chargeableGrams = weights.chargeableKg * 1000;
    let baseFreight = Number(rule.base_rate);
    const maxWeightG = Number(rule.max_weight_g);
    const addWeightG = Number(rule.additional_weight_g) || 500;
    const addRate = Number(rule.additional_rate);

    if (chargeableGrams > maxWeightG) {
      const extraGrams = chargeableGrams - maxWeightG;
      const extraSlabs = Math.ceil(extraGrams / addWeightG);
      baseFreight += extraSlabs * addRate;
    }
    baseFreight = this.round2(baseFreight);

    const codCharge = input.paymentMode === 'COD'
      ? this.round2(Math.max(Number(rule.cod_min_fee), ((input.codAmount || 0) * Number(rule.cod_percentage)) / 100))
      : 0;

    const fuelSurcharge = this.round2((baseFreight * Number(rule.fuel_surcharge_pct)) / 100);
    const handlingFee = this.round2(Number(rule.handling_fee));
    const remoteAreaFee = zone === 'Zone E' ? this.round2(Number(rule.remote_area_fee)) : 0;
    const otherSurcharge = this.round2(Number(rule.other_surcharge));

    const subtotal = this.round2(baseFreight + codCharge + fuelSurcharge + handlingFee + remoteAreaFee + otherSurcharge);
    const gstAmount = this.round2((subtotal * Number(rule.gst_rate_pct)) / 100);
    const totalCharge = this.round2(subtotal + gstAmount);

    return {
      rateCardId: rateCard.id,
      rateCardName: rateCard.name,
      version: rateCard.version,
      zone,
      chargeableKg: weights.chargeableKg,
      baseFreight,
      codCharge,
      fuelSurcharge,
      handlingFee,
      remoteAreaFee,
      otherSurcharge,
      gstAmount,
      totalCharge
    };
  }

  /**
   * Calculates Courier Purchase Cost using CourierRateCard.
   */
  static async calculateCourierCost(input: RateCalculationInput): Promise<CourierRateCalculationResult> {
    if (!input.courierId) throw new Error('courierId is required for courier cost calculation');

    const bookingDate = input.bookingDate || new Date();
    const zone = await this.resolveZone(input.companyId, input.originPincode, input.destPincode, input.courierId);

    // 1. Find active versioned CourierRateCard
    const rateCard = await prisma.courierRateCard.findFirst({
      where: {
        company_id: input.companyId,
        courier_id: input.courierId,
        active: true,
        effective_from: { lte: bookingDate },
        OR: [
          { effective_to: null },
          { effective_to: { gte: bookingDate } }
        ]
      },
      include: { rules: true },
      orderBy: { effective_from: 'desc' }
    });

    const divisor = rateCard?.volumetric_divisor || 5000;
    const weights = this.calculateWeights({
      actualKg: input.actualKg, lengthCm: input.lengthCm, widthCm: input.widthCm, heightCm: input.heightCm, volumetricDivisor: divisor
    });

    if (!rateCard || rateCard.rules.length === 0) {
      // Fallback standard purchase cost
      const baseCost = this.round2(40 + (weights.chargeableKg > 0.5 ? Math.ceil((weights.chargeableKg - 0.5) / 0.5) * 25 : 0));
      const codCost = input.paymentMode === 'COD' ? 15 : 0;
      const gstAmount = this.round2((baseCost + codCost) * 0.18);
      const totalCost = this.round2(baseCost + codCost + gstAmount);

      return {
        rateCardId: 'fallback-courier-card', rateCardName: 'Default Courier Purchase Rate', version: '1.0',
        zone, chargeableKg: weights.chargeableKg, baseCost, codCost, fuelSurcharge: 0, rtoCharge: 0,
        ndrCharge: 0, returnShippingCharge: 0, remoteAreaCharge: 0, otherCharge: 0, gstAmount, totalCost
      };
    }

    // 2. Find matching CourierRateRule
    const rule = rateCard.rules.find(r => r.zone === zone && r.service_type === (input.serviceType || 'SURFACE'))
      || rateCard.rules[0];

    const chargeableGrams = weights.chargeableKg * 1000;
    let baseCost = Number(rule.base_cost);
    const maxWeightG = Number(rule.max_weight_g);
    const addWeightG = Number(rule.additional_weight_g) || 500;
    const addCost = Number(rule.additional_cost);

    if (chargeableGrams > maxWeightG) {
      const extraGrams = chargeableGrams - maxWeightG;
      const extraSlabs = Math.ceil(extraGrams / addWeightG);
      baseCost += extraSlabs * addCost;
    }
    baseCost = this.round2(baseCost);

    const codCost = input.paymentMode === 'COD' ? this.round2(Number(rule.cod_fee)) : 0;
    const fuelSurcharge = this.round2((baseCost * Number(rule.fuel_surcharge_pct)) / 100);
    const rtoCharge = 0; // Calculated on actual RTO event
    const ndrCharge = 0; // Calculated on actual NDR event
    const returnShippingCharge = 0;
    const remoteAreaCharge = zone === 'Zone E' ? this.round2(Number(rule.remote_area_charge)) : 0;
    const otherCharge = this.round2(Number(rule.other_charge));

    const subtotal = this.round2(baseCost + codCost + fuelSurcharge + remoteAreaCharge + otherCharge);
    const gstAmount = this.round2((subtotal * Number(rule.gst_rate_pct)) / 100);
    const totalCost = this.round2(subtotal + gstAmount);

    return {
      rateCardId: rateCard.id,
      rateCardName: rateCard.name,
      version: rateCard.version,
      zone,
      chargeableKg: weights.chargeableKg,
      baseCost,
      codCost,
      fuelSurcharge,
      rtoCharge,
      ndrCharge,
      returnShippingCharge,
      remoteAreaCharge,
      otherCharge,
      gstAmount,
      totalCost
    };
  }

  /**
   * Freezes commercial rate calculations onto Shipment and records immutable audit log.
   */
  static async freezeShipmentCommercials(companyId: string, shipmentId: string): Promise<any> {
    const shipment = await prisma.shipment.findFirst({
      where: { id: shipmentId, company_id: companyId }
    });

    if (!shipment) throw new Error(`Shipment ${shipmentId} not found`);

    const weights = this.calculateWeights({
      actualKg: shipment.actual_weight ? Number(shipment.actual_weight) : 0,
      lengthCm: shipment.length_cm || 0,
      widthCm: shipment.width_cm || 0,
      heightCm: shipment.height_cm || 0
    });

    let clientCalc: ClientRateCalculationResult | null = null;
    let courierCalc: CourierRateCalculationResult | null = null;

    if (shipment.client_id) {
      clientCalc = await this.calculateClientRate({
        companyId,
        clientId: shipment.client_id,
        originPincode: shipment.origin || '110001',
        destPincode: shipment.pincode || '400001',
        actualKg: weights.actualKg,
        lengthCm: shipment.length_cm || undefined,
        widthCm: shipment.width_cm || undefined,
        heightCm: shipment.height_cm || undefined,
        paymentMode: shipment.cod_amount && Number(shipment.cod_amount) > 0 ? 'COD' : 'PREPAID',
        codAmount: shipment.cod_amount ? Number(shipment.cod_amount) : 0,
        serviceType: (shipment.service_type as any) || 'SURFACE',
        bookingDate: shipment.booking_date || new Date()
      });
    }

    if (shipment.courier_id) {
      courierCalc = await this.calculateCourierCost({
        companyId,
        courierId: shipment.courier_id,
        originPincode: shipment.origin || '110001',
        destPincode: shipment.pincode || '400001',
        actualKg: weights.actualKg,
        lengthCm: shipment.length_cm || undefined,
        widthCm: shipment.width_cm || undefined,
        heightCm: shipment.height_cm || undefined,
        paymentMode: shipment.cod_amount && Number(shipment.cod_amount) > 0 ? 'COD' : 'PREPAID',
        codAmount: shipment.cod_amount ? Number(shipment.cod_amount) : 0,
        serviceType: (shipment.service_type as any) || 'SURFACE',
        bookingDate: shipment.booking_date || new Date()
      });
    }

    const clientTotal = clientCalc ? clientCalc.totalCharge : (shipment.client_total_charge ? Number(shipment.client_total_charge) : 0);
    const courierTotal = courierCalc ? courierCalc.totalCost : (shipment.courier_total_cost ? Number(shipment.courier_total_cost) : 0);
    const estimatedProfit = this.round2(clientTotal - courierTotal);
    const marginPct = clientTotal > 0 ? this.round2((estimatedProfit / clientTotal) * 100) : 0;

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        volumetric_weight: weights.volumetricKg,
        chargeable_weight: weights.chargeableKg,

        // Frozen Client Commercial Snapshot
        client_base_freight: clientCalc?.baseFreight || 0,
        client_docket_charge: 0,
        client_fov_charge: 0,
        client_fsc_amount: clientCalc?.fuelSurcharge || 0,
        client_idc_amount: 0,
        client_oda_amount: clientCalc?.remoteAreaFee || 0,
        client_green_tax: 0,
        client_gst_amount: clientCalc?.gstAmount || 0,
        client_total_charge: clientTotal,

        // Frozen Courier Commercial Snapshot
        courier_base_cost: courierCalc?.baseCost || 0,
        courier_docket_cost: 0,
        courier_fov_cost: 0,
        courier_fsc_cost: courierCalc?.fuelSurcharge || 0,
        courier_idc_cost: 0,
        courier_oda_cost: courierCalc?.remoteAreaCharge || 0,
        courier_green_tax: 0,
        courier_gst_amount: courierCalc?.gstAmount || 0,
        courier_total_cost: courierTotal,

        forward_courier_cost: courierTotal,
        expected_courier_cost: courierTotal,

        // Profit Snapshot
        estimated_profit: estimatedProfit,
        gross_margin: estimatedProfit,
        margin_percentage: marginPct,

        client_rate_card_id: clientCalc?.rateCardId || null,
        courier_rate_card_id: courierCalc?.rateCardId || null,
        rate_card_version: clientCalc?.version || courierCalc?.version || '1.0'
      }
    });

    // Record Commercial Audit Log
    const corrId = `COMM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await prisma.commercialAuditLog.create({
      data: {
        company_id: companyId,
        shipment_id: shipment.id,
        awb_number: shipment.awb_number,
        calculation_type: 'CLIENT_ESTIMATE',
        rate_card_id: clientCalc?.rateCardId,
        rate_card_name: clientCalc?.rateCardName,
        rate_card_version: clientCalc?.version,
        chargeable_weight: weights.chargeableKg,
        zone: clientCalc?.zone || courierCalc?.zone || 'Zone D',
        breakdown_json: JSON.stringify({ clientCalc, courierCalc }),
        correlation_id: corrId
      }
    });

    return updatedShipment;
  }

  /**
   * Imports a Courier Invoice and reconciles line items against shipments.
   */
  static async reconcileInvoiceLine(companyId: string, invoiceId: string, line: {
    awbNumber: string;
    chargedWeight: number;
    zone?: string;
    baseFreight: number;
    fuelSurcharge?: number;
    codFee?: number;
    ndrFee?: number;
    rtoFee?: number;
    returnCharge?: number;
    otherCharge?: number;
    gstAmount?: number;
    totalAmount: number;
  }): Promise<any> {
    const awbClean = line.awbNumber.trim();
    const shipment = await prisma.shipment.findFirst({
      where: { company_id: companyId, awb_number: awbClean }
    });

    const expectedCost = shipment?.expected_courier_cost ? Number(shipment.expected_courier_cost) : (shipment?.courier_total_cost ? Number(shipment.courier_total_cost) : 0);
    const actualCost = this.round2(line.totalAmount);
    const costVariance = this.round2(actualCost - expectedCost);

    let varianceReason = 'MATCHED';
    if (!shipment) {
      varianceReason = 'UNMATCHED';
    } else if (costVariance > 0.5) {
      if (line.chargedWeight > (shipment.chargeable_weight ? Number(shipment.chargeable_weight) : 0)) varianceReason = 'WEIGHT_DIFFERENCE';
      else if (line.zone && line.zone !== shipment.destination) varianceReason = 'ZONE_DIFFERENCE';
      else if ((line.codFee || 0) > 0) varianceReason = 'COD_DIFFERENCE';
      else if ((line.ndrFee || 0) > 0) varianceReason = 'NDR';
      else if ((line.rtoFee || 0) > 0) varianceReason = 'RTO';
      else varianceReason = 'OTHER';
    }

    // Upsert Invoice Line
    const invLine = await prisma.courierInvoiceLine.upsert({
      where: {
        invoice_id_awb_number: {
          invoice_id: invoiceId,
          awb_number: awbClean
        }
      },
      update: {
        charged_weight: line.chargedWeight,
        zone: line.zone,
        base_freight: line.baseFreight,
        fuel_surcharge: line.fuelSurcharge || 0,
        cod_fee: line.codFee || 0,
        ndr_fee: line.ndrFee || 0,
        rto_fee: line.rtoFee || 0,
        return_charge: line.returnCharge || 0,
        other_charge: line.otherCharge || 0,
        gst_amount: line.gstAmount || 0,
        total_amount: actualCost,
        expected_cost: expectedCost,
        cost_variance: costVariance,
        variance_reason: varianceReason,
        shipment_id: shipment?.id || null
      },
      create: {
        invoice_id: invoiceId,
        company_id: companyId,
        awb_number: awbClean,
        shipment_id: shipment?.id || null,
        charged_weight: line.chargedWeight,
        zone: line.zone,
        base_freight: line.baseFreight,
        fuel_surcharge: line.fuelSurcharge || 0,
        cod_fee: line.codFee || 0,
        ndr_fee: line.ndrFee || 0,
        rto_fee: line.rtoFee || 0,
        return_charge: line.returnCharge || 0,
        other_charge: line.otherCharge || 0,
        gst_amount: line.gstAmount || 0,
        total_amount: actualCost,
        expected_cost: expectedCost,
        cost_variance: costVariance,
        variance_reason: varianceReason
      }
    });

    // Update True Profit on Shipment without overwriting estimated costs
    if (shipment) {
      const clientRevenue = shipment.client_total_charge ? Number(shipment.client_total_charge) : 0;
      const actualProfit = this.round2(clientRevenue - actualCost);
      const marginPct = clientRevenue > 0 ? this.round2((actualProfit / clientRevenue) * 100) : 0;

      await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          actual_courier_cost: actualCost,
          cost_variance: costVariance,
          variance_reason: varianceReason,
          actual_profit: actualProfit,
          gross_margin: actualProfit,
          margin_percentage: marginPct,
          updated_at: new Date()
        }
      });
    }

    return invLine;
  }
}
