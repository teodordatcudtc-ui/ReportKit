import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();
  if (!agency) return NextResponse.json({ accounts: [], has_connection: false });

  const { data: tokenRow } = await supabase
    .from('agency_tokens')
    .select('access_token')
    .eq('agency_id', agency.id)
    .eq('platform', 'meta_ads')
    .single();
  if (!tokenRow?.access_token) {
    return NextResponse.json({ accounts: [], has_connection: false });
  }

  let adAccounts: { id: string; name: string }[] = [];
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&access_token=${encodeURIComponent(tokenRow.access_token)}`
    );
    const data = (await res.json()) as {
      data?: { id: string; name?: string }[];
      error?: { message: string };
    };
    const raw = data?.data ?? [];
    adAccounts = raw.map((acc) => {
      const id = acc.id?.startsWith('act_') ? acc.id : `act_${acc.id}`;
      return { id, name: acc.name ?? id };
    });
  } catch {
    return NextResponse.json({ accounts: [], has_connection: true });
  }

  const { data: existingClients } = await supabase
    .from('clients')
    .select('meta_ad_account_id')
    .eq('agency_id', agency.id)
    .not('meta_ad_account_id', 'is', null);
  const existingIds = new Set(
    (existingClients ?? []).map((c) => (c as { meta_ad_account_id: string }).meta_ad_account_id)
  );
  const accounts = adAccounts.filter((a) => !existingIds.has(a.id));

  return NextResponse.json({ accounts, has_connection: true });
}
