import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../auth.middleware';

export const getAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    const whereBase: any = { company_id: companyId };
    if (req.user?.role === 'CLIENT' && req.user?.client_id) {
      whereBase.client_id = req.user.client_id;
    }

    const [
      totalShipments,
      inTransit,
      delivered,
      exceptions
    ] = await Promise.all([
      prisma.shipment.count({ where: whereBase }),
      prisma.shipment.count({ where: { ...whereBase, internal_status: 'IN_TRANSIT' } }),
      prisma.shipment.count({ where: { ...whereBase, internal_status: 'DELIVERED' } }),
      prisma.shipment.count({ where: { ...whereBase, internal_status: { in: ['EXCEPTION', 'RTO'] } } })
    ]);

    // For the chart, let's get shipments created in the last 7 days grouped by date
    // Simple approach: get all shipments in last 7 days, then group in JS
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentShipments = await prisma.shipment.findMany({
      where: {
        ...whereBase,
        booking_date: { gte: sevenDaysAgo }
      },
      select: { booking_date: true }
    });

    const chartDataMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      chartDataMap[dateStr] = 0;
    }

    recentShipments.forEach(s => {
      if (s.booking_date) {
        const dateStr = s.booking_date.toISOString().split('T')[0];
        if (chartDataMap[dateStr] !== undefined) {
          chartDataMap[dateStr]++;
        }
      }
    });

    const chartData = Object.keys(chartDataMap).map(date => ({
      name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      shipments: chartDataMap[date]
    }));

    res.json({
      totalShipments,
      inTransit,
      delivered,
      exceptions,
      chartData
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
};
