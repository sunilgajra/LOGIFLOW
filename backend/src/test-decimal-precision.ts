import 'dotenv/config';
import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

async function runDecimalPrecisionTest() {
  console.log('================================================================');
  console.log('   POSTGRESQL MONETARY & WEIGHT DECIMAL PRECISION AUDIT TEST    ');
  console.log('================================================================\n');

  const compId = `dec-test-comp-${Date.now()}`;
  const shipId = `dec-test-ship-${Date.now()}`;

  // 1. Create company
  await prisma.company.create({
    data: { id: compId, name: 'Decimal Precision Test Company' }
  });

  // 2. Test 0.10 + 0.20 financial arithmetic persistence
  // Note: Standard JS Float: 0.1 + 0.2 = 0.30000000000000004
  // PostgreSQL DECIMAL(12,2): Stores 0.30 exactly
  const val1 = new Prisma.Decimal('0.10');
  const val2 = new Prisma.Decimal('0.20');
  const sumVal = val1.add(val2); // 0.30 exactly

  // Test large monetary values: 999999.99
  const largeMonetary = new Prisma.Decimal('999999.99');
  
  // Test precise 4-decimal weight: 1.2345 kg
  const preciseWeight = new Prisma.Decimal('1.2345');

  const createdShipment = await prisma.shipment.create({
    data: {
      id: shipId,
      company_id: compId,
      awb_number: `DEC-AWB-${Date.now()}`,
      client_total_charge: sumVal, // 0.30
      courier_total_cost: largeMonetary, // 999999.99
      actual_weight: preciseWeight, // 1.2345
      cod_amount: new Prisma.Decimal('1234.56')
    }
  });

  console.log('--- 1. PERSISTENCE VERIFICATION ---');
  console.log(`Saved client_total_charge: ${createdShipment.client_total_charge?.toString()}`);
  console.log(`Saved courier_total_cost: ${createdShipment.courier_total_cost?.toString()}`);
  console.log(`Saved actual_weight: ${createdShipment.actual_weight?.toString()}`);

  // 3. Retrieve from PostgreSQL database
  const fetchedShipment = await prisma.shipment.findUnique({
    where: { id: shipId }
  });

  if (!fetchedShipment) throw new Error('Failed to retrieve test shipment');

  let passed = true;

  console.log('\n--- 2. RETRIEVAL & ZERO FLOAT DRIFT AUDIT ---');
  
  // Test 1: 0.10 + 0.20 = 0.30 (Not 0.30000000000000004)
  const retrievedSumStr = fetchedShipment.client_total_charge?.toString();
  if (retrievedSumStr === '0.3') {
    console.log('✅ TEST 1 PASSED: 0.10 + 0.20 persisted in PostgreSQL NUMERIC and retrieved as exact 0.30 (Zero Float Drift).');
  } else {
    console.error(`❌ TEST 1 FAILED: Expected '0.3', got '${retrievedSumStr}'`);
    passed = false;
  }

  // Test 2: Large monetary precision 999999.99
  const retrievedLargeStr = fetchedShipment.courier_total_cost?.toString();
  if (retrievedLargeStr === '999999.99') {
    console.log('✅ TEST 2 PASSED: 999999.99 monetary field stored and retrieved with exact 2-decimal precision.');
  } else {
    console.error(`❌ TEST 2 FAILED: Expected '999999.99', got '${retrievedLargeStr}'`);
    passed = false;
  }

  // Test 3: Weight precision 1.2345 (4 decimal places)
  const retrievedWeightStr = fetchedShipment.actual_weight?.toString();
  if (retrievedWeightStr === '1.2345') {
    console.log('✅ TEST 3 PASSED: 1.2345 kg weight field stored and retrieved with exact 4-decimal precision.');
  } else {
    console.error(`❌ TEST 3 FAILED: Expected '1.2345', got '${retrievedWeightStr}'`);
    passed = false;
  }

  // Cleanup
  await prisma.shipment.delete({ where: { id: shipId } });
  await prisma.company.delete({ where: { id: compId } });

  console.log('\n================================================================');
  if (passed) {
    console.log('   ALL POSTGRESQL MONETARY DECIMAL PRECISION TESTS PASSED!   ');
  } else {
    console.log('   POSTGRESQL MONETARY DECIMAL PRECISION TESTS FAILED!   ');
  }
  console.log('================================================================');
}

runDecimalPrecisionTest().catch(console.error);
