import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma';
import { ApiLogService } from '../logger/ApiLogService';

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

export interface CalculateWeightsInput {
  actualKg: number | string | Decimal;
  lengthCm?: number | string | Decimal;
  widthCm?: number | string | Decimal;
  heightCm?: number | string | Decimal;
  volumetricDivisor?: number | string | Decimal;
}

export interface WeightCalculationResult {
  actualKg: number;
  volumetricKg: number;
  chargeableKg: number;
  actualKgDec: Decimal;
  volumetricKgDec: Decimal;
  chargeableKgDec: Decimal;
}

export interface RateCalculationInput {
  companyId: string;
  clientId?: string;
  courierId?: string;
  courierAccountId?: string;
  originPincode: string;
  destPincode: string;
  actualKg: number | string | Decimal;
  lengthCm?: number | string | Decimal;
  widthCm?: number | string | Decimal;
  heightCm?: number | string | Decimal;
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number | string | Decimal;
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
  // Pure Decimal representations
  chargeableKgDec: Decimal;
  baseFreightDec: Decimal;
  codChargeDec: Decimal;
  fuelSurchargeDec: Decimal;
  handlingFeeDec: Decimal;
  remoteAreaFeeDec: Decimal;
  otherSurchargeDec: Decimal;
  gstAmountDec: Decimal;
  totalChargeDec: Decimal;
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
  // Pure Decimal representations
  chargeableKgDec: Decimal;
  baseCostDec: Decimal;
  codCostDec: Decimal;
  fuelSurchargeDec: Decimal;
  rtoChargeDec: Decimal;
  ndrChargeDec: Decimal;
  returnShippingChargeDec: Decimal;
  remoteAreaChargeDec: Decimal;
  otherChargeDec: Decimal;
  gstAmountDec: Decimal;
  totalCostDec: Decimal;
}

export class CommercialEngineService {
  /**
   * Legacy helper to round financial numbers to 2 decimal places.
   */
  static round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  /**
   * Helper to safely convert any value to a Prisma Decimal instance.
   */
  static toDec(val: any): Decimal {
    if (val === null || val === undefined) return new Decimal(0);
    if (val instanceof Decimal) return val;
    return new Decimal(val);
  }

