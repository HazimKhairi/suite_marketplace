import { NextResponse, type NextRequest } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const path = req.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from('receipts').createSignedUrl(path, 60 * 10);
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
