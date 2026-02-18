import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: agency } = await getSupabaseAdmin()
    .from('agencies')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
  if (!agency) {
    return NextResponse.json({ error: 'Create an agency first' }, { status: 400 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file') as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use PNG, JPEG, WebP or SVG.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 2MB.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext) ? ext : 'png';
  const path = `agency_logos/${agency.id}/logo.${safeExt}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await getSupabaseAdmin().storage
    .from('reports')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });
  if (uploadError) {
    console.error('Logo upload error:', uploadError);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
  const { data: urlData } = getSupabaseAdmin().storage.from('reports').getPublicUrl(path);
  const logoUrl = urlData?.publicUrl ?? '';

  const { error: updateError } = await getSupabaseAdmin()
    .from('agencies')
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', agency.id);
  if (updateError) {
    console.error('Agency update error:', updateError);
    return NextResponse.json({ error: 'Failed to save logo URL' }, { status: 500 });
  }

  return NextResponse.json({ logo_url: logoUrl });
}