  /**
   * Helper to round a Decimal to 2 decimal places using HALF_UP rounding.
   */
  static round2Dec(val: Decimal): Decimal {
    return val.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  /**
   * Helper to round a Decimal to 4 decimal places for weight calculations.
   */
  static round4Dec(val: Decimal): Decimal {
    return val.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  }

  /**
   * Calculates volumetric weight and chargeable weight using pure Decimal arithmetic:
   * MAX(actual_weight, volumetric_weight).
   */
  static calculateWeights(input: CalculateWeightsInput): WeightCalculationResult {
    const divisor = input.volumetricDivisor && this.toDec(input.volumetricDivisor).gt(0) 
      ? this.toDec(input.volumetricDivisor) 
      : new Decimal(5000);

    let volKg = new Decimal(0);
    const length = this.toDec(input.lengthCm || 0);
    const width = this.toDec(input.widthCm || 0);
    const height = this.toDec(input.heightCm || 0);

    if (length.gt(0) && width.gt(0) && height.gt(0)) {
      volKg = this.round4Dec(length.mul(width).mul(height).div(divisor));
    }

    const actualKg = this.round4Dec(this.toDec(input.actualKg || 0));
    const chargeableKg = actualKg.gte(volKg) ? actualKg : volKg;

    return {
      actualKg: actualKg.toNumber(),
      volumetricKg: volKg.toNumber(),
      chargeableKg: chargeableKg.toNumber(),
      actualKgDec: actualKg,
      volumetricKgDec: volKg,
      chargeableKgDec: chargeableKg
    };
  }

  /**
   * Resolves shipping zone for pincode mapping.
   */
  static async resolveZone(companyId: string, originPincode: string, destPincode: string, courierId?: string, clientId?: string): Promise<string> {
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

    if (!originPincode || !destPincode) return 'Zone D';

    const origPrefix = originPincode.substring(0, 2);
    const destPrefix = destPincode.substring(0, 2);

    if (originPincode === destPincode || origPrefix === destPrefix) return 'Zone A';
    if (originPincode.substring(0, 1) === destPincode.substring(0, 1)) return 'Zone B';

    const metros = ['11', '40', '56', '70', '60'];
    if (metros.includes(origPrefix) && metros.includes(destPrefix)) return 'Zone C';

    if (['78', '79', '19', '74'].includes(destPrefix)) return 'Zone E';

    return 'Zone D';
  }

  /**
   * Calculates Client Selling Charge using ClientRateCard with pure Decimal arithmetic.
   */
  static async calculateClientRate(input: RateCalculationInput): Promise<ClientRateCalculationResult> {
    if (!input.clientId) throw new Error('clientId is required for client rate calculation');

    const bookingDate = input.bookingDate || new Date();
    const zone = await this.resolveZone(input.companyId, input.originPincode, input.destPincode, undefined, input.clientId);

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
      // Fallback standard rate calculation using Decimal arithmetic
      let baseFreight = new Decimal(60);
      if (weights.chargeableKgDec.gt(0.5)) {
        const extraGrams = weights.chargeableKgDec.sub(0.5).mul(1000);
        const extraSlabs = new Decimal(Math.ceil(extraGrams.div(500).toNumber()));
        baseFreight = baseFreight.add(extraSlabs.mul(40));
      }
      baseFreight = this.round2Dec(baseFreight);

      const codAmountDec = this.toDec(input.codAmount || 0);
      const codCharge = input.paymentMode === 'COD' 
        ? this.round2Dec(Decimal.max(new Decimal(30), codAmountDec.mul(new Decimal('0.02')))) 
        : new Decimal(0);
      const gstAmount = this.round2Dec(baseFreight.add(codCharge).mul(new Decimal('0.18')));
      const totalCharge = this.round2Dec(baseFreight.add(codCharge).add(gstAmount));

      return {
        rateCardId: 'fallback-client-card', rateCardName: 'Default Fallback Rate', version: '1.0',
        zone, 
        chargeableKg: weights.chargeableKg, 
        baseFreight: baseFreight.toNumber(), 
        codCharge: codCharge.toNumber(), 
        fuelSurcharge: 0,
        handlingFee: 0, 
        remoteAreaFee: 0, 
        otherSurcharge: 0, 
        gstAmount: gstAmount.toNumber(), 
        totalCharge: totalCharge.toNumber(),
        chargeableKgDec: weights.chargeableKgDec,
        baseFreightDec: baseFreight,
        codChargeDec: codCharge,
        fuelSurchargeDec: new Decimal(0),
        handlingFeeDec: new Decimal(0),
        remoteAreaFeeDec: new Decimal(0),
        otherSurchargeDec: new Decimal(0),
        gstAmountDec: gstAmount,
        totalChargeDec: totalCharge
      };
    }

    const rule = rateCard.rules.find(r => r.zone === zone && r.service_type === (input.serviceType || 'SURFACE'))
      || rateCard.rules[0];

    const chargeableGrams = weights.chargeableKgDec.mul(1000);
    let baseFreight = this.toDec(rule.base_rate);
    const maxWeightG = this.toDec(rule.max_weight_g);
    const addWeightG = this.toDec(rule.additional_weight_g || 500);
    const addRate = this.toDec(rule.additional_rate);

    if (chargeableGrams.gt(maxWeightG)) {
      const extraGrams = chargeableGrams.sub(maxWeightG);
      const extraSlabs = new Decimal(Math.ceil(extraGrams.div(addWeightG).toNumber()));
      baseFreight = baseFreight.add(extraSlabs.mul(addRate));
    }
    baseFreight = this.round2Dec(baseFreight);

    const codAmountDec = this.toDec(input.codAmount || 0);
    const codMinFee = this.toDec(rule.cod_min_fee);
    const codPct = this.toDec(rule.cod_percentage);

    const codCharge = input.paymentMode === 'COD'
      ? this.round2Dec(Decimal.max(codMinFee, codAmountDec.mul(codPct).div(100)))
      : new Decimal(0);

    const fuelSurcharge = this.round2Dec(baseFreight.mul(this.toDec(rule.fuel_surcharge_pct)).div(100));
    const handlingFee = this.round2Dec(this.toDec(rule.handling_fee));
    const remoteAreaFee = zone === 'Zone E' ? this.round2Dec(this.toDec(rule.remote_area_fee)) : new Decimal(0);
    const otherSurcharge = this.round2Dec(this.toDec(rule.other_surcharge));

    const subtotal = this.round2Dec(baseFreight.add(codCharge).add(fuelSurcharge).add(handlingFee).add(remoteAreaFee).add(otherSurcharge));
    const gstAmount = this.round2Dec(subtotal.mul(this.toDec(rule.gst_rate_pct)).div(100));
    const totalCharge = this.round2Dec(subtotal.add(gstAmount));

    return {
      rateCardId: rateCard.id,
      rateCardName: rateCard.name,
      version: rateCard.version,
      zone,
      chargeableKg: weights.chargeableKg,
      baseFreight: baseFreight.toNumber(),
      codCharge: codCharge.toNumber(),
      fuelSurcharge: fuelSurcharge.toNumber(),
      handlingFee: handlingFee.toNumber(),
      remoteAreaFee: remoteAreaFee.toNumber(),
      otherSurcharge: otherSurcharge.toNumber(),
      gstAmount: gstAmount.toNumber(),
      totalCharge: totalCharge.toNumber(),
      chargeableKgDec: weights.chargeableKgDec,
      baseFreightDec: baseFreight,
      codChargeDec: codCharge,
      fuelSurchargeDec: fuelSurcharge,
      handlingFeeDec: handlingFee,
      remoteAreaFeeDec: remoteAreaFee,
      otherSurchargeDec: otherSurcharge,
      gstAmountDec: gstAmount,
      totalChargeDec: totalCharge
    };
  }

