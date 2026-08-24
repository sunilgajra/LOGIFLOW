import { Response } from 'express';
import { AuthenticatedRequest } from '../auth.middleware';
import { NotificationService } from '../services/notification.service';

/**
 * GET /api/notifications/preferences
 * Resolves notification preferences for authenticated client/tenant.
 */
export const getPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const clientId = req.user?.client_id || (req.query.client_id as string) || undefined;
    const pref = await NotificationService.getPreferences(companyId, clientId);

    res.json({ success: true, preferences: pref });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notification preferences', details: error.message });
  }
};

/**
 * POST /api/notifications/preferences
 * Updates notification preferences for authenticated client/tenant.
 */
export const updatePreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const clientId = req.user?.client_id || req.body.client_id || undefined;
    const updated = await NotificationService.updatePreferences(companyId, clientId, req.body);

    res.json({ success: true, message: 'Notification preferences saved successfully', preferences: updated });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification preferences', details: error.message });
  }
};

/**
 * POST /api/notifications/test-whatsapp
 * Dispatches test WhatsApp notification via backend service.
 */
export const sendTestWhatsApp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { phone } = req.body;
    const clientId = req.user?.client_id || req.body.client_id || undefined;

    const result = await NotificationService.sendTestWhatsApp(companyId, clientId, phone);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message, correlationId: result.correlationId });
    }

    res.json({ success: true, message: result.message, correlationId: result.correlationId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to dispatch test WhatsApp', details: error.message });
  }
};

/**
 * POST /api/notifications/test-email
 * Dispatches test Email notification via backend service.
 */
export const sendTestEmail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) return res.status(401).json({ error: 'Unauthorized' });

    const { email } = req.body;
    const clientId = req.user?.client_id || req.body.client_id || undefined;

    const result = await NotificationService.sendTestEmail(companyId, clientId, email);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message, correlationId: result.correlationId });
    }

    res.json({ success: true, message: result.message, correlationId: result.correlationId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to dispatch test Email', details: error.message });
  }
};
