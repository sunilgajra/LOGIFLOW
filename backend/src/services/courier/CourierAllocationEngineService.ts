import { Prisma } from '@prisma/client';
import { prisma } from '../../prisma';
import { CommercialEngineService } from '../commercial/CommercialEngineService';

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

export type AllocationStrategy = 'LOWEST_COST' | 'HIGHEST_MARGIN' | 'FASTEST_DELIVERY' | 'BALANCED' | 'CLIENT_PREFERRED';

export interface EvaluateAllocationInput {
  companyId: string;
  shipmentId?: string;
  clientId?: string;
  originPincode: string;
  destPincode: string;
  actualKg: number | string | Decimal;
  lengthCm?: number | string | Decimal;
  widthCm?: number | string | Decimal;
  heightCm?: number | string | Decimal;
  paymentMode: 'PREPAID' | 'COD';
  codAmount?: number | string | Decimal;
  serviceType?: 'SURFACE' | 'EXPRESS';
  strategyOverride?: AllocationStrategy;
  bookingDate?: Date;
}

export interface CourierCandidateEvaluation {
  courierId: string;
  courierName: string;
  accountId?: string;
  eligible: boolean;
  ineligibleReason?: string;
  serviceable: boolean;
  slaDays: number;
  clientZone: string;
  courierZone: string;
  chargeableKgDec: Decimal;
  clientChargeDec: Decimal;
  courierCostDec: Decimal;
  grossProfitDec: Decimal;
  marginPctDec: Decimal;
  rateCardId: string;
  rateCardVersion: string;
  isPreferred: boolean;
  scoreDec: Decimal;
}

export interface AllocationEngineResult {
  success: boolean;
  selectedCandidate?: CourierCandidateEvaluation;
  allCandidates: CourierCandidateEvaluation[];
  strategyUsed: AllocationStrategy;
  clientRateCardId: string;
  clientRateCardVersion: string;
  clientChargeDec: Decimal;
  error?: string;
}

export class CourierAllocationEngineService {
  private static toDec(val: any): Decimal {
    if (val === null || val === undefined) return new Decimal(0);
    if (val instanceof Decimal) return val;
    return new Decimal(val);
  }

  private static round2Dec(val: Decimal): Decimal {
    return val.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  }

  private static round4Dec(val: Decimal): Decimal {
    return val.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  }

