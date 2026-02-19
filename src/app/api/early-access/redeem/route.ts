import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const TRIAL_MONTHS = 6;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Trebuie să fii autentificat.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  if (!code) {
    return NextResponse.json({ error: 'Codul este obligatoriu.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: agency, error: agencyErr } = await supabase
    .from('agencies')
    .select('id, plan, trial_ends_at')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();

  if (agencyErr || !agency) {
    return NextResponse.json(
      { error: 'Nu ai încă o agenție. Creează una din dashboard.' },
      { status: 400 }
    );
  }

  const { data: row, error: codeErr } = await supabase
    .from('early_access_codes')
    .select('id, used_at')
    .eq('code', code)
    .limit(1)
    .single();

  if (codeErr || !row) {
    return NextResponse.json({ error: 'Cod invalid sau deja folosit.' }, { status: 400 });
  }

  if (row.used_at) {
    return NextResponse.json({ error: 'Acest cod a fost deja folosit.' }, { status: 400 });
  }

  const now = new Date();
  const trialEndsAt = new Date(now);
  trialEndsAt.setMonth(trialEndsAt.getMonth() + TRIAL_MONTHS);

  const { error: updateAgencyErr } = await supabase
    .from('agencies')
    .update({
      plan: 'agency',
      trial_ends_at: trialEndsAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', agency.id);

  if (updateAgencyErr) {
    return NextResponse.json({ error: updateAgencyErr.message }, { status: 500 });
  }

  const { error: markUsedErr } = await supabase
    .from('early_access_codes')
    .update({
      used_by_agency_id: agency.id,
      used_at: now.toISOString(),
    })
    .eq('id', row.id);

  if (markUsedErr) {
    return NextResponse.json({ error: 'Cod aplicat, dar marcare utilizare a eșuat.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    plan: 'agency',
    trial_ends_at: trialEndsAt.toISOString(),
    message: `Ai acum 6 luni gratuit la planul Agency (acces total). Perioada gratuită se termină la ${trialEndsAt.toLocaleDateString('ro-RO')}.`,
  });
}
