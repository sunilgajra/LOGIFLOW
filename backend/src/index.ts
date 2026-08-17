import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import apiRoutes from './routes';

import { setupTrackingCron } from './jobs/tracking.cron';

const app = express();
const port = process.env.PORT || 5000;

// Initialize background jobs
setupTrackingCron();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`LogiFlow Backend Server running on port ${port}`);
});