  /**
   * Calculates Courier Purchase Cost using CourierRateCard with pure Decimal arithmetic.
   */
  static async calculateCourierCost(input: RateCalculationInput): Promise<CourierRateCalculationResult> {
    if (!input.courierId) throw new Error('courierId is required for courier cost calculation');

    const bookingDate = input.bookingDate || new Date();
    const zone = await this.resolveZone(input.companyId, input.originPincode, input.destPincode, input.courierId);

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
      let baseCost = new Decimal(40);
      if (weights.chargeableKgDec.gt(0.5)) {
        const extraGrams = weights.chargeableKgDec.sub(0.5).mul(1000);
        const extraSlabs = new Decimal(Math.ceil(extraGrams.div(500).toNumber()));
        baseCost = baseCost.add(extraSlabs.mul(25));
      }
      baseCost = this.round2Dec(baseCost);

      const codCost = input.paymentMode === 'COD' ? new Decimal(15) : new Decimal(0);
      const gstAmount = this.round2Dec(baseCost.add(codCost).mul(new Decimal('0.18')));
      const totalCost = this.round2Dec(baseCost.add(codCost).add(gstAmount));

      return {
        rateCardId: 'fallback-courier-card', rateCardName: 'Default Courier Purchase Rate', version: '1.0',
        zone, 
        chargeableKg: weights.chargeableKg, 
        baseCost: baseCost.toNumber(), 
        codCost: codCost.toNumber(), 
        fuelSurcharge: 0, rtoCharge: 0, ndrCharge: 0, returnShippingCharge: 0, remoteAreaCharge: 0, otherCharge: 0, 
        gstAmount: gstAmount.toNumber(), 
        totalCost: totalCost.toNumber(),
        chargeableKgDec: weights.chargeableKgDec,
        baseCostDec: baseCost,
        codCostDec: codCost,
        fuelSurchargeDec: new Decimal(0),
        rtoChargeDec: new Decimal(0),
        ndrChargeDec: new Decimal(0),
        returnShippingChargeDec: new Decimal(0),
        remoteAreaChargeDec: new Decimal(0),
        otherChargeDec: new Decimal(0),
        gstAmountDec: gstAmount,
        totalCostDec: totalCost
      };
    }

    const rule = rateCard.rules.find(r => r.zone === zone && r.service_type === (input.serviceType || 'SURFACE'))
      || rateCard.rules[0];

    const chargeableGrams = weights.chargeableKgDec.mul(1000);
    let baseCost = this.toDec(rule.base_cost);
    const maxWeightG = this.toDec(rule.max_weight_g);
    const addWeightG = this.toDec(rule.additional_weight_g || 500);
    const addCost = this.toDec(rule.additional_cost);

    if (chargeableGrams.gt(maxWeightG)) {
      const extraGrams = chargeableGrams.sub(maxWeightG);
      const extraSlabs = new Decimal(Math.ceil(extraGrams.div(addWeightG).toNumber()));
      baseCost = baseCost.add(extraSlabs.mul(addCost));
    }
    baseCost = this.round2Dec(baseCost);

    const codCost = input.paymentMode === 'COD' ? this.round2Dec(this.toDec(rule.cod_fee)) : new Decimal(0);
    const fuelSurcharge = this.round2Dec(baseCost.mul(this.toDec(rule.fuel_surcharge_pct)).div(100));
    const rtoCharge = new Decimal(0);
    const ndrCharge = new Decimal(0);
    const returnShippingCharge = new Decimal(0);
    const remoteAreaCharge = zone === 'Zone E' ? this.round2Dec(this.toDec(rule.remote_area_charge)) : new Decimal(0);
    const otherCharge = this.round2Dec(this.toDec(rule.other_charge));

