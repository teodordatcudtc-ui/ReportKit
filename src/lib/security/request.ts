import type { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() || 'unknown';
  const xri = req.headers.get('x-real-ip');
  if (xri) return xri.trim();
  // NextRequest may provide an IP on some platforms, but it's not always available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyReq = req as any;
  return (typeof anyReq.ip === 'string' && anyReq.ip) || 'unknown';
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') ?? 'unknown';
}

