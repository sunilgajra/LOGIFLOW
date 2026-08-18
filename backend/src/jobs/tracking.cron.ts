import { prisma } from '../prisma';
import { CourierFactory } from '../services/courier/CourierFactory';

export const syncTrackingStatuses = async () => {
  console.log(`[Tracking Cron] Starting tracking sync at ${new Date().toISOString()}`);

  try {
    // Find all shipments that are active and assigned to a courier partner
    const activeShipments = await prisma.shipment.findMany({
      where: {
        courier_id: { not: null },
        internal_status: { in: ['BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'NDR'] }
      },
      include: {
        courier: true
      }
    });

    console.log(`[Tracking Cron] Found ${activeShipments.length} active shipments to track.`);

    if (activeShipments.length === 0) {
      console.log(`[Tracking Cron] No active shipments require tracking updates.`);
      return { total: 0, updated: 0 };
    }

    let updatedCount = 0;

    // Process tracking calls in parallel batches of 5 to avoid API rate limits
    const batchSize = 5;
    for (let i = 0; i < activeShipments.length; i += batchSize) {
      const batch = activeShipments.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (shipment) => {
          if (!shipment.courier) return;

          try {
            const provider = CourierFactory.getProvider(shipment.courier.courier_name, shipment.courier.api_credentials);
            const trackingRes = await provider.trackShipment(shipment.awb_number);

            if (trackingRes.success && trackingRes.status && trackingRes.status !== shipment.internal_status) {
              console.log(`[Tracking Cron] Status update for ${shipment.awb_number}: ${shipment.internal_status} -> ${trackingRes.status}`);

              const updateData: any = {
                internal_status: trackingRes.status,
                courier_status: trackingRes.remarks || trackingRes.rawStatus || trackingRes.status,
                updated_at: new Date(),
              };

              if (trackingRes.status === 'DELIVERED') {
                updateData.deliveredAt = trackingRes.timestamp || new Date();
              } else if (trackingRes.status === 'NDR') {
                updateData.delivery_attempt = (shipment.delivery_attempt || 0) + 1;
                updateData.exception_reason = trackingRes.remarks || 'Delivery exception flagged by courier';
              }

              // Update shipment status
              await prisma.shipment.update({
                where: { id: shipment.id },
                data: {
                  ...updateData,
                  status_history: {
                    create: {
                      status: trackingRes.status,
                      location: trackingRes.location || 'Transit Hub',
                      raw_status: trackingRes.remarks || trackingRes.rawStatus || '',
                      timestamp: trackingRes.timestamp || new Date()
                    }
                  }
                }
              });

              updatedCount++;
            }
          } catch (error) {
            console.error(`[Tracking Cron] Failed to track AWB ${shipment.awb_number}:`, error);
          }
        })
      );
    }

    console.log(`[Tracking Cron] Finished tracking sync. Processed: ${activeShipments.length}, Updated: ${updatedCount}`);
    return { total: activeShipments.length, updated: updatedCount };

  } catch (error) {
    console.error(`[Tracking Cron] Critical failure during tracking sync:`, error);
    return { total: 0, updated: 0, error: String(error) };
  }
};

/**
 * Triggers on-demand manual tracking sync for a specific shipment by AWB number
 */
export const syncSingleShipment = async (awbNumber: string) => {
  const shipment = await prisma.shipment.findFirst({
    where: { awb_number: awbNumber },
    include: { courier: true }
  });

  if (!shipment) {
    throw new Error(`Shipment with AWB '${awbNumber}' not found`);
  }

  if (!shipment.courier) {
    throw new Error(`Shipment with AWB '${awbNumber}' has no assigned courier partner`);
  }

  const provider = CourierFactory.getProvider(shipment.courier.courier_name, shipment.courier.api_credentials);
  const trackingRes = await provider.trackShipment(shipment.awb_number);

  if (trackingRes.success && trackingRes.status) {
    const updateData: any = {
      internal_status: trackingRes.status,
      courier_status: trackingRes.remarks || trackingRes.rawStatus || trackingRes.status,
      updated_at: new Date(),
    };

    if (trackingRes.status === 'DELIVERED') {
      updateData.deliveredAt = trackingRes.timestamp || new Date();
    } else if (trackingRes.status === 'NDR') {
      updateData.delivery_attempt = (shipment.delivery_attempt || 0) + 1;
      updateData.exception_reason = trackingRes.remarks || 'Delivery exception flagged by courier';
    }

    const updated = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        ...updateData,
        status_history: {
          create: {
            status: trackingRes.status,
            location: trackingRes.location || 'Transit Hub',
            raw_status: trackingRes.remarks || trackingRes.rawStatus || '',
            timestamp: trackingRes.timestamp || new Date()
          }
        }
      },
      include: {
        courier: true,
        client: true,
        status_history: { orderBy: { timestamp: 'desc' } }
      }
    });

    return {
      success: true,
      shipment: updated,
      tracking: trackingRes
    };
  }

  return {
    success: false,
    shipment,
    tracking: trackingRes,
    error: trackingRes.error || 'Failed to fetch status from courier API'
  };
};

// We export a setup function that gets called once on server start
export const setupTrackingCron = () => {
  console.log(`[Tracking Cron] Initialized. Background status sync active.`);
  
  // Run every 5 minutes in production (300,000 ms)
  setInterval(syncTrackingStatuses, 300000); 
};
