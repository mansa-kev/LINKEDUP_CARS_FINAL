import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { mpesaService } from "./src/services/mpesaService.js";

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server-side Supabase client (uses service role or anon key)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple in-memory rate limiter
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const RATE_LIMIT_MAX = 100; // 100 requests per minute

  const rateLimitMiddleware = (req: any, res: any, next: any) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      // New window
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      next();
    } else {
      // Existing window
      if (record.count >= RATE_LIMIT_MAX) {
        return res.status(429).json({ error: 'Too many requests' });
      }
      record.count++;
      next();
    }
  };

  // Apply rate limiting to API routes
  app.use('/api', rateLimitMiddleware);

  // Security headers middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // Parse JSON bodies for API routes (must come before Vite middleware)
  app.use('/api', express.json());

  // ─── IMAGE PROXY ROUTE (Hides Supabase URL) ────────────────────────────────────────────

  /**
   * GET /api/images/:filename
   * Proxies images from Supabase to hide the bucket structure and URL
   * Adds caching headers for performance
   */
  app.get('/api/images/:filename', async (req, res) => {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).send('Filename required');
    }

    try {
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/public_assets/${filename}`;

      const response = await fetch(imageUrl);

      if (!response.ok) {
        return res.status(response.status).send('Image not found');
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type');

      res.set('Content-Type', contentType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // Cache for 24 hours
      res.set('CDN-Cache-Control', 'public, max-age=86400');

      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(500).send('Failed to fetch image');
    }
  });

  // ─── M-PESA API ROUTES ────────────────────────────────────────────

  /**
   * POST /api/mpesa/stk-push
   * Initiates an STK Push to the customer's phone.
   * Body: { phone, amount, bookingId }
   */
  app.post('/api/mpesa/stk-push', async (req, res) => {
    try {
      const { phone, amount, bookingId } = req.body;

      if (!phone || !amount || !bookingId) {
        return res.status(400).json({ success: false, error: 'Missing required fields: phone, amount, bookingId' });
      }

      // Validate booking exists
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status, client_id')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }

      // Initiate STK Push
      const result = await mpesaService.initiateSTKPush({ phone, amount, bookingId });

      if (result.success && result.checkoutRequestId) {
        // Store the checkout request ID in pending_payments for tracking
        await supabase.from('pending_payments').insert({
          booking_id: bookingId,
          client_id: booking.client_id || null,
          amount: amount,
          transaction_code: result.checkoutRequestId,
          status: 'submitted',
          metadata: {
            type: 'stk_push',
            merchant_request_id: result.merchantRequestId,
            phone: phone,
          }
        });

        // Update booking to reflect payment is in progress
        await supabase
          .from('bookings')
          .update({ 
            status: 'pending_payment_verification',
            payment_status: 'pending',
          })
          .eq('id', bookingId);
      }

      return res.json(result);
    } catch (error: any) {
      console.error('[API] STK Push error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

  /**
   * POST /api/mpesa/callback
   * Receives the payment result from Safaricom.
   * This is called by Safaricom's servers, NOT by our frontend.
   */
  app.post('/api/mpesa/callback', async (req, res) => {
    try {
      console.log('[M-Pesa Callback] Received:', JSON.stringify(req.body, null, 2));

      const result = mpesaService.parseCallback(req.body);

      // Find the pending payment by checkout request ID
      const { data: pendingPayment, error: findError } = await supabase
        .from('pending_payments')
        .select('*, bookings(*)')
        .eq('transaction_code', result.checkoutRequestId)
        .single();

      if (findError || !pendingPayment) {
        console.error('[M-Pesa Callback] Could not find pending payment for:', result.checkoutRequestId);
        // Still respond 200 to Safaricom so they don't retry
        return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      if (result.success) {
        // Payment successful — update pending_payment
        await supabase
          .from('pending_payments')
          .update({
            status: 'verified',
            transaction_code: result.mpesaReceiptNumber || result.checkoutRequestId,
            verified_at: new Date().toISOString(),
            metadata: {
              ...((pendingPayment.metadata as any) || {}),
              mpesa_receipt: result.mpesaReceiptNumber,
              mpesa_amount: result.amount,
              mpesa_phone: result.phone,
              mpesa_date: result.transactionDate,
              callback_result_code: result.resultCode,
              callback_result_desc: result.resultDesc,
            }
          })
          .eq('id', pendingPayment.id);

        // Update booking to confirmed + paid
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'mpesa',
          })
          .eq('id', pendingPayment.booking_id);

        // Create transaction record
        await supabase.from('transactions').insert({
          booking_id: pendingPayment.booking_id,
          user_id: pendingPayment.client_id,
          amount: result.amount || pendingPayment.amount,
          type: 'payment_in',
          status: 'completed',
          transaction_code: result.mpesaReceiptNumber || result.checkoutRequestId,
        });

        // Create in-app notification for the client
        if (pendingPayment.client_id) {
          await supabase.from('notifications').insert({
            user_id: pendingPayment.client_id,
            title: 'Payment Received',
            content: `Your M-Pesa payment of KES ${Number(result.amount || pendingPayment.amount).toLocaleString()} has been received. Booking confirmed!`,
            type: 'success',
            is_read: false,
            link: `/bookings/${pendingPayment.booking_id}`,
          });
        }

        console.log('[M-Pesa Callback] Payment confirmed for booking:', pendingPayment.booking_id);
      } else {
        // Payment failed or cancelled
        await supabase
          .from('pending_payments')
          .update({
            status: 'rejected',
            metadata: {
              ...((pendingPayment.metadata as any) || {}),
              callback_result_code: result.resultCode,
              callback_result_desc: result.resultDesc,
            }
          })
          .eq('id', pendingPayment.id);

        // Revert booking status
        await supabase
          .from('bookings')
          .update({
            status: 'pending',
            payment_status: 'failed',
          })
          .eq('id', pendingPayment.booking_id);

        console.log('[M-Pesa Callback] Payment failed for booking:', pendingPayment.booking_id, result.resultDesc);
      }

      // Always respond 200 to Safaricom
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error: any) {
      console.error('[M-Pesa Callback] Error processing:', error);
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
  });

  /**
   * POST /api/mpesa/query
   * Query the status of an STK Push transaction.
   * Body: { checkoutRequestId }
   */
  app.post('/api/mpesa/query', async (req, res) => {
    try {
      const { checkoutRequestId } = req.body;

      if (!checkoutRequestId) {
        return res.status(400).json({ success: false, error: 'Missing checkoutRequestId' });
      }

      const result = await mpesaService.querySTKPushStatus(checkoutRequestId);
      return res.json(result);
    } catch (error: any) {
      console.error('[API] STK Query error:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
  });

  /**
   * GET /api/mpesa/payment-status/:bookingId
   * Check if booking payment has been confirmed (for frontend polling fallback).
   */
  app.get('/api/mpesa/payment-status/:bookingId', async (req, res) => {
    try {
      const { bookingId } = req.params;

      const { data: booking, error } = await supabase
        .from('bookings')
        .select('id, status, payment_status, payment_method')
        .eq('id', bookingId)
        .single();

      if (error || !booking) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }

      return res.json({
        success: true,
        bookingId: booking.id,
        status: booking.status,
        paymentStatus: booking.payment_status,
        paid: booking.payment_status === 'paid',
        confirmed: booking.status === 'confirmed',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // ─── VITE / STATIC SERVING ────────────────────────────────────────

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
