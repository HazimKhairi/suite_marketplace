'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input, Label } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Welcome back');
    router.replace('/admin');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5">
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-ink text-canvas h-12 px-6 inline-flex items-center justify-center hover:bg-flame-red transition-colors disabled:opacity-50 font-heading font-semibold"
      >
        {submitting ? 'Signing in' : 'Sign in'}
      </button>
    </form>
  );
}