  /**
   * Evaluates all active courier partners for a company and selects the optimal courier based on configured allocation rules.
   */
  static async allocateCourier(input: EvaluateAllocationInput): Promise<AllocationEngineResult> {
    const { companyId, clientId, strategyOverride } = input;
    const bookingDate = input.bookingDate || new Date();

    // 1. Fetch Company/Client Allocation Rule Configuration
    const ruleConfig = await prisma.courierAllocationRule.findFirst({
      where: {
        company_id: companyId,
        OR: [
          { client_id: clientId || null },
          { client_id: null }
        ]
      },
      orderBy: { client_id: 'desc' } // Client-specific rule takes precedence over company default
    });

    const strategy: AllocationStrategy = strategyOverride || (ruleConfig?.default_strategy as AllocationStrategy) || 'BALANCED';
    const minMarginThreshold = ruleConfig?.min_margin_percentage ? this.toDec(ruleConfig.min_margin_percentage) : new Decimal(10);
    const costWeight = ruleConfig?.cost_weight ? this.toDec(ruleConfig.cost_weight) : new Decimal('0.4');
    const slaWeight = ruleConfig?.sla_weight ? this.toDec(ruleConfig.sla_weight) : new Decimal('0.4');
    const prefWeight = ruleConfig?.preference_weight ? this.toDec(ruleConfig.preference_weight) : new Decimal('0.2');

    // 2. Calculate FIXED Client Selling Rate (Client revenue MUST remain independent from courier selection)
    let clientCalc;
    if (clientId) {
      clientCalc = await CommercialEngineService.calculateClientRate({
        companyId,
        clientId,
        originPincode: input.originPincode,
        destPincode: input.destPincode,
        actualKg: input.actualKg,
        lengthCm: input.lengthCm,
        widthCm: input.widthCm,
        heightCm: input.heightCm,
        paymentMode: input.paymentMode,
        codAmount: input.codAmount,
        serviceType: input.serviceType,
        bookingDate
      });
    } else {
      // Default fallback client rate
      const weights = CommercialEngineService.calculateWeights({
        actualKg: input.actualKg, lengthCm: input.lengthCm, widthCm: input.widthCm, heightCm: input.heightCm
      });
      clientCalc = {
        rateCardId: 'default-client-card',
        rateCardName: 'Standard Default Client Rate',
        version: '1.0',
        zone: 'Zone D',
        chargeableKg: weights.chargeableKg,
        baseFreight: 100, codCharge: 0, fuelSurcharge: 0, handlingFee: 0, remoteAreaFee: 0, otherSurcharge: 0, gstAmount: 18, totalCharge: 118,
        chargeableKgDec: weights.chargeableKgDec,
        baseFreightDec: new Decimal(100), codChargeDec: new Decimal(0), fuelSurchargeDec: new Decimal(0),
        handlingFeeDec: new Decimal(0), remoteAreaFeeDec: new Decimal(0), otherSurchargeDec: new Decimal(0),
        gstAmountDec: new Decimal(18), totalChargeDec: new Decimal(118)
      };
    }

    const fixedClientChargeDec = clientCalc.totalChargeDec;

    // 3. Query all ACTIVE Courier Partners for THIS company ONLY (Multi-tenant isolation)
    const couriers = await prisma.courierPartner.findMany({
      where: {
        company_id: companyId,
        active: true,
        status: 'ACTIVE'
      },
      include: {
        accounts: { where: { status: 'ACTIVE' } }
      }
    });

    if (couriers.length === 0) {
      return {
        success: false,
        allCandidates: [],
        strategyUsed: strategy,
        clientRateCardId: clientCalc.rateCardId,
        clientRateCardVersion: clientCalc.version,
        clientChargeDec: fixedClientChargeDec,
        error: 'No active courier partners configured for company'
      };
    }

    // 4. Evaluate each candidate courier independently
    const candidates: CourierCandidateEvaluation[] = [];

    for (const courier of couriers) {
      let eligible = true;
      let ineligibleReason = '';
      let serviceable = true;

      // Check Courier Weight Limit
      if (courier.max_weight_kg && this.toDec(courier.max_weight_kg).gt(0)) {
        if (clientCalc.chargeableKgDec.gt(this.toDec(courier.max_weight_kg))) {
          eligible = false;
          ineligibleReason = `Chargeable weight ${clientCalc.chargeableKgDec.toString()} kg exceeds courier limit ${courier.max_weight_kg.toString()} kg`;
        }
      }

      // Check COD Support & Max COD Limit
      if (input.paymentMode === 'COD') {
        if (!courier.cod_supported) {
          eligible = false;
          ineligibleReason = 'COD payment mode not supported by courier partner';
        } else if (courier.max_cod_amount && this.toDec(courier.max_cod_amount).gt(0)) {
          if (this.toDec(input.codAmount || 0).gt(this.toDec(courier.max_cod_amount))) {
            eligible = false;
            ineligibleReason = `COD amount ₹${input.codAmount} exceeds courier limit ₹${courier.max_cod_amount.toString()}`;
          }
        }
      }

      // Calculate Courier Purchase Cost from CourierRateCard
      let courierCalc;
      try {
        courierCalc = await CommercialEngineService.calculateCourierCost({
          companyId,
          courierId: courier.id,
          originPincode: input.originPincode,
          destPincode: input.destPincode,
          actualKg: input.actualKg,
          lengthCm: input.lengthCm,
          widthCm: input.widthCm,
          heightCm: input.heightCm,
          paymentMode: input.paymentMode,
          codAmount: input.codAmount,
          serviceType: input.serviceType,
          bookingDate
        });
      } catch (err: any) {
        eligible = false;
        ineligibleReason = `Failed to calculate courier cost: ${err.message}`;
      }

      const courierCostDec = courierCalc ? courierCalc.totalCostDec : new Decimal(999999);
      const grossProfitDec = this.round2Dec(fixedClientChargeDec.sub(courierCostDec));
      const marginPctDec = fixedClientChargeDec.gt(0) 
        ? this.round2Dec(grossProfitDec.div(fixedClientChargeDec).mul(100))
        : new Decimal(0);

      // Check Minimum Margin Rule
      if (eligible && marginPctDec.lt(minMarginThreshold)) {
        eligible = false;
        ineligibleReason = `Margin ${marginPctDec.toString()}% is below minimum required threshold ${minMarginThreshold.toString()}%`;
      }

      const isPreferred = ruleConfig?.preferred_courier_id === courier.id || ruleConfig?.preferred_courier_id === courier.courier_id;

      candidates.push({
        courierId: courier.id,
        courierName: courier.courier_name,
        accountId: courier.accounts.length > 0 ? courier.accounts[0].id : undefined,
        eligible,
        ineligibleReason: eligible ? undefined : ineligibleReason,
        serviceable,
        slaDays: courier.sla_days || 3,
        clientZone: clientCalc.zone,
        courierZone: courierCalc?.zone || 'Zone D',
        chargeableKgDec: clientCalc.chargeableKgDec,
        clientChargeDec: fixedClientChargeDec,
        courierCostDec,
        grossProfitDec,
        marginPctDec,
        rateCardId: courierCalc?.rateCardId || 'default-courier-card',
        rateCardVersion: courierCalc?.version || '1.0',
        isPreferred,
        scoreDec: new Decimal(0)
      });
    }

    // Filter Eligible Candidates
    const eligibleCandidates = candidates.filter(c => c.eligible);

    if (eligibleCandidates.length === 0) {
      return {
        success: false,
        allCandidates: candidates,
        strategyUsed: strategy,
        clientRateCardId: clientCalc.rateCardId,
        clientRateCardVersion: clientCalc.version,
        clientChargeDec: fixedClientChargeDec,
        error: 'No serviceable courier partner satisfies all operational & minimum margin rules'
      };
    }

    // 5. Apply Strategy Decision Engine
    let selectedCandidate: CourierCandidateEvaluation;

    if (strategy === 'LOWEST_COST') {
      eligibleCandidates.sort((a, b) => a.courierCostDec.sub(b.courierCostDec).toNumber());
      selectedCandidate = eligibleCandidates[0];
      selectedCandidate.scoreDec = new Decimal(100);
    } else if (strategy === 'HIGHEST_MARGIN') {
      eligibleCandidates.sort((a, b) => b.grossProfitDec.sub(a.grossProfitDec).toNumber());
      selectedCandidate = eligibleCandidates[0];
      selectedCandidate.scoreDec = new Decimal(100);
    } else if (strategy === 'FASTEST_DELIVERY') {
      eligibleCandidates.sort((a, b) => {
        if (a.slaDays !== b.slaDays) return a.slaDays - b.slaDays;
        return b.grossProfitDec.sub(a.grossProfitDec).toNumber();
      });
      selectedCandidate = eligibleCandidates[0];
      selectedCandidate.scoreDec = new Decimal(100);
    } else if (strategy === 'CLIENT_PREFERRED') {
      const preferred = eligibleCandidates.find(c => c.isPreferred);
      if (preferred) {
        selectedCandidate = preferred;
        selectedCandidate.scoreDec = new Decimal(100);
      } else {
        // Fallback to HIGHEST_MARGIN
        eligibleCandidates.sort((a, b) => b.grossProfitDec.sub(a.grossProfitDec).toNumber());
        selectedCandidate = eligibleCandidates[0];
        selectedCandidate.scoreDec = new Decimal(90);
      }
    } else {
      // BALANCED Multi-Attribute Scoring Engine
      // Compute max & min bounds for normalization
      const minCost = Decimal.min(...eligibleCandidates.map(c => c.courierCostDec));
      const maxCost = Decimal.max(...eligibleCandidates.map(c => c.courierCostDec));
      const costRange = maxCost.sub(minCost).add(new Decimal('0.001'));

      const minSla = Math.min(...eligibleCandidates.map(c => c.slaDays));
      const maxSla = Math.max(...eligibleCandidates.map(c => c.slaDays));
      const slaRange = new Decimal(maxSla - minSla + 0.001);

      eligibleCandidates.forEach(c => {
        const normCostScore = maxCost.sub(c.courierCostDec).div(costRange).mul(100);
        const normSlaScore = new Decimal(maxSla - c.slaDays).div(slaRange).mul(100);
        const prefScore = c.isPreferred ? new Decimal(100) : new Decimal(0);

        const totalScore = normCostScore.mul(costWeight)
          .add(normSlaScore.mul(slaWeight))
          .add(prefScore.mul(prefWeight));

        c.scoreDec = this.round2Dec(totalScore);
      });

      eligibleCandidates.sort((a, b) => b.scoreDec.sub(a.scoreDec).toNumber());
      selectedCandidate = eligibleCandidates[0];
    }

    // 6. If shipmentId provided, persist allocation decision immutably on Shipment
    if (input.shipmentId) {
      await prisma.shipment.update({
        where: { id: input.shipmentId },
        data: {
          selected_courier_id: selectedCandidate.courierId,
          selected_courier_account_id: selectedCandidate.accountId || null,
          courier_id: selectedCandidate.courierId,
          allocation_strategy: strategy,
          allocation_score: selectedCandidate.scoreDec,
          allocation_reason: `Allocated via ${strategy} strategy (Score: ${selectedCandidate.scoreDec.toString()})`,
          client_rate_card_id: clientCalc.rateCardId,
          client_rate_card_version: clientCalc.version,
          courier_rate_card_id: selectedCandidate.rateCardId,
          courier_rate_card_version: selectedCandidate.rateCardVersion,
          client_total_charge: fixedClientChargeDec,
          expected_client_charge: fixedClientChargeDec,
          courier_total_cost: selectedCandidate.courierCostDec,
          expected_courier_cost: selectedCandidate.courierCostDec,
          forward_courier_cost: selectedCandidate.courierCostDec,
          estimated_profit: selectedCandidate.grossProfitDec,
          expected_gross_profit: selectedCandidate.grossProfitDec,
          gross_margin: selectedCandidate.grossProfitDec,
          margin_percentage: selectedCandidate.marginPctDec,
          expected_margin_percentage: selectedCandidate.marginPctDec,
          chargeable_weight: clientCalc.chargeableKgDec,
          client_zone: clientCalc.zone,
          courier_zone: selectedCandidate.courierZone,
          allocated_at: new Date()
        }
      });
    }

    return {
      success: true,
      selectedCandidate,
      allCandidates: candidates,
      strategyUsed: strategy,
      clientRateCardId: clientCalc.rateCardId,
      clientRateCardVersion: clientCalc.version,
      clientChargeDec: fixedClientChargeDec
    };
  }
}
