import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class TokenEncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const value = config.get<string>('security.encryptionKey', '');
    if (!/^[0-9a-f]{64}$/i.test(value)) {
      throw new Error('DATA_ENCRYPTION_KEY must be a 64-character hexadecimal key.');
    }
    this.key = Buffer.from(value, 'hex');
  }

  public encrypt(value?: string): string | undefined {
    if (!value) return undefined;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `enc:v1:${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${encrypted.toString('base64url')}`;
  }

  public decrypt(value?: string): string | undefined {
    if (!value || !value.startsWith('enc:v1:')) return value;
    const [, , ivRaw, tagRaw, encryptedRaw] = value.split(':');
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivRaw, 'base64url'));
      decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(encryptedRaw, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new Error('Unable to decrypt stored Google token.');
    }
  }
}
