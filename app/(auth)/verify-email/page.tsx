'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type === 'recovery' ? 'recovery' : 'email',
        });

        if (error) throw error;

        setStatus('success');
        setMessage('Email verified successfully!');

        setTimeout(() => router.push('/dashboard'), 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
          <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-4" />

          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-spin" />
              <h2 className="text-2xl font-bold text-white mb-2">Verifying Email</h2>
              <p className="text-gray-400">Please wait...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
              <p className="text-gray-300">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-gray-300 mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
