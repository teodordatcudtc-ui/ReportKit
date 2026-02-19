/**
 * Trimitere raport pe email prin Resend.
 * Utilizatorul configureaza doar: email de la care trimite (Reply-To) si email catre care trimite.
 * From-ul vizibil vine din env (RESEND_FROM_EMAIL), Reply-To = emailul utilizatorului.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Rapoarte <onboarding@resend.dev>';

export interface SendReportEmailOptions {
  to: string;
  replyTo?: string | null;
  subject: string;
  clientName: string;
  pdfBuffer: Buffer;
  filename: string;
}

export async function sendReportByResend(options: SendReportEmailOptions): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY nu este setat. Configureaza in .env pentru a trimite rapoarte pe email.');
  }
  const { Resend } = await import('resend');
  const resend = new Resend(RESEND_API_KEY);

  const payload = {
    from: RESEND_FROM_EMAIL,
    to: [options.to],
    subject: options.subject,
    html: `<p>Raport performanta marketing pentru <strong>${escapeHtml(options.clientName)}</strong>.</p><p>Vezi PDF atasat.</p>`,
    attachments: [{ filename: options.filename, content: options.pdfBuffer }],
    ...(options.replyTo && { reply_to: options.replyTo }),
  };

  const { error } = await resend.emails.send(payload);
  if (error) throw new Error(error.message);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
