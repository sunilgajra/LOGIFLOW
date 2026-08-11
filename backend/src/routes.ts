import { Router } from 'express';
import { requireAuth, requireRole } from './auth.middleware';
import { aiUpload } from './controllers/import.controller';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = Router();

import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LogiFlow API is running.' });
});

router.post('/auth/dev-login', async (req, res) => {
  const user = await prisma.user.findFirst();
  if (!user) return res.status(404).json({ error: 'No users found' });
  
  const token = jwt.sign(
    { id: user.id, company_id: user.company_id, role: user.role },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '7d' }
  );
  res.json({ token, user });
});

import { getClients, createClient } from './controllers/client.controller';
import { getCouriers, createCourier } from './controllers/courier.controller';
import { getShipments } from './controllers/shipment.controller';

// --- Clients API ---
router.get('/clients', requireAuth, getClients);
router.post('/clients', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), createClient);

// --- Couriers API ---
router.get('/couriers', requireAuth, getCouriers);
router.post('/couriers', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), createCourier);

// --- Shipments API ---
router.get('/shipments', requireAuth, getShipments);

// --- Delivery Sheet Imports API ---
router.post('/imports', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), (req, res) => {
  // TODO: Handle excel/csv file upload via multer
  // TODO: Trigger parsing and column mapping
  res.json({ message: 'Delivery sheet imported successfully' });
});

router.post('/imports/ai-upload', upload.single('file'), aiUpload);

export default router;
