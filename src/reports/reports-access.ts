import { createHmac, timingSafeEqual } from 'crypto';

export const signReportsUser = (userId: number, secret: string): string =>
  createHmac('sha256', secret).update(`reports:${userId}`).digest('hex');

export const verifyReportsUser = (userId: number, signature: string, secret: string): boolean => {
  const expected = signReportsUser(userId, secret);
  return (
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  );
};
