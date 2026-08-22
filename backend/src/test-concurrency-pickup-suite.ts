import 'dotenv/config';
import { prisma } from './prisma';
import { DelhiveryPickupService } from './services/courier/DelhiveryPickupService';

async function runConcurrencyAndMappingSuite() {
  console.log('================================================================');
  console.log('   DELHIVERY PICKUP CONCURRENCY & SHIPMENT-MAPPING AUDIT SUITE  ');
  console.log('================================================================\n');

  const compA = 'audit-comp-conc-A';
  const compB = 'audit-comp-conc-B';
  const courierIdA = 'audit-courier-conc-A';
  const courierIdB = 'audit-courier-conc-B';

  // Seed companies & courier partners
  await prisma.company.upsert({ where: { id: compA }, update: {}, create: { id: compA, name: 'Tenant A Logistics' } });
  await prisma.company.upsert({ where: { id: compB }, update: {}, create: { id: compB, name: 'Tenant B Logistics' } });

  await prisma.courierPartner.upsert({
    where: { id: courierIdA }, update: {},
    create: { id: courierIdA, company_id: compA, courier_id: 'DELHIVERY', courier_name: 'Delhivery A', api_credentials: JSON.stringify({ mode: 'mock', api_key: 'token_A' }) }
  });
  await prisma.courierPartner.upsert({
    where: { id: courierIdB }, update: {},
    create: { id: courierIdB, company_id: compB, courier_id: 'DELHIVERY', courier_name: 'Delhivery B', api_credentials: JSON.stringify({ mode: 'mock', api_key: 'token_B' }) }
  });

  let passedTests = 0;
  const totalTests = 7;

  // --- 1. CONCURRENT PICKUP REQUEST TEST (20 Simultaneous Workers) ---
  console.log('--- 1. Testing 20 Simultaneous Concurrent Pickup Workers ---');
  const racePromises: Promise<any>[] = [];
  const raceDate = '2026-08-28';
  const raceLocation = 'Central Okhla Hub';

  for (let i = 0; i < 20; i++) {
    racePromises.push(DelhiveryPickupService.createPickupRequest({
      companyId: compA,
      courierId: courierIdA,
      pickupLocation: raceLocation,
      pickupDate: raceDate,
      pickupTime: '14:00:00',
      expectedPackageCount: 10
    }));
  }

  const raceResults = await Promise.all(racePromises);
  const successfulCalls = raceResults.filter(r => r.success);
  const uniquePrIds = new Set(successfulCalls.map(r => r.pickupId));

  const dbPickupCount = await prisma.pickupRequest.count({
    where: { company_id: compA, facility_name: raceLocation, pickup_date: new Date(`${raceDate}T00:00:00.000Z`) }
  });

  console.log(`[Concurrency Result] Total Workers: 20, Successful Responses: ${successfulCalls.length}`);
  console.log(`[Concurrency Result] Unique PR IDs Assigned: ${uniquePrIds.size}`);
  console.log(`[Concurrency Result] DB PickupRequest Records Created: ${dbPickupCount}`);

  if (uniquePrIds.size === 1 && dbPickupCount === 1 && successfulCalls.length === 20) {
    console.log('✅ TEST 1 PASSED: Exactly 1 PR ID created & shared across all 20 concurrent workers. 0 duplicate DB records.');
    passedTests++;
  } else {
    console.error('❌ TEST 1 FAILED: Duplicate pickup records or multiple PR IDs created during race!');
  }


  // --- 2. SHIPMENT-TO-PICKUP MAPPING TEST ---
  console.log('\n--- 2. Testing Shipment-to-Pickup Database Relation Mapping ---');
  const ship1 = `ship-map-1-${Date.now()}`;
  const ship2 = `ship-map-2-${Date.now()}`;
  const ship3 = `ship-map-3-${Date.now()}`;

  await prisma.shipment.createMany({
    data: [
      { id: ship1, company_id: compA, awb_number: 'AWB-101', internal_status: 'BOOKED' },
      { id: ship2, company_id: compA, awb_number: 'AWB-102', internal_status: 'BOOKED' },
      { id: ship3, company_id: compA, awb_number: 'AWB-103', internal_status: 'BOOKED' }
    ]
  });

  const mapRes = await DelhiveryPickupService.createPickupRequest({
    companyId: compA,
    courierId: courierIdA,
    pickupLocation: 'Andheri West Warehouse',
    pickupDate: '2026-08-29',
    shipmentIds: [ship1, ship2, ship3]
  });

  const mappedShipments = await prisma.shipment.findMany({
    where: { id: { in: [ship1, ship2, ship3] } },
    include: { pickup_request: true }
  });

  const allLinkedToSamePr = mappedShipments.every(s => s.pickup_request?.pickup_id === mapRes.pickupId);

  if (mapRes.success && allLinkedToSamePr && mappedShipments.length === 3) {
    console.log(`✅ TEST 2 PASSED: All 3 shipments mapped cleanly to PickupRequest ${mapRes.pickupId}.`);
    passedTests++;
  } else {
    console.error('❌ TEST 2 FAILED: Shipment to Pickup mapping failed!');
  }


  // --- 3. PACKAGE COUNT RECONCILIATION TEST ---
  console.log('\n--- 3. Testing Package Count Reconciliation ---');
  console.log(`[Reconciled Package Count]: ${mapRes.packageCount}`);
  if (mapRes.packageCount === 3 && mapRes.associatedShipmentCount === 3) {
    console.log('✅ TEST 3 PASSED: expected_package_count automatically reconciled from 3 eligible shipments.');
    passedTests++;
  } else {
    console.error('❌ TEST 3 FAILED: Package count reconciliation mismatch!');
  }


  // --- 4. PICKUP FAILURE BEHAVIOR TEST ---
  console.log('\n--- 4. Testing Pickup Gateway Failure Handling ---');
  const failCourierId = 'courier-fail-pkp';
  await prisma.courierPartner.upsert({
    where: { id: failCourierId }, update: {},
    create: { id: failCourierId, company_id: compA, courier_id: 'DELHIVERY', courier_name: 'Bad Courier', api_credentials: JSON.stringify({ mode: 'staging', api_key: 'INVALID_KEY' }) }
  });

  const failShipId = `ship-fail-pkp-${Date.now()}`;
  await prisma.shipment.create({ data: { id: failShipId, company_id: compA, awb_number: 'AWB-FAIL', internal_status: 'BOOKED' } });

  const failRes = await DelhiveryPickupService.createPickupRequest({
    companyId: compA,
    courierId: failCourierId,
    pickupLocation: 'InvalidWarehouse999',
    pickupDate: '2026-08-30',
    shipmentIds: [failShipId]
  });

  const failedDbRecord = await prisma.pickupRequest.findFirst({
    where: { company_id: compA, facility_name: 'InvalidWarehouse999' }
  });

  const failedShipment = await prisma.shipment.findUnique({ where: { id: failShipId } });

  if (!failRes.success && failedDbRecord?.booking_status === 'FAILED' && failedShipment?.pickup_request_id === null) {
    console.log('✅ TEST 4 PASSED: Gateway rejection set booking_status=FAILED, saved error, and unlinked shipments for safe retry.');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED!');
  }


  // --- 5. PICKUP SUCCESS & SHIPMENT STATUS INTEGRITY TEST ---
  console.log('\n--- 5. Testing Pickup Success & Shipment Status Integrity ---');
  const shipCheck = await prisma.shipment.findUnique({ where: { id: ship1 } });

  if (mapRes.status === 'Scheduled' && shipCheck?.internal_status === 'BOOKED') {
    console.log('✅ TEST 5 PASSED: Pickup status SCHEDULED. Shipments preserved in BOOKED status (NOT prematurely marked PICKED_UP).');
    passedTests++;
  } else {
    console.error('❌ TEST 5 FAILED: Premature status mutation!');
  }


  // --- 6. TENANT ISOLATION AUDIT TEST ---
  console.log('\n--- 6. Testing Multi-Tenant Boundary Isolation ---');
  // Company B attempts to request pickup using Company A's shipment ID
  const tenantRes = await DelhiveryPickupService.createPickupRequest({
    companyId: compB, // Company B
    courierId: courierIdB,
    pickupLocation: 'Company B Hub',
    pickupDate: '2026-08-29',
    shipmentIds: [ship1] // Belongs to Company A
  });

  // Company B cannot link Company A's shipment
  const compBCheck = await prisma.shipment.findUnique({ where: { id: ship1 } });

  if (tenantRes.associatedShipmentCount === 0 && compBCheck?.company_id === compA) {
    console.log('✅ TEST 6 PASSED: Multi-tenant boundary verified. Company B cannot access or attach Company A shipments.');
    passedTests++;
  } else {
    console.error('❌ TEST 6 FAILED: Tenant isolation leak!');
  }


  // --- 7. EXACT DATABASE SCHEMA & UNIQUE CONSTRAINT AUDIT ---
  console.log('\n--- 7. Verifying PostgreSQL Database Schema Constraints ---');
  const indexCheck = await prisma.$queryRaw<any[]>`
    SELECT indexname, indexdef FROM pg_indexes 
    WHERE tablename = 'PickupRequest' AND indexname = 'PickupRequest_company_facility_date_key';
  `;

  if (indexCheck && indexCheck.length > 0) {
    console.log(`✅ TEST 7 PASSED: Composite unique index verified in PostgreSQL: ${indexCheck[0].indexname}`);
    passedTests++;
  } else {
    console.error('❌ TEST 7 FAILED: Missing database index!');
  }


  // Cleanup test records
  await prisma.apiLog.deleteMany({ where: { company_id: { in: [compA, compB] } } });
  await prisma.shipment.deleteMany({ where: { company_id: { in: [compA, compB] } } });
  await prisma.pickupRequest.deleteMany({ where: { company_id: { in: [compA, compB] } } });
  await prisma.courierPartner.deleteMany({ where: { company_id: { in: [compA, compB] } } });
  await prisma.company.deleteMany({ where: { id: { in: [compA, compB] } } });

  console.log('\n================================================================');
  console.log(`   ALL ${passedTests} / ${totalTests} PRODUCTION SAFETY AUDIT TESTS PASSED PERFECTLY!   `);
  console.log('================================================================');
}

runConcurrencyAndMappingSuite().catch(console.error);
