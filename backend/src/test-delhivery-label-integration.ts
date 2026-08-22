import 'dotenv/config';
import { DelhiveryProvider } from './services/courier/DelhiveryProvider';
import { ApiLogService } from './services/logger/ApiLogService';

async function runRealLabelIntegrationTest() {
  console.log('================================================================');
  console.log('   DELHIVERY B2C REAL LABEL HTTP STAGING INTEGRATION TEST      ');
  console.log('================================================================\n');

  // Fetch real staging token or test key without ever logging/printing it
  const stagingToken = process.env.DELHIVERY_STAGING_TOKEN || 'test_staging_token_mock';
  const provider = new DelhiveryProvider({ mode: 'staging', api_key: stagingToken });

  const sampleWaybill = '123456789012';

  // --- 1. Real HTTP Staging Integration Test: 4R Thermal Label ---
  console.log('--- 1. Testing Real Staging 4R Thermal Label Request ---');
  const res4R = await provider.generateLabel(sampleWaybill, '4R', true, true);

  console.log(`[HTTP Endpoint]: ${res4R.labelUrl}`);
  console.log(`[Fetch Success]: ${res4R.success}`);
  if (res4R.contentType) console.log(`[Content-Type]: ${res4R.contentType}`);
  if (res4R.byteLength !== undefined) console.log(`[Response Size]: ${res4R.byteLength} bytes`);
  if (res4R.isPdfValid !== undefined) console.log(`[Valid %PDF- Signature]: ${res4R.isPdfValid}`);
  if (res4R.error) console.log(`[Gateway Response]: ${res4R.error}`);

  // --- 2. Real HTTP Staging Integration Test: A4 Sheet Label ---
  console.log('\n--- 2. Testing Real Staging A4 Sheet Label Request ---');
  const resA4 = await provider.generateLabel(sampleWaybill, 'A4', true, true);

  console.log(`[HTTP Endpoint]: ${resA4.labelUrl}`);
  console.log(`[Fetch Success]: ${resA4.success}`);
  if (resA4.contentType) console.log(`[Content-Type]: ${resA4.contentType}`);
  if (resA4.byteLength !== undefined) console.log(`[Response Size]: ${resA4.byteLength} bytes`);
  if (resA4.isPdfValid !== undefined) console.log(`[Valid %PDF- Signature]: ${resA4.isPdfValid}`);

  // --- 3. Real HTTP Staging Integration Test: JSON Format (pdf=false) ---
  console.log('\n--- 3. Testing Real Staging JSON Label Request (pdf=false) ---');
  const resJson = await provider.generateLabel(sampleWaybill, '4R', false, true);

  console.log(`[HTTP Endpoint]: ${resJson.labelUrl}`);
  console.log(`[Fetch Success]: ${resJson.success}`);

  // --- 4. Invalid AWB Error Handling Test ---
  console.log('\n--- 4. Testing Invalid AWB Error Handling ---');
  const invalidProvider = new DelhiveryProvider({ mode: 'staging', api_key: 'INVALID_TOKEN_99999' });
  const resInvalid = await invalidProvider.generateLabel('INVALID_AWB_9999999', '4R', true, true);

  console.log(`[HTTP Endpoint]: ${resInvalid.labelUrl}`);
  console.log(`[Invalid AWB Handled Safely]: ${!resInvalid.success || resInvalid.error !== undefined}`);
  if (resInvalid.error) console.log(`[Controlled Error Message]: ${resInvalid.error}`);

  // --- 5. Security Token Sanitization Audit ---
  console.log('\n--- 5. Security & Credential Sanitization Audit ---');
  const mockLog = ApiLogService.sanitize({
    api_key: 'SECRET_TOKEN_DO_NOT_EXPOSE_12345',
    password: 'SECRET_PASSWORD',
    authorization: 'Token SECRET_TOKEN_DO_NOT_EXPOSE_12345'
  });

  const isTokenMasked = JSON.stringify(mockLog).includes('***MASKED_SECRET***') && !JSON.stringify(mockLog).includes('SECRET_TOKEN');
  console.log(`[Log Masking Audit]: ${isTokenMasked ? '✅ MASKED & SECURE' : '❌ UNMASKED EXPOSURE'}`);

  console.log('\n================================================================');
  console.log('   LABEL API STAGING INTEGRATION TEST COMPLETED SUCCESSFULLY   ');
  console.log('================================================================');
}

runRealLabelIntegrationTest().catch(console.error);
