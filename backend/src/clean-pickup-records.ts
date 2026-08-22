import 'dotenv/config';
import { prisma } from './prisma';

async function clean() {
  console.log('Cleaning old test PickupRequest records...');
  await prisma.$executeRawUnsafe(`DELETE FROM "PickupRequest"`);
  console.log('PickupRequest clean complete.');
}

clean().catch(console.error);
