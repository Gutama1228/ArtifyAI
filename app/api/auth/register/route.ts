import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, email, fullName } = await request.json();

    const supabase = await createClient();

    const { error } = await supabase.from('profiles').insert({
      id: userId,
      email,
      full_name: fullName,
      subscription_tier: 'free',
      credits_remaining: 10,
      daily_limit: 10,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
