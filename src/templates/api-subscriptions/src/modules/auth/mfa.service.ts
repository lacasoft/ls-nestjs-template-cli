import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class MfaService {
  /**
   * Generate a new MFA secret for a user
   */
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  /**
   * Generate QR code URL for authenticator apps
   */
  async generateQRCode(email: string, secret: string): Promise<string> {
    const appName = process.env.APP_NAME || 'API-Subscription';
    const otpauth = authenticator.keyuri(email, appName, secret);

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
    return qrCodeDataUrl;
  }

  /**
   * Verify a TOTP token against a secret
   */
  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  /**
   * Generate current TOTP token (for testing purposes)
   */
  generateToken(secret: string): string {
    return authenticator.generate(secret);
  }
}
