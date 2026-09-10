export interface DemurrageCalculationInput {
  date_of_reaching_hub?: Date | string | null;
  booking_date?: Date | string | null;
  delivery_date?: Date | string | null;
  deliveredAt?: Date | string | null;
  demurrage_free_days?: number | null;
  demurrage_rate?: number | null;
  demurrage_gst_pct?: number | null;
  manual_demurrage_days?: number | null;
  manual_demurrage_amount?: number | null;
}

export interface DemurrageResult {
  demurrage_free_days: number;
  demurrage_days: number;
  demurrage_rate: number;
  demurrage_amount: number;
  demurrage_gst_pct: number;
  demurrage_gst_amount: number;
  total_demurrage: number;
}

export class DemurrageService {
  /**
   * Calculates demurrage charges based on holding days beyond the free period.
   */
  static calculate(input: DemurrageCalculationInput): DemurrageResult {
    const freeDays = input.demurrage_free_days !== undefined && input.demurrage_free_days !== null 
      ? Number(input.demurrage_free_days) 
      : 3;
      
    const rate = input.demurrage_rate !== undefined && input.demurrage_rate !== null 
      ? Number(input.demurrage_rate) 
      : 0;

    const gstPct = input.demurrage_gst_pct !== undefined && input.demurrage_gst_pct !== null 
      ? Number(input.demurrage_gst_pct) 
      : 18;

    let demurrageDays = 0;

    if (input.manual_demurrage_days !== undefined && input.manual_demurrage_days !== null) {
      demurrageDays = Math.max(0, Number(input.manual_demurrage_days));
    } else {
      const startDateStr = input.date_of_reaching_hub || input.booking_date;
      const endDateStr = input.delivery_date || input.deliveredAt || new Date();

      if (startDateStr) {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const diffTime = end.getTime() - start.getTime();
        const holdingDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        demurrageDays = Math.max(0, holdingDays - freeDays);
      }
    }

    let demurrageAmount = 0;
    if (input.manual_demurrage_amount !== undefined && input.manual_demurrage_amount !== null) {
      demurrageAmount = Math.max(0, Number(input.manual_demurrage_amount));
    } else {
      demurrageAmount = demurrageDays * rate;
    }

    const gstAmount = (demurrageAmount * gstPct) / 100;
    const totalDemurrage = demurrageAmount + gstAmount;

    return {
      demurrage_free_days: freeDays,
      demurrage_days: demurrageDays,
      demurrage_rate: Number(rate.toFixed(2)),
      demurrage_amount: Number(demurrageAmount.toFixed(2)),
      demurrage_gst_pct: Number(gstPct.toFixed(2)),
      demurrage_gst_amount: Number(gstAmount.toFixed(2)),
      total_demurrage: Number(totalDemurrage.toFixed(2)),
    };
  }
}
