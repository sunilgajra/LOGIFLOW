import 'dotenv/config';
import { syncTrackingStatuses } from './src/jobs/tracking.cron';

async function run() {
  console.log('Testing Courier Tracking Sync...');
  await syncTrackingStatuses();
  console.log('Done testing.');
  process.exit(0);
}

run();
