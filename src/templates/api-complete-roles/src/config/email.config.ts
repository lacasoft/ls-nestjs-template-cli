import { registerAs } from '@nestjs/config';

export default registerAs('email', () => {
  const port = parseInt(process.env.EMAIL_SMTP_PORT || '587', 10);
  const secure = process.env.EMAIL_SMTP_SECURE === 'true';

  return {
    from: {
      name: process.env.EMAIL_FROM_NAME || 'App',
      address: process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com',
    },
    app: {
      name: process.env.EMAIL_APP_NAME || 'App',
      supportEmail: process.env.EMAIL_SUPPORT_EMAIL || 'support@example.com',
    },
    smtp: {
      host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
      port,
      secure, // true for 465, false for other ports
      // For port 587 (STARTTLS), we need requireTLS
      ...(port === 587 && !secure && { requireTLS: true }),
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
      // Additional SSL configuration
      tls: {
        rejectUnauthorized: false,
      },
    },
    frontend: {
      url: process.env.FRONTEND_URL || 'http://localhost:3001',
    },
  };
});
