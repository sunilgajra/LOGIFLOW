import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const processCourierBillReconciliation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { courier_id, bill_number, bill_date, items } = req.body;

    if (!courier_id || !bill_number || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required parameters: courier_id, bill_number, and items array' });
    }

    let totalBillAmount = 0;
    const itemsToCreate: any[] = [];
    let matchedCount = 0;
    let weightDiscrepancyCount = 0;
    let overchargedCount = 0;
    let unmatchedCount = 0;
    let totalDiscrepancyAmount = 0;

    for (const item of items) {
      const awb = String(item.awb_number || '').trim();
      const billedWeight = parseFloat(item.billed_weight) || 0;
      const billedCost = parseFloat(item.billed_cost) || 0;
      const billedZone = item.billed_zone || 'DEFAULT';

      totalBillAmount += billedCost;

      if (!awb) {
        unmatchedCount++;
        continue;
      }

      // Lookup shipment in DB
      const shipment = await prisma.shipment.findFirst({
        where: { company_id: companyId, awb_number: awb }
      });

      let recStatus = 'MATCHED';
      let expectedWeight = 0;
      let expectedCost = 0;
      let expectedZone = 'DEFAULT';

      if (!shipment) {
        recStatus = 'UNMATCHED_AWB';
        unmatchedCount++;
      } else {
        expectedWeight = shipment.chargeable_weight ? Number(shipment.chargeable_weight) : (shipment.actual_weight ? Number(shipment.actual_weight) : 0);
        expectedCost = shipment.courier_total_cost ? Number(shipment.courier_total_cost) : (shipment.courier_cost ? Number(shipment.courier_cost) : 0);
        expectedZone = shipment.state || 'DEFAULT';

        const weightDiff = billedWeight - expectedWeight;
        const costDiff = billedCost - expectedCost;

        if (costDiff > 5) {
          recStatus = 'OVERCHARGED';
          overchargedCount++;
          totalDiscrepancyAmount += costDiff;
        } else if (Math.abs(weightDiff) > 0.1) {
          recStatus = 'WEIGHT_DISCREPANCY';
          weightDiscrepancyCount++;
          totalDiscrepancyAmount += Math.abs(costDiff);
        } else {
          matchedCount++;
        }
      }

      itemsToCreate.push({
        awb_number: awb,
        expected_weight: expectedWeight,
        billed_weight: billedWeight,
        weight_discrepancy: billedWeight - expectedWeight,
        expected_zone: expectedZone,
        billed_zone: billedZone,
        expected_cost: expectedCost,
        billed_cost: billedCost,
        cost_variance: billedCost - expectedCost,
        reconciliation_status: recStatus,
      });
    }

    // Save Courier Bill and items to DB
    const courierBill = await prisma.courierBill.create({
      data: {
        company_id: companyId,
        courier_id,
        bill_number,
        bill_date: bill_date ? new Date(bill_date) : new Date(),
        total_amount: totalBillAmount,
        status: overchargedCount > 0 || weightDiscrepancyCount > 0 ? 'DISPUTED' : 'RECONCILED',
        items: {
          create: itemsToCreate
        }
      },
      include: {
        items: true,
        courier: true
      }
    });

    res.status(201).json({
      message: 'Courier bill reconciliation processed successfully',
      summary: {
        totalItems: items.length,
        matchedCount,
        weightDiscrepancyCount,
        overchargedCount,
        unmatchedCount,
        totalDiscrepancyAmount: Math.round(totalDiscrepancyAmount * 100) / 100,
        totalBillAmount: Math.round(totalBillAmount * 100) / 100,
        billStatus: courierBill.status
      },
      bill: courierBill
    });

  } catch (error: any) {
    console.error('Reconciliation error:', error);
    res.status(500).json({ error: 'Failed to process courier bill reconciliation', details: error.message });
  }
};

export const getCourierBills = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const bills = await prisma.courierBill.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
      include: {
        courier: true,
        items: true
      }
    });

    res.json(bills);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch courier bills', details: error.message });
  }
};
