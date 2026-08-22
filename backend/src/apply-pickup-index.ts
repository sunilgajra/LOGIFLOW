import 'dotenv/config';
import { prisma } from './prisma';

async function applyIndex() {
  console.log('Adding composite unique index to PickupRequest table...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickup_request_id" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "PickupRequest_company_facility_date_key" 
    ON "PickupRequest" ("company_id", "facility_name", "pickup_date");
  `);
  console.log('Index applied successfully.');
}

applyIndex().catch(console.error);
