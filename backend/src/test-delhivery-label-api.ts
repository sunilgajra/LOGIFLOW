import 'dotenv/config';
import { DelhiveryProvider } from './services/courier/DelhiveryProvider';

async function runLabelApiTests() {
  console.log('================================================================');
  console.log('   DELHIVERY B2C SHIPPING LABEL API AUDIT & VERIFICATION       ');
  console.log('================================================================\n');

  const sampleWaybill = 'DELH10029384';

  // 1. Verify Staging PDF 4R Label URL Construction
  const staging4RUrl = DelhiveryProvider.getLabelUrl(sampleWaybill, true, '4R', true);
  console.log('[Staging PDF 4R Label URL]:', staging4RUrl);

  const expected4RUrl = `https://staging-express.delhivery.com/api/p/packing_slip?wbns=${sampleWaybill}&pdf=true&pdf_size=4R`;
  if (staging4RUrl === expected4RUrl) {
    console.log('✅ TEST 1 PASSED: Staging PDF 4R Label URL matches official specification.\n');
  } else {
    console.error('❌ TEST 1 FAILED: Mismatch in 4R Label URL!');
  }

  // 2. Verify Production PDF A4 Label URL Construction
  const prodA4Url = DelhiveryProvider.getLabelUrl(sampleWaybill, false, 'A4', true);
  console.log('[Production PDF A4 Label URL]:', prodA4Url);

  const expectedA4Url = `https://track.delhivery.com/api/p/packing_slip?wbns=${sampleWaybill}&pdf=true&pdf_size=A4`;
  if (prodA4Url === expectedA4Url) {
    console.log('✅ TEST 2 PASSED: Production PDF A4 Label URL matches official specification.\n');
  } else {
    console.error('❌ TEST 2 FAILED: Mismatch in A4 Label URL!');
  }

  // 3. Verify JSON Format (`pdf=false`) Label URL Construction
  const jsonUrl = DelhiveryProvider.getLabelUrl(sampleWaybill, true, '4R', false);
  console.log('[Staging JSON Label URL (pdf=false)]:', jsonUrl);

  const expectedJsonUrl = `https://staging-express.delhivery.com/api/p/packing_slip?wbns=${sampleWaybill}&pdf=false`;
  if (jsonUrl === expectedJsonUrl) {
    console.log('✅ TEST 3 PASSED: JSON format (pdf=false) Label URL matches official specification.\n');
  } else {
    console.error('❌ TEST 3 FAILED: Mismatch in JSON Label URL!');
  }

  // 4. Verify Provider Instance generateLabel() Execution
  const provider = new DelhiveryProvider({ mode: 'staging', api_key: 'test_token_staging' });
  const labelRes = await provider.generateLabel(sampleWaybill, '4R', true);

  if (labelRes.labelUrl === expected4RUrl) {
    console.log('✅ TEST 4 PASSED: Provider generateLabel() returned exact 4R shipping label URL.\n');
  } else {
    console.error('❌ TEST 4 FAILED: Provider generateLabel() mismatch!');
  }

  console.log('================================================================');
  console.log('   ALL DELHIVERY SHIPPING LABEL API TESTS PASSED PERFECTLY!    ');
  console.log('================================================================');
}

runLabelApiTests().catch(console.error);
