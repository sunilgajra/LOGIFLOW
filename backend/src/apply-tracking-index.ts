import 'dotenv/config';
import { prisma } from './prisma';

async function applyTrackingSchema() {
  console.log('Adding TrackingEvent table and unique index...');

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "last_status_event_time" TIMESTAMP(3);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TrackingEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "shipment_id" TEXT NOT NULL,
      "company_id" TEXT NOT NULL,
      "courier_account_id" TEXT,
      "awb" TEXT NOT NULL,
      "courier_status" TEXT NOT NULL,
      "internal_status" TEXT NOT NULL,
      "event_time" TIMESTAMP(3) NOT NULL,
      "location" TEXT,
      "description" TEXT,
      "raw_status" TEXT,
      "correlation_id" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "TrackingEvent_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "TrackingEvent_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "TrackingEvent_shipment_awb_status_time_loc_key" 
    ON "TrackingEvent" ("shipment_id", "awb", "courier_status", "event_time", "location");
  `);

  console.log('TrackingEvent table and unique index applied successfully.');
}

applyTrackingSchema().catch(console.error);