    const subtotal = this.round2Dec(baseCost.add(codCost).add(fuelSurcharge).add(remoteAreaCharge).add(otherCharge));
    const gstAmount = this.round2Dec(subtotal.mul(this.toDec(rule.gst_rate_pct)).div(100));
    const totalCost = this.round2Dec(subtotal.add(gstAmount));

    return {
      rateCardId: rateCard.id,
      rateCardName: rateCard.name,
      version: rateCard.version,
      zone,
      chargeableKg: weights.chargeableKg,
      baseCost: baseCost.toNumber(),
      codCost: codCost.toNumber(),
      fuelSurcharge: fuelSurcharge.toNumber(),
      rtoCharge: rtoCharge.toNumber(),
      ndrCharge: ndrCharge.toNumber(),
      returnShippingCharge: returnShippingCharge.toNumber(),
      remoteAreaCharge: remoteAreaCharge.toNumber(),
      otherCharge: otherCharge.toNumber(),
      gstAmount: gstAmount.toNumber(),
      totalCost: totalCost.toNumber(),
      chargeableKgDec: weights.chargeableKgDec,
      baseCostDec: baseCost,
      codCostDec: codCost,
      fuelSurchargeDec: fuelSurcharge,
      rtoChargeDec: rtoCharge,
      ndrChargeDec: ndrCharge,
      returnShippingChargeDec: returnShippingCharge,
      remoteAreaChargeDec: remoteAreaCharge,
      otherChargeDec: otherCharge,
      gstAmountDec: gstAmount,
      totalCostDec: totalCost
    };
  }

  /**
   * Freezes commercial rate calculations onto Shipment and records immutable audit log using Decimal values.
   */
  static async freezeShipmentCommercials(companyId: string, shipmentId: string): Promise<any> {
    const shipment = await prisma.shipment.findFirst({
      where: { id: shipmentId, company_id: companyId }
    });

    if (!shipment) throw new Error(`Shipment ${shipmentId} not found`);

    const weights = this.calculateWeights({
      actualKg: shipment.actual_weight ? this.toDec(shipment.actual_weight) : 0,
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
        actualKg: weights.actualKgDec,
        lengthCm: shipment.length_cm || undefined,
        widthCm: shipment.width_cm || undefined,
        heightCm: shipment.height_cm || undefined,
        paymentMode: shipment.cod_amount && this.toDec(shipment.cod_amount).gt(0) ? 'COD' : 'PREPAID',
        codAmount: shipment.cod_amount ? this.toDec(shipment.cod_amount) : 0,
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
        actualKg: weights.actualKgDec,
        lengthCm: shipment.length_cm || undefined,
        widthCm: shipment.width_cm || undefined,
        heightCm: shipment.height_cm || undefined,
        paymentMode: shipment.cod_amount && this.toDec(shipment.cod_amount).gt(0) ? 'COD' : 'PREPAID',
        codAmount: shipment.cod_amount ? this.toDec(shipment.cod_amount) : 0,
        serviceType: (shipment.service_type as any) || 'SURFACE',
        bookingDate: shipment.booking_date || new Date()
      });
    }

    const clientTotal = clientCalc ? clientCalc.totalChargeDec : this.toDec(shipment.client_total_charge);
    const courierTotal = courierCalc ? courierCalc.totalCostDec : this.toDec(shipment.courier_total_cost);
    const estimatedProfit = this.round2Dec(clientTotal.sub(courierTotal));
    const marginPct = clientTotal.gt(0) 
      ? this.round2Dec(estimatedProfit.div(clientTotal).mul(100)) 
      : new Decimal(0);

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        volumetric_weight: weights.volumetricKgDec,
        chargeable_weight: weights.chargeableKgDec,

        // Frozen Client Commercial Snapshot
        client_base_freight: clientCalc?.baseFreightDec || new Decimal(0),
        client_docket_charge: new Decimal(0),
        client_fov_charge: new Decimal(0),
        client_fsc_amount: clientCalc?.fuelSurchargeDec || new Decimal(0),
        client_idc_amount: new Decimal(0),
        client_oda_amount: clientCalc?.remoteAreaFeeDec || new Decimal(0),
        client_green_tax: new Decimal(0),
        client_gst_amount: clientCalc?.gstAmountDec || new Decimal(0),
        client_total_charge: clientTotal,

        // Frozen Courier Commercial Snapshot
        courier_base_cost: courierCalc?.baseCostDec || new Decimal(0),
        courier_docket_cost: new Decimal(0),
        courier_fov_cost: new Decimal(0),
        courier_fsc_cost: courierCalc?.fuelSurchargeDec || new Decimal(0),
        courier_idc_cost: new Decimal(0),
        courier_oda_cost: courierCalc?.remoteAreaChargeDec || new Decimal(0),
        courier_green_tax: new Decimal(0),
        courier_gst_amount: courierCalc?.gstAmountDec || new Decimal(0),
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
        chargeable_weight: weights.chargeableKgDec,
        zone: clientCalc?.zone || courierCalc?.zone || 'Zone D',
        breakdown_json: JSON.stringify({ clientCalc, courierCalc }),
        correlation_id: corrId
      }
    });

    return updatedShipment;
  }

  /**
   * Imports a Courier Invoice and reconciles line items against shipments using pure Decimal arithmetic.
   */
  static async reconcileInvoiceLine(companyId: string, invoiceId: string, line: {
    awbNumber: string;
    chargedWeight: number | string | Decimal;
    zone?: string;
    baseFreight: number | string | Decimal;
    fuelSurcharge?: number | string | Decimal;
    codFee?: number | string | Decimal;
    ndrFee?: number | string | Decimal;
    rtoFee?: number | string | Decimal;
    returnCharge?: number | string | Decimal;
    otherCharge?: number | string | Decimal;
    gstAmount?: number | string | Decimal;
    totalAmount: number | string | Decimal;
  }): Promise<any> {
    const awbClean = line.awbNumber.trim();
    const shipment = await prisma.shipment.findFirst({
      where: { company_id: companyId, awb_number: awbClean }
    });

    const expectedCost = shipment?.expected_courier_cost 
      ? this.toDec(shipment.expected_courier_cost) 
      : (shipment?.courier_total_cost ? this.toDec(shipment.courier_total_cost) : new Decimal(0));

    const actualCost = this.round2Dec(this.toDec(line.totalAmount));
    const costVariance = this.round2Dec(actualCost.sub(expectedCost));

    let varianceReason = 'MATCHED';
    if (!shipment) {
      varianceReason = 'UNMATCHED';
    } else if (costVariance.gt(new Decimal('0.5'))) {
      if (this.toDec(line.chargedWeight).gt(this.toDec(shipment.chargeable_weight))) varianceReason = 'WEIGHT_DIFFERENCE';
      else if (line.zone && line.zone !== shipment.destination) varianceReason = 'ZONE_DIFFERENCE';
      else if (this.toDec(line.codFee).gt(0)) varianceReason = 'COD_DIFFERENCE';
      else if (this.toDec(line.ndrFee).gt(0)) varianceReason = 'NDR';
      else if (this.toDec(line.rtoFee).gt(0)) varianceReason = 'RTO';
      else varianceReason = 'OTHER';
    }

    const invLine = await prisma.courierInvoiceLine.upsert({
      where: {
        invoice_id_awb_number: {
          invoice_id: invoiceId,
          awb_number: awbClean
        }
      },
      update: {
        charged_weight: this.toDec(line.chargedWeight),
        zone: line.zone,
        base_freight: this.toDec(line.baseFreight),
        fuel_surcharge: this.toDec(line.fuelSurcharge),
        cod_fee: this.toDec(line.codFee),
        ndr_fee: this.toDec(line.ndrFee),
        rto_fee: this.toDec(line.rtoFee),
        return_charge: this.toDec(line.returnCharge),
        other_charge: this.toDec(line.otherCharge),
        gst_amount: this.toDec(line.gstAmount),
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
        charged_weight: this.toDec(line.chargedWeight),
        zone: line.zone,
        base_freight: this.toDec(line.baseFreight),
        fuel_surcharge: this.toDec(line.fuelSurcharge),
        cod_fee: this.toDec(line.codFee),
        ndr_fee: this.toDec(line.ndrFee),
        rto_fee: this.toDec(line.rtoFee),
        return_charge: this.toDec(line.returnCharge),
        other_charge: this.toDec(line.otherCharge),
        gst_amount: this.toDec(line.gstAmount),
        total_amount: actualCost,
        expected_cost: expectedCost,
        cost_variance: costVariance,
        variance_reason: varianceReason
      }
    });

    if (shipment) {
      const clientRevenue = this.toDec(shipment.client_total_charge);
      const actualProfit = this.round2Dec(clientRevenue.sub(actualCost));
      const marginPct = clientRevenue.gt(0) 
        ? this.round2Dec(actualProfit.div(clientRevenue).mul(100)) 
        : new Decimal(0);

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
