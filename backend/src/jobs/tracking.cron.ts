import { prisma } from '../prisma';
import { CourierFactory } from '../services/courier/CourierFactory';

export const syncTrackingStatuses = async () => {
  console.log(`[Tracking Cron] Starting tracking sync at ${new Date().toISOString()}`);

  try {
    // Find all shipments that are active and have a courier partner
    const activeShipments = await prisma.shipment.findMany({
      where: {
        courier_id: { not: null },
        internal_status: { in: ['BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] }
      },
      include: {
        courier: true
      }
    });

    console.log(`[Tracking Cron] Found ${activeShipments.length} active shipments to track.`);

    for (const shipment of activeShipments) {
      if (!shipment.courier) continue;

      try {
        const provider = CourierFactory.getProvider(shipment.courier.courier_name, shipment.courier.api_credentials);
        const trackingRes = await provider.trackShipment(shipment.awb_number);

        if (trackingRes.success && trackingRes.status && trackingRes.status !== shipment.internal_status) {
          console.log(`[Tracking Cron] Status update for ${shipment.awb_number}: ${shipment.internal_status} -> ${trackingRes.status}`);

          // Update shipment status
          await prisma.shipment.update({
            where: { id: shipment.id },
            data: {
              internal_status: trackingRes.status,
              courier_status: trackingRes.remarks || trackingRes.status,
              // If delivered, set the deliveredAt date
              deliveredAt: trackingRes.status === 'DELIVERED' ? (trackingRes.timestamp || new Date()) : shipment.deliveredAt,
              status_history: {
                create: {
                  status: trackingRes.status,
                  location: trackingRes.location || '',
                  raw_status: trackingRes.remarks || '',
                  timestamp: trackingRes.timestamp || new Date()
                }
              }
            }
          });
        }
      } catch (error) {
        console.error(`[Tracking Cron] Failed to track ${shipment.awb_number}:`, error);
      }
    }
  } catch (error) {
    console.error(`[Tracking Cron] Critical failure:`, error);
  }

  console.log(`[Tracking Cron] Finished tracking sync.`);
};

// We export a setup function that gets called once on server start
export const setupTrackingCron = () => {
  console.log(`[Tracking Cron] Initialized. Will run every 5 minutes.`);
  
  // Run every 5 minutes in production (300,000 ms)
  // For testing purposes, we can set this to run every 1 minute (60,000 ms)
  setInterval(syncTrackingStatuses, 60000); 
};
