import { Router } from 'express';
import { requireAuth, requireRole } from './auth.middleware';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

import { getClients, createClient, updateClient, getClientById, uploadClientAgreement, createClientLogin } from './controllers/client.controller';
import { getCouriers, createCourier, updateCourier } from './controllers/courier.controller';
import { getShipments, bookShipment, updateShipment } from './controllers/shipment.controller';
import { getAnalytics } from './controllers/analytics.controller';
import { getPublicTracking } from './controllers/tracking.controller';
import { previewImport, processImport } from './controllers/import.controller';
import { generateInvoice, getInvoicesByClient } from './controllers/invoice.controller';
import { getCompanySettings, updateCompanySettings } from './controllers/settings.controller';
import { getRateCards, createRateCard, updateRateCard, deleteRateCard, getZoneMappings, saveZoneMapping } from './controllers/rate.controller';
import { login } from './controllers/auth.controller';
import { handleCourierWebhook } from './controllers/webhook.controller';
import { getNDRShipments, processNDRAction } from './controllers/ndr.controller';
import { deliverShipment } from './controllers/delivery.controller';

const upload = multer({ dest: 'uploads/' });
const router = Router();

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

// --- Public APIs ---
router.post('/auth/login', login);
router.get('/public/track/:awb', getPublicTracking);
router.post('/webhooks/courier', handleCourierWebhook);
router.post('/webhooks/delhivery', handleCourierWebhook);

// --- Analytics API ---
router.get('/analytics', requireAuth, getAnalytics);

// --- NDR Management API ---
router.get('/ndr', requireAuth, getNDRShipments);
router.post('/ndr/:id/action', requireAuth, processNDRAction);

// --- Clients API ---
router.get('/clients', requireAuth, getClients);
router.post('/clients', requireAuth, createClient);
router.get('/clients/:id', requireAuth, getClientById);
router.put('/clients/:id', requireAuth, updateClient);
router.post('/clients/:id/agreement', requireAuth, uploadClientAgreement);
router.post('/clients/:id/create-login', requireAuth, createClientLogin);

// --- Invoices API ---
router.post('/invoices/generate', requireAuth, generateInvoice);
router.get('/clients/:clientId/invoices', requireAuth, getInvoicesByClient);

// --- Settings API ---
router.get('/settings/company', requireAuth, getCompanySettings);
router.put('/settings/company', requireAuth, updateCompanySettings);

// --- Rates API ---
router.get('/rates', requireAuth, getRateCards);
router.post('/rates', requireAuth, createRateCard);
router.put('/rates/:id', requireAuth, updateRateCard);
router.delete('/rates/:id', requireAuth, deleteRateCard);
router.get('/zones', requireAuth, getZoneMappings);
router.post('/zones', requireAuth, saveZoneMapping);

// --- Couriers API ---
router.get('/couriers', requireAuth, getCouriers);
router.post('/couriers', requireAuth, createCourier);
router.put('/couriers/:id', requireAuth, updateCourier);

// --- Shipments API ---
router.get('/shipments', requireAuth, getShipments);
router.post('/shipments', requireAuth, bookShipment);
router.put('/shipments/:id', requireAuth, updateShipment);
router.post('/shipments/:awb/deliver', requireAuth, deliverShipment);

// --- Delivery Sheet Imports API ---
router.post('/imports/preview', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), upload.single('file'), previewImport);
router.post('/imports/process', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), processImport);

export default router;

