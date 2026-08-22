import { Request, Response } from 'express';
import { DelhiveryWebhookService } from '../services/courier/DelhiveryWebhookService';

/**
 * Production-ready Webhook Handler for Delhivery B2C & Courier Webhooks.
 * Public Endpoints:
 * POST /api/webhooks/delhivery
 * POST /api/webhooks/courier
 */
export const handleCourierWebhook = async (req: Request, res: Response) => {
  try {
    const result = await DelhiveryWebhookService.processWebhook({
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    if (!result.success && result.httpStatus !== 200) {
      return res.status(result.httpStatus).json({
        error: result.error || 'Webhook validation or processing failed',
        correlationId: result.correlationId
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      awb: result.awb,
      status: result.internalStatus,
      isDuplicate: result.isDuplicate,
      statusUpdated: result.statusUpdated,
      correlationId: result.correlationId
    });

  } catch (error: any) {
    console.error('[Webhook Controller Error]:', error);
    return res.status(500).json({
      error: 'Failed to process webhook',
      details: error.message
    });
  }
};
