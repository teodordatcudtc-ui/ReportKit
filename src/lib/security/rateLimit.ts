type Bucket = { count: number; resetAt: number };

const buckets: Map<string, Bucket> = new Map();

function cleanup(now: number) {
  // best-effort cleanup to keep memory bounded
  if (buckets.size < 2000) return;
  buckets.forEach((b, key) => {
    if (now > b.resetAt) buckets.delete(key);
  });
}

export function rateLimit(key: string, opts: { limit: number; windowMs: number }) {
  const now = Date.now();
  cleanup(now);

  const existing = buckets.get(key);
  const bucket: Bucket =
    !existing || now > existing.resetAt ? { count: 0, resetAt: now + opts.windowMs } : existing;

  bucket.count += 1;
  buckets.set(key, bucket);

  const ok = bucket.count <= opts.limit;
  return {
    ok,
    remaining: Math.max(0, opts.limit - bucket.count),
    resetMs: Math.max(0, bucket.resetAt - now),
  };
}

