import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import apiRoutes from './routes';
import { setupTrackingCron } from './jobs/tracking.cron';

const app = express();
const port = process.env.PORT || 5000;

// Trust reverse proxies (Render, Vercel, Cloudflare, AWS)
app.set('trust proxy', 1);

// Comprehensive CORS & Preflight Middleware (Express 5 Compatible)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Initialize background jobs
setupTrackingCron();

// Security Headers with Cross-Origin Resource Policy allowed
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate Limiting for Auth Endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  skip: (req) => req.method === 'OPTIONS', // Never rate-limit preflight OPTIONS
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check & Root Endpoints for Render & Load Balancers
app.get('/', (req, res) => {
  res.json({ status: 'HEALTHY', service: 'LogiFlow Courier SaaS API Backend', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', apiRoutes);

// Global Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER ERROR]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message });
});

// Start server
app.listen(port, () => {
  console.log(`LogiFlow Production-Ready Backend Server running on port ${port}`);
});