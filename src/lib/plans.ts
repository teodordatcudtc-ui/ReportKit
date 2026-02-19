export type PlanId = 'free' | 'starter' | 'professional' | 'agency';

export const PLAN_LIMITS: Record<
  PlanId,
  { maxClients: number; maxReportsPerMonth: number; scheduledEmail: boolean }
> = {
  free: { maxClients: 1, maxReportsPerMonth: 3, scheduledEmail: false },
  starter: { maxClients: 5, maxReportsPerMonth: Infinity, scheduledEmail: false },
  professional: { maxClients: 20, maxReportsPerMonth: Infinity, scheduledEmail: true },
  agency: { maxClients: Infinity, maxReportsPerMonth: Infinity, scheduledEmail: true },
};

export function getPlanLimit(plan: string | null | undefined): (typeof PLAN_LIMITS)[PlanId] {
  const p = (plan ?? 'free') as PlanId;
  return PLAN_LIMITS[p] ?? PLAN_LIMITS.free;
}

export function isValidPlan(plan: string): plan is PlanId {
  return plan === 'free' || plan === 'starter' || plan === 'professional' || plan === 'agency';
}
