/**
 * Frontend Payment Service
 * Calls the server-side M-Pesa API routes.
 */

interface StkPushParams {
  phone: string;
  amount: number;
  bookingId: string;
}

interface StkPushResult {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseDescription?: string;
  error?: string;
}

interface PaymentStatusResult {
  success: boolean;
  bookingId: string;
  status: string;
  paymentStatus: string;
  paid: boolean;
  confirmed: boolean;
}

interface StkQueryResult {
  success: boolean;
  resultCode?: string;
  resultDesc?: string;
  paid?: boolean;
  error?: string;
}

export const paymentService = {
  /**
   * Initiate an M-Pesa STK Push to the customer's phone.
   * This triggers the PIN prompt on their device.
   */
  async initiateSTKPush(params: StkPushParams): Promise<StkPushResult> {
    try {
      const response = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('[paymentService] STK Push error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  },

  /**
   * Query the status of an STK Push transaction via Daraja.
   */
  async querySTKStatus(checkoutRequestId: string): Promise<StkQueryResult> {
    try {
      const response = await fetch('/api/mpesa/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutRequestId }),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('[paymentService] STK Query error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  },

  /**
   * Poll the booking's payment status from our own database.
   * Used as a fallback alongside Supabase realtime.
   */
  async getPaymentStatus(bookingId: string): Promise<PaymentStatusResult> {
    try {
      const response = await fetch(`/api/mpesa/payment-status/${bookingId}`);
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('[paymentService] Status poll error:', error);
      return { success: false, bookingId, status: '', paymentStatus: '', paid: false, confirmed: false };
    }
  },

  /**
   * Poll payment status at intervals until paid or timeout.
   * Returns true if payment was confirmed, false if timed out.
   */
  async pollUntilPaid(bookingId: string, intervalMs = 3000, timeoutMs = 120000): Promise<boolean> {
    const start = Date.now();
    return new Promise((resolve) => {
      const check = async () => {
        if (Date.now() - start > timeoutMs) {
          resolve(false);
          return;
        }
        const result = await this.getPaymentStatus(bookingId);
        if (result.paid && result.confirmed) {
          resolve(true);
          return;
        }
        setTimeout(check, intervalMs);
      };
      check();
    });
  },
};
