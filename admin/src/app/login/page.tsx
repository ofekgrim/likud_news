'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post<{
        accessToken: string;
        user: { id: string; email: string; name: string; role: string };
      }>('/auth/login', { email, password });
      setToken(data.accessToken);
      setUser(data.user);
      toast.success('התחברת בהצלחה');
      router.push('/dashboard');
    } catch {
      toast.error('שם משתמש או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Blue top accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#0099DB] to-[#1E3A8A]" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0099DB] to-[#1E3A8A] flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
                מ
              </div>
              <h1 className="text-lg font-bold text-gray-900">מצודת הליכוד</h1>
              <p className="text-sm text-gray-500 mt-0.5">כניסה למערכת הניהול</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">דוא&quot;ל</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@likud.org.il"
                  required
                  dir="ltr"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'מתחבר...' : 'כניסה'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
