'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

interface LoginPageClientProps {
  callbackUrl?: string;
}

export default function LoginPageClient({ callbackUrl = '/dashboard' }: LoginPageClientProps) {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error) {
        setError('Invalid email or password. Please try again.');
        return;
      }

      if (result.url) {
        router.push(result.url);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg shadow-zinc-100">
        <section className="hidden w-1/2 bg-zinc-50 p-10 text-zinc-900 lg:flex lg:flex-col lg:justify-between relative overflow-hidden border-r border-zinc-200">
          {/* Subtle decorative elements */}
          <div className="absolute top-20 right-10 w-40 h-40 bg-zinc-100/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-5 w-32 h-32 bg-zinc-100/30 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Mouchak Cosmetics</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-zinc-900">
              Manage Your
              <span className="block text-zinc-700">Store</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm text-zinc-600">
              Access inventory, track sales, process orders, and grow your business—all in one place.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">📊</div>
              <div>
                <p className="font-semibold text-sm text-zinc-900">Real-time Insights</p>
                <p className="text-xs text-zinc-600">See sales, stock, and customer activity instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">⚡</div>
              <div>
                <p className="font-semibold text-sm text-zinc-900">Fast & Reliable</p>
                <p className="text-xs text-zinc-600">Built to keep your business running smoothly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">🔐</div>
              <div>
                <p className="font-semibold text-sm text-zinc-900">Your Data is Safe</p>
                <p className="text-xs text-zinc-600">Industry-grade protection for your business</p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full p-6 sm:p-10 lg:w-1/2 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-zinc-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-zinc-600">Sign in to your account to access your store dashboard.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">Email Address</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
                placeholder="your@email.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-800">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
                placeholder="Enter your password"
                required
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Back to store:{' '}
            <Link href="/" className="font-semibold text-zinc-900 hover:text-zinc-700 transition">
              Visit storefront
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
