import { Router } from 'express';
import { requireAuth, requireRole } from './auth.middleware';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

import { getClients, createClient, updateClient, deleteClient, getClientById, uploadClientAgreement, createClientLogin } from './controllers/client.controller';
import { getCouriers, createCourier, updateCourier, deleteCourier, testCourierConnection, getWaybillInventorySummary, fetchWaybillsBulk } from './controllers/courier.controller';
import { getShipments, bookShipment, updateShipment } from './controllers/shipment.controller';
import { getAnalytics, getMonthlyReport } from './controllers/analytics.controller';
import { getUsers, createUser, updateUser, deleteUser } from './controllers/user.controller';
import { getPublicTracking, syncShipmentTracking, syncAllActiveShipments } from './controllers/tracking.controller';
import { previewImport, processImport } from './controllers/import.controller';
import { generateInvoice, getInvoicesByClient, getInvoiceById } from './controllers/invoice.controller';
import { getCompanySettings, updateCompanySettings } from './controllers/settings.controller';
import { getRateCards, createRateCard, updateRateCard, deleteRateCard, getZoneMappings, saveZoneMapping, calculateRateEstimate } from './controllers/rate.controller';
import { login, forgotPassword, verifyResetToken, resetPassword } from './controllers/auth.controller';
import { handleCourierWebhook } from './controllers/webhook.controller';
import { getNDRShipments, processNDRAction } from './controllers/ndr.controller';
import { deliverShipment } from './controllers/delivery.controller';
import { getWarehouses, createWarehouse, updateWarehouse } from './controllers/warehouse.controller';
import { getPickupRequests, createPickupRequest, updatePickupRequestStatus } from './controllers/pickup.controller';
import { getSupportTickets, createSupportTicket, updateTicketStatus } from './controllers/support.controller';
import { calculateRateQuotes } from './controllers/calculator.controller';
import { processCourierBillReconciliation, getCourierBills } from './controllers/reconciliation.controller';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LogiFlow API is running.' });
});

router.post('/auth/dev-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev login disabled in production mode' });
  }
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
router.post('/auth/forgot-password', forgotPassword);
router.get('/auth/verify-reset-token/:token', verifyResetToken);
router.post('/auth/reset-password', resetPassword);
router.get('/public/track/:awb', getPublicTracking);
router.post('/public/rates/calculate', calculateRateQuotes);
router.post('/rates/calculator-quotes', requireAuth, calculateRateQuotes);
router.post('/webhooks/courier', handleCourierWebhook);
router.post('/webhooks/delhivery', handleCourierWebhook);
router.post('/webhooks/bluedart', handleCourierWebhook);

// --- User & Team Management API ---
router.get('/users', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), getUsers);
router.post('/users', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), createUser);
router.put('/users/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), updateUser);
router.delete('/users/:id', requireAuth, requireRole(['SUPER_ADMIN']), deleteUser);

// --- Tracking Sync API ---
router.post('/tracking/sync/:awb', requireAuth, syncShipmentTracking);
router.post('/tracking/sync-all', requireAuth, syncAllActiveShipments);

// --- Analytics & Reports API ---
router.get('/analytics', requireAuth, getAnalytics);
router.get('/analytics/monthly-report', requireAuth, getMonthlyReport);

// --- NDR Management API ---
router.get('/ndr', requireAuth, getNDRShipments);
router.post('/ndr/:id/action', requireAuth, processNDRAction);

// --- Clients API ---
router.get('/clients', requireAuth, getClients);
router.post('/clients', requireAuth, createClient);
router.get('/clients/:id', requireAuth, getClientById);
router.put('/clients/:id', requireAuth, updateClient);
router.delete('/clients/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteClient);
router.post('/clients/:id/agreement', requireAuth, uploadClientAgreement);
router.post('/clients/:id/create-login', requireAuth, createClientLogin);

// --- Invoices API ---
router.post('/invoices/generate', requireAuth, generateInvoice);
router.get('/invoices/:id', requireAuth, getInvoiceById);
router.get('/clients/:clientId/invoices', requireAuth, getInvoicesByClient);

// --- Settings API ---
router.get('/settings/company', requireAuth, getCompanySettings);
router.put('/settings/company', requireAuth, updateCompanySettings);

// --- Rates API ---
router.get('/rates', requireAuth, getRateCards);
router.post('/rates', requireAuth, createRateCard);
router.post('/rates/calculate', requireAuth, calculateRateEstimate);
router.put('/rates/:id', requireAuth, updateRateCard);
router.delete('/rates/:id', requireAuth, deleteRateCard);
router.get('/zones', requireAuth, getZoneMappings);
router.post('/zones', requireAuth, saveZoneMapping);

// --- Couriers API ---
router.get('/couriers', requireAuth, getCouriers);
router.post('/couriers', requireAuth, createCourier);
router.post('/couriers/test-connection', requireAuth, testCourierConnection);
router.get('/couriers/:id/waybills/summary', requireAuth, getWaybillInventorySummary);
router.post('/couriers/:id/waybills/fetch', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATIONS']), fetchWaybillsBulk);
router.put('/couriers/:id', requireAuth, updateCourier);
router.delete('/couriers/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), deleteCourier);

// --- Shipments API ---
router.get('/shipments', requireAuth, getShipments);
router.post('/shipments', requireAuth, bookShipment);
router.put('/shipments/:id', requireAuth, updateShipment);
router.post('/shipments/:awb/deliver', requireAuth, deliverShipment);

// --- Manage Warehouses & Pickup Locations API ---
router.get('/warehouses', requireAuth, getWarehouses);
router.post('/warehouses', requireAuth, createWarehouse);
router.put('/warehouses/:id', requireAuth, updateWarehouse);

// --- Domestic Pickup Requests API ---
router.get('/pickups', requireAuth, getPickupRequests);
router.post('/pickups', requireAuth, createPickupRequest);
router.put('/pickups/:id/status', requireAuth, updatePickupRequestStatus);

// --- Support Tickets API ---
router.get('/support/tickets', requireAuth, getSupportTickets);
router.post('/support/tickets', requireAuth, createSupportTicket);
router.put('/support/tickets/:id/status', requireAuth, updateTicketStatus);

// --- Courier Bill Reconciliation API ---
router.post('/reconciliation/process', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS']), processCourierBillReconciliation);
router.get('/reconciliation/bills', requireAuth, getCourierBills);

export default router;


