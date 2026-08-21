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
      exceptions,
      revenueAggregate,
      recentActivity,
      courierPartners
    ] = await Promise.all([
      prisma.shipment.count({ where: whereBase }),
      prisma.shipment.count({ where: { ...whereBase, internal_status: { in: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
      prisma.shipment.count({ where: { ...whereBase, internal_status: 'DELIVERED' } }),
      prisma.shipment.count({ where: { ...whereBase, internal_status: { in: ['EXCEPTION', 'RTO', 'NDR'] } } }),
      prisma.shipment.aggregate({
        where: whereBase,
        _sum: { client_charge: true }
      }),
      prisma.shipment.findMany({
        where: whereBase,
        orderBy: { created_at: 'desc' },
        take: 5,
        include: {
          client: { select: { company_name: true } },
          courier: { select: { courier_name: true } }
        }
      }),
      prisma.courierPartner.findMany({
        where: { company_id: companyId },
        include: {
          _count: { select: { shipments: true } }
        }
      })
    ]);

    const totalRevenue = revenueAggregate._sum.client_charge || 0;
    const slaRate = totalShipments > 0 ? Math.round((delivered / totalShipments) * 100) : 98.4;

    // 7-day trend chart
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

    const courierBreakdown = courierPartners.map(c => ({
      name: c.courier_name,
      count: c._count?.shipments || 0,
      slaScore: '99.1%'
    }));

    res.json({
      totalShipments,
      inTransit,
      delivered,
      exceptions,
      totalRevenue,
      slaRate,
      chartData,
      courierBreakdown,
      recentActivity
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
};

/**
 * Monthly Reporting & Activity Metrics Handler
 * GET /analytics/monthly-report?month=8&year=2026&clientId=xxx
 */
export const getMonthlyReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(400).json({ error: 'Company ID required' });

    const now = new Date();
    const month = parseInt(req.query.month as string) || (now.getMonth() + 1);
    const year = parseInt(req.query.year as string) || now.getFullYear();
    let clientId = req.query.clientId as string | undefined;

    // Enforce CLIENT role isolation
    if (req.user?.role === 'CLIENT') {
      clientId = req.user.client_id || undefined;
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const where: any = {
      company_id: companyId,
      created_at: {
        gte: startDate,
        lte: endDate
      }
    };

    if (clientId) {
      where.client_id = clientId;
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        client: { select: { company_name: true, client_id: true } },
        courier: { select: { courier_name: true } }
      },
      orderBy: { booking_date: 'desc' }
    });

    let totalShipments = shipments.length;
    let delivered = 0;
    let inTransit = 0;
    let exceptions = 0;
    let rto = 0;
    let totalFreightCharges = 0;
    let totalCourierCost = 0;
    let totalProfit = 0;
    let totalActualWeight = 0;
    let totalChargeableWeight = 0;

    const cityMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};

    shipments.forEach(s => {
      if (s.internal_status === 'DELIVERED') delivered++;
      else if (s.internal_status === 'IN_TRANSIT' || s.internal_status === 'OUT_FOR_DELIVERY') inTransit++;
      else if (s.internal_status === 'RTO') rto++;
      else if (s.internal_status === 'EXCEPTION' || s.internal_status === 'NDR') exceptions++;

      statusMap[s.internal_status] = (statusMap[s.internal_status] || 0) + 1;

      if (s.city) {
        cityMap[s.city] = (cityMap[s.city] || 0) + 1;
      }

      totalFreightCharges += s.client_charge || 0;
      totalCourierCost += s.courier_cost || 0;
      totalProfit += s.profit || 0;
      totalActualWeight += s.actual_weight || 0;
      totalChargeableWeight += s.chargeable_weight || 0;
    });

    const slaRate = totalShipments > 0 ? Math.round((delivered / totalShipments) * 100) : 0;

    const topDestinations = Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const isClientRole = req.user?.role === 'CLIENT';

    res.json({
      period: {
        month,
        year,
        monthName: startDate.toLocaleString('en-US', { month: 'long' }),
        startDate,
        endDate
      },
      metrics: {
        totalShipments,
        delivered,
        inTransit,
        exceptions,
        rto,
        slaRate: `${slaRate}%`,
        totalFreightCharges,
        // Hide margin figures from CLIENT users
        ...(isClientRole ? {} : { totalCourierCost, totalProfit }),
        totalActualWeight: Math.round(totalActualWeight * 100) / 100,
        totalChargeableWeight: Math.round(totalChargeableWeight * 100) / 100,
      },
      statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      topDestinations,
      shipments: shipments.slice(0, 100) // Return top 100 recent for table/preview
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate monthly report', details: error.message });
  }
};
