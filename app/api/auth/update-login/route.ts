import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    await supabase.from('profiles').update({
      last_login_at: new Date().toISOString(),
      last_login_date: today,
    }).eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
