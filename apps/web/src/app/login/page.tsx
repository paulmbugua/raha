import { Eye } from 'lucide-react';
import type { Metadata } from 'next';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Secret Nairobi | Login',
  description: 'Sign in to your Secret Nairobi account.',
  path: '/login',
});

export default function Page() {
  return (
    <main className="min-h-screen bg-[#2b0a3d] px-5 py-8 font-serif text-white">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[560px] flex-col items-center">
        <a href="/" className="mb-9 font-serif text-6xl font-bold italic leading-none tracking-tight text-white [text-shadow:0_3px_0_#8b6a9b] md:text-7xl">
          Secret Nairobi
        </a>
        <form className="w-full rounded-[4px] bg-white px-6 py-7 text-[#003b5c] shadow-xl shadow-black/25">
          <label className="block text-base font-normal" htmlFor="login-username">
            Username or Email Address
          </label>
          <input
            id="login-username"
            name="username"
            autoComplete="username"
            className="mt-2 h-11 w-full rounded-[3px] border border-[#ff1493] px-3 text-lg text-[#111] outline-none focus:border-[#ff1493] focus:ring-2 focus:ring-[#ff1493]/20"
          />
          <label className="mt-5 block text-base font-normal" htmlFor="login-password">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-[3px] border border-[#ff3fd0] px-3 pr-12 text-lg text-[#111] outline-none focus:border-[#ff1493] focus:ring-2 focus:ring-[#ff1493]/20"
            />
            <button type="button" aria-label="Show password" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1683c7]">
              <Eye className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
            <button type="submit" className="rounded-full bg-gradient-to-b from-[#ff58bf] to-[#e60073] px-7 py-3 text-base font-bold text-white shadow-sm">
              Log In
            </button>
            <label className="justify-self-start text-right text-base text-[#003b5c] sm:justify-self-end">
              <input type="checkbox" name="remember" className="mb-2 block h-4 w-4 rounded border-[#999] sm:ml-auto" />
              Remember Me
            </label>
          </div>
        </form>
        <div className="mt-4 grid w-full gap-4 text-sm font-bold sm:grid-cols-2">
          <a href="/help" className="text-white">
            Lost your password?
          </a>
          <a href="/" className="text-right text-white">
            &larr; Go to Nairobi Models
          </a>
        </div>
        <a href="/privacy-policy" className="mt-4 text-sm text-[#ff1493]">
          Privacy Policy
        </a>
      </section>
    </main>
  );
}
