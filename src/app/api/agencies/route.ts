import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { z } from 'zod';
import { isValidPlan } from '@/lib/plans';
import type { ReportSettings } from '@/lib/report-settings';

const reportSettingsSchema = z.object({
  google: z.record(z.string(), z.boolean()).optional(),
  meta: z.record(z.string(), z.boolean()).optional(),
  charts: z.record(z.string(), z.boolean()).optional(),
});

const createSchema = z.object({
  agency_name: z.string().min(1).optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logo_url: z.string().url().nullable().optional(),
  website_url: z.string().url().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().max(32).nullable().optional(),
  plan: z.enum(['free', 'starter', 'professional', 'agency']).optional(),
  report_settings: reportSettingsSchema.optional(),
  smtp_host: z.string().max(256).nullable().optional(),
  smtp_port: z.number().int().min(1).max(65535).nullable().optional(),
  smtp_user: z.string().max(256).nullable().optional(),
  smtp_pass: z.string().max(512).nullable().optional(),
  smtp_from_email: z.string().email().max(256).nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data, error } = await getSupabaseAdmin()
    .from('agencies')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? null);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  const { data: existing } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.agency_name !== undefined) updates.agency_name = parsed.data.agency_name;
  if (parsed.data.primary_color !== undefined) updates.primary_color = parsed.data.primary_color;
  if (parsed.data.logo_url !== undefined) updates.logo_url = parsed.data.logo_url;
  if (parsed.data.website_url !== undefined) updates.website_url = parsed.data.website_url;
  if (parsed.data.contact_email !== undefined) updates.contact_email = parsed.data.contact_email;
  if (parsed.data.contact_phone !== undefined) updates.contact_phone = parsed.data.contact_phone;
  if (parsed.data.plan !== undefined && isValidPlan(parsed.data.plan)) updates.plan = parsed.data.plan;
  if (parsed.data.smtp_host !== undefined) updates.smtp_host = parsed.data.smtp_host;
  if (parsed.data.smtp_port !== undefined) updates.smtp_port = parsed.data.smtp_port;
  if (parsed.data.smtp_user !== undefined) updates.smtp_user = parsed.data.smtp_user;
  if (parsed.data.smtp_pass !== undefined) updates.smtp_pass = parsed.data.smtp_pass;
  if (parsed.data.smtp_from_email !== undefined) updates.smtp_from_email = parsed.data.smtp_from_email;
  if (parsed.data.report_settings !== undefined) {
    updates.report_settings = parsed.data.report_settings as ReportSettings;
  }

  if (existing) {
    const { data, error } = await getSupabaseAdmin()
      .from('agencies')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
  const agencyName = parsed.data.agency_name && String(parsed.data.agency_name).trim();
  if (!agencyName) {
    return NextResponse.json({ error: 'agency_name is required for new agency' }, { status: 400 });
  }
  const { data, error } = await getSupabaseAdmin()
    .from('agencies')
    .insert({
      user_id: session.user.id,
      agency_name: agencyName,
      primary_color: parsed.data.primary_color ?? '#3B82F6',
      logo_url: parsed.data.logo_url ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
