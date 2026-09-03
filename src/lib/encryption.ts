import crypto from 'node:crypto';
import { env } from '@/config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

/**
 * Encrypts a sensitive string (API key, OAuth token, webhook secret) using AES-256-GCM.
 * Output format: iv:ciphertext:tag (hex encoded).
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypts a ciphertext produced by encryptSecret.
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const ivHex = parts[0];
  const ciphertextHex = parts[1];
  const tagHex = parts[2];

  if (!ivHex || !ciphertextHex || !tagHex) {
    throw new Error('Invalid encrypted payload components');
  }

  const key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
