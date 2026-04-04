/**
 * Email provider abstraction for LinkedUp Cars.
 *
 * Wraps an external email service (Resend, SendGrid, AWS SES, etc.)
 * behind a simple interface. To activate real delivery, set the
 * VITE_EMAIL_PROVIDER and its credentials in .env.
 */

import { supabase } from '../lib/supabase';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  booking_confirmation: {
    subject: 'LinkedUp Cars - Booking #{{booking_id}} Confirmed',
    body: [
      'Hi there,',
      '',
      'Your booking #{{booking_id}} has been confirmed!',
      '',
      'Car: {{car_name}}',
      'Dates: {{start_date}} - {{end_date}}',
      'Total: KES {{total_amount}}',
      '',
      'You will receive further details before your pickup date.',
      '',
      'Safe travels,',
      'The LinkedUp Cars Team',
    ].join('\n'),
  },
  booking_approved: {
    subject: 'LinkedUp Cars - Booking #{{booking_id}} Approved',
    body: [
      'Great news!',
      '',
      'Your booking #{{booking_id}} has been approved.',
      'Car: {{car_name}}',
      'Pickup: {{pickup_location}}',
      'Dates: {{start_date}} - {{end_date}}',
      '',
      'See you soon!',
      'The LinkedUp Cars Team',
    ].join('\n'),
  },
  return_reminder: {
    subject: 'LinkedUp Cars - Return Reminder for Booking #{{booking_id}}',
    body: [
      'Reminder: Your booking #{{booking_id}} ends tomorrow ({{end_date}}).',
      '',
      'Car: {{car_name}}',
      '',
      'Please return on time to avoid late fees.',
      'Need more time? Extend your booking from the app.',
      '',
      'The LinkedUp Cars Team',
    ].join('\n'),
  },
  payment_receipt: {
    subject: 'LinkedUp Cars - Payment Receipt for Booking #{{booking_id}}',
    body: [
      'Payment of KES {{total_amount}} received for booking #{{booking_id}}.',
      'Method: {{payment_method}}',
      '',
      'Thank you!',
      'The LinkedUp Cars Team',
    ].join('\n'),
  },
  welcome: {
    subject: 'Welcome to LinkedUp Cars!',
    body: [
      'Hi {{name}},',
      '',
      'Welcome to LinkedUp Cars!',
      'Browse our fleet and book your first ride today.',
      '',
      'Need help? Our support team is just a tap away.',
      '',
      'The LinkedUp Cars Team',
    ].join('\n'),
  },
};

export function formatTemplate(template: string, data: Record<string, string>): string {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_match, key) => data[key] ?? '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<EmailResult> {
  // Queue the email for processing by a background worker
  const { error } = await supabase.from('notification_queue').insert({
    channel: 'email',
    recipient: to,
    content: JSON.stringify({ subject, body }),
    status: 'queued',
    attempts: 0,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[emailProvider] Failed to queue email:', error.message);
    return { success: false, error: error.message };
  }

  console.info(`[emailProvider] Email queued for ${to} (provider not yet configured)`);
  return { success: true, messageId: `email_queued_${Date.now()}` };
}

export async function sendTemplatedEmail(
  to: string,
  templateKey: string,
  data: Record<string, string>,
): Promise<EmailResult> {
  const template = EMAIL_TEMPLATES[templateKey];
  if (!template) {
    return { success: false, error: `Unknown email template: ${templateKey}` };
  }

  const subject = formatTemplate(template.subject, data);
  const body = formatTemplate(template.body, data);
  return sendEmail(to, subject, body);
}
