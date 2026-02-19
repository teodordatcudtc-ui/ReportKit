import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
}

export async function sendReportByEmail(
  smtp: SmtpConfig,
  options: { to: string; subject: string; clientName: string; pdfBuffer: Buffer; filename: string }
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  await transporter.sendMail({
    from: smtp.fromEmail,
    to: options.to,
    subject: options.subject,
    text: `Raport performanta marketing pentru ${options.clientName}. Vezi PDF atasat.`,
    attachments: [{ filename: options.filename, content: options.pdfBuffer }],
  });
}
