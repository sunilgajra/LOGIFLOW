import { prisma } from '../../prisma';
import { CourierFactory } from './CourierFactory';
import { calculateShipmentCost, calculateCourierCost } from '../../controllers/rate.controller';

export interface AllocationInput {
  companyId: string;
  clientId?: string;
  preferredCourierId?: string;
  originPincode?: string;
  destinationPincode: string;
  originState?: string;
  destinationState?: string;
  actualWeight: number;
  length?: number;
  width?: number;
  height?: number;
  volumetricWeight?: number;
  isCod?: boolean;
  codAmount?: number;
  declaredValue?: number;
  minMarginPct?: number; // default e.g. 15%
}

export interface CourierCandidate {
  courierId: string;
  courierName: string;
  serviceable: boolean;
  courierCost: number;
  clientCharge: number;
  grossMargin: number;
  marginPct: number;
  isPreferred: boolean;
}

export interface AllocationResult {
  selectedCourier: any | null;
  courierCost: number;
  clientCharge: number;
  grossMargin: number;
  marginPct: number;
  isLowMargin: boolean;
  warning?: string;
  allCandidates: CourierCandidate[];
}

export class CourierAllocationEngine {
  static async selectOptimalCourier(input: AllocationInput): Promise<AllocationResult> {
    const minMarginPct = input.minMarginPct !== undefined ? input.minMarginPct : 15;

    // 1. Fetch Client Selling Rate Snapshot
    const calcPayload = {
      client_id: input.clientId,
      actual_weight: input.actualWeight,
      volumetric_weight: input.volumetricWeight || 0,
      length: input.length || 0,
      width: input.width || 0,
      height: input.height || 0,
      state: input.destinationState,
      origin: input.originState,
      declared_value: input.declaredValue || 0,
      is_oda: false,
    };

    const clientCostData = input.clientId 
      ? await calculateShipmentCost(calcPayload, input.companyId)
      : null;

    const clientCharge = clientCostData?.client_total_charge || 100; // default benchmark if no client card

    // 2. Fetch Active Courier Partners for Company
    const couriers = await prisma.courierPartner.findMany({
      where: { company_id: input.companyId, status: 'ACTIVE' }
    });

    if (couriers.length === 0) {
      return {
        selectedCourier: null,
        courierCost: 0,
        clientCharge,
        grossMargin: 0,
        marginPct: 0,
        isLowMargin: false,
        warning: 'No active courier partners configured for company.',
        allCandidates: []
      };
    }

    const candidates: CourierCandidate[] = [];

    for (const courier of couriers) {
      const provider = CourierFactory.getProvider(courier.courier_name, courier.api_credentials);

      // Check serviceability
      const serviceres = await provider.checkServiceability(
        input.originPincode || '400001',
        input.destinationPincode,
        input.actualWeight,
        input.isCod
      );

      // Calculate courier purchase cost
      const courierCostData = await calculateCourierCost({
        ...calcPayload,
        courier_id: courier.id
      }, input.companyId);

      const courierCost = courierCostData?.courier_total_cost || 70; // fallback purchase cost benchmark
      const grossMargin = clientCharge - courierCost;
      const marginPct = clientCharge > 0 ? (grossMargin / clientCharge) * 100 : 0;
      const isPreferred = input.preferredCourierId ? String(courier.id) === String(input.preferredCourierId) : false;

      if (serviceres.serviceable) {
        candidates.push({
          courierId: courier.id,
          courierName: courier.courier_name,
          serviceable: true,
          courierCost: Math.round(courierCost * 100) / 100,
          clientCharge: Math.round(clientCharge * 100) / 100,
          grossMargin: Math.round(grossMargin * 100) / 100,
          marginPct: Math.round(marginPct * 10) / 10,
          isPreferred
        });
      }
    }

    if (candidates.length === 0) {
      // Fallback to first configured courier
      const defaultCourier = couriers[0];
      return {
        selectedCourier: defaultCourier,
        courierCost: 70,
        clientCharge,
        grossMargin: clientCharge - 70,
        marginPct: ((clientCharge - 70) / clientCharge) * 100,
        isLowMargin: false,
        warning: 'Destination pincode not natively serviceable; assigned primary courier as fallback.',
        allCandidates: []
      };
    }

    // 3. Selection Strategy:
    // If preferred courier is specified and serviceable, check its margin
    let chosenCandidate = candidates.find(c => c.isPreferred);

    if (!chosenCandidate) {
      // Pick candidate with highest gross margin
      candidates.sort((a, b) => b.grossMargin - a.grossMargin);
      chosenCandidate = candidates[0];
    }

    const selectedCourierObj = couriers.find(c => c.id === chosenCandidate!.courierId) || couriers[0];
    const isLowMargin = chosenCandidate.marginPct < minMarginPct;
    let warningMsg: string | undefined = undefined;

    if (isLowMargin) {
      warningMsg = `LOW_MARGIN: Selected courier ${chosenCandidate.courierName} gross margin is ${chosenCandidate.marginPct}%, which is below the minimum required ${minMarginPct}% threshold.`;
    }

    return {
      selectedCourier: selectedCourierObj,
      courierCost: chosenCandidate.courierCost,
      clientCharge: chosenCandidate.clientCharge,
      grossMargin: chosenCandidate.grossMargin,
      marginPct: chosenCandidate.marginPct,
      isLowMargin,
      warning: warningMsg,
      allCandidates: candidates
    };
  }
}
