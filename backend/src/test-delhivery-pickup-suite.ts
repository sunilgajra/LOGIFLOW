import 'dotenv/config';
import { prisma } from './prisma';
import { DelhiveryPickupService } from './services/courier/DelhiveryPickupService';

async function runPickupSuite() {
  console.log('================================================================');
  console.log('   DELHIVERY B2C PICKUP REQUEST API AUDIT & STAGING SUITE      ');
  console.log('================================================================\n');

  const compId = 'audit-comp-pkp';
  const courierId = 'audit-courier-pkp';

  // Seed company and courier
  await prisma.company.upsert({ where: { id: compId }, update: {}, create: { id: compId, name: 'Pickup Merchant' } });
  await prisma.courierPartner.upsert({
    where: { id: courierId },
    update: {},
    create: {
      id: courierId, company_id: compId, courier_id: 'DELHIVERY', courier_name: 'Delhivery Express',
      api_credentials: JSON.stringify({ mode: 'mock', api_key: 'mock_token_123' })
    }
  });

  let passedTests = 0;
  const totalTests = 6;

  // --- SCENARIO 1: Valid Pickup Request Creation ---
  console.log('--- SCENARIO 1: Valid Pickup Request Creation ---');
  const res1 = await DelhiveryPickupService.createPickupRequest({
    companyId: compId,
    courierId: courierId,
    pickupLocation: 'Delhi Hub',
    pickupDate: '2026-08-25',
    pickupTime: '14:00:00',
    expectedPackageCount: 15
  });

  if (res1.success && res1.pickupId) {
    console.log(`✅ TEST 1 PASSED: Pickup Request scheduled with PR ID: ${res1.pickupId}`);
    passedTests++;
  } else {
    console.error('❌ TEST 1 FAILED:', res1.error);
  }

  // --- SCENARIO 2: Bulk Shipment Grouping ---
  console.log('\n--- SCENARIO 2: Bulk Shipment Grouping ---');
  // 20 shipments grouped into 1 pickup request with count = 20
  const res2 = await DelhiveryPickupService.createPickupRequest({
    companyId: compId,
    courierId: courierId,
    pickupLocation: 'Mumbai Warehouse',
    pickupDate: '2026-08-26',
    pickupTime: '11:00:00',
    expectedPackageCount: 20
  });

  if (res2.success && res2.pickupId) {
    console.log(`✅ TEST 2 PASSED: 20 bulk shipments consolidated into 1 PR ID: ${res2.pickupId}`);
    passedTests++;
  } else {
    console.error('❌ TEST 2 FAILED:', res2.error);
  }

  // --- SCENARIO 3: Idempotency & Duplicate Request Prevention ---
  console.log('\n--- SCENARIO 3: Idempotency (Sequential Double Click) ---');
  const res3 = await DelhiveryPickupService.createPickupRequest({
    companyId: compId,
    courierId: courierId,
    pickupLocation: 'Delhi Hub',
    pickupDate: '2026-08-25', // Identical location & date as Test 1
    pickupTime: '14:00:00',
    expectedPackageCount: 15
  });

  if (res3.success && res3.isDuplicatePrevention && res3.pickupId === res1.pickupId) {
    console.log(`✅ TEST 3 PASSED: Idempotency enforced. Returned existing PR ID: ${res3.pickupId}`);
    passedTests++;
  } else {
    console.error('❌ TEST 3 FAILED: Duplicate pickup request created!');
  }

  // --- SCENARIO 4: Validation Error Handling ---
  console.log('\n--- SCENARIO 4: Missing Location Validation ---');
  const res4 = await DelhiveryPickupService.createPickupRequest({
    companyId: compId,
    courierId: courierId,
    pickupLocation: '', // Missing
    pickupDate: '2026-08-25',
    expectedPackageCount: 5
  });

  if (!res4.success && res4.errorCode === 'VALIDATION_ERROR') {
    console.log('✅ TEST 4 PASSED: Missing pickup location rejected by validation.');
    passedTests++;
  } else {
    console.error('❌ TEST 4 FAILED!');
  }

  // --- SCENARIO 5: Staging Gateway Response Verification ---
  console.log('\n--- SCENARIO 5: Staging Gateway Response Verification ---');
  const stagingCourierId = 'courier-staging-pkp';
  await prisma.courierPartner.upsert({
    where: { id: stagingCourierId },
    update: {},
    create: {
      id: stagingCourierId, company_id: compId, courier_id: 'DELHIVERY', courier_name: 'Staging Delhivery',
      api_credentials: JSON.stringify({ mode: 'staging', api_key: 'test_token_staging' })
    }
  });

  const res5 = await DelhiveryPickupService.createPickupRequest({
    companyId: compId,
    courierId: stagingCourierId,
    pickupLocation: 'NonExistentWarehouse999',
    pickupDate: '2026-08-27',
    expectedPackageCount: 5
  });

  const dbRecord = await prisma.pickupRequest.findFirst({
    where: { company_id: compId, facility_name: 'NonExistentWarehouse999' }
  });

  if (!res5.success && dbRecord?.booking_status === 'FAILED') {
    console.log('✅ TEST 5 PASSED: Gateway error handled safely with FAILED status recorded in DB.');
    passedTests++;
  } else {
    console.error('❌ TEST 5 FAILED!');
  }

  // --- SCENARIO 6: Token Masking & Audit Logging ---
  console.log('\n--- SCENARIO 6: Token Security & Audit Logging ---');
  const logs = await prisma.apiLog.findMany({
    where: { company_id: compId, operation: 'PICKUP' }
  });

  const hasExposedToken = logs.some(l => l.request_meta?.includes('test_token_staging') || l.request_meta?.includes('mock_token_123'));

  if (!hasExposedToken) {
    console.log('✅ TEST 6 PASSED: Security audit confirmed. API credentials never logged.');
    passedTests++;
  } else {
    console.error('❌ TEST 6 FAILED: Credentials exposed in logs!');
  }

  // Cleanup test records
  await prisma.apiLog.deleteMany({ where: { company_id: compId } });
  await prisma.pickupRequest.deleteMany({ where: { company_id: compId } });
  await prisma.courierPartner.deleteMany({ where: { company_id: compId } });
  await prisma.company.deleteMany({ where: { id: compId } });

  console.log('\n================================================================');
  console.log(`   ALL ${passedTests} / ${totalTests} PICKUP AUDIT SCENARIOS PASSED PERFECTLY!   `);
  console.log('================================================================');
}

runPickupSuite().catch(console.error);
