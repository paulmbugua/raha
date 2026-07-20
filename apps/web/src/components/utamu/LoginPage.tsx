'use client';

import { Eye } from 'lucide-react';
import { useState } from 'react';
import { utamuApi } from '../../lib/utamuApi';

const SESSION_KEY = 'utamu.session';

function safeLoginLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    const [local, domain] = trimmed.split('@');
    return (local.length > 2 ? local.slice(0, 2) + '***' + local.slice(-1) : local[0] + '*') + '@' + domain;
  }
  return trimmed.length > 3 ? trimmed.slice(0, 2) + '***' + trimmed.slice(-1) : trimmed[0] + '**';
}

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [debug, setDebug] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setDebug('');
    const trimmedLogin = login.trim();
    if (!trimmedLogin || !password) {
      setMessage('Enter your email or username and password.');
      return;
    }
    setSubmitting(true);
    const startedAt = Date.now();
    console.info('[secret-nairobi:login] submit_started', { login: safeLoginLabel(trimmedLogin), hasPassword: Boolean(password) });
    try {
      const result: any = await utamuApi.loginAccount({ login: trimmedLogin, email: trimmedLogin, username: trimmedLogin, password });
      console.info('[secret-nairobi:login] submit_success', { login: safeLoginLabel(trimmedLogin), userId: result?.user?.id || null, accountType: result?.user?.accountType || null, elapsedMs: Date.now() - startedAt });
      if (!result?.token) throw new Error('Login succeeded but no session token was returned.');
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ token: result.token, user: result.user || null }));
      window.location.href = '/escort/profile';
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      console.warn('[secret-nairobi:login] submit_failed', { login: safeLoginLabel(trimmedLogin), message: nextMessage, elapsedMs: Date.now() - startedAt });
      setMessage(nextMessage);
      setDebug('Check the backend console for [utamu:login] using masked login ' + safeLoginLabel(trimmedLogin) + '.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#2b0a3d] px-5 py-8 font-serif text-white">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[560px] flex-col items-center">
        <a href="/" className="mb-9 font-serif text-6xl font-bold italic leading-none tracking-tight text-white [text-shadow:0_3px_0_#8b6a9b] md:text-7xl">Secret Nairobi</a>
        <form onSubmit={handleSubmit} className="w-full rounded-[4px] bg-white px-6 py-7 text-[#003b5c] shadow-xl shadow-black/25">
          <label className="block text-base font-normal" htmlFor="login-username">Username or Email Address</label>
          <input id="login-username" name="username" value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" className="mt-2 h-11 w-full rounded-[3px] border border-[#ff1493] px-3 text-lg text-[#111] outline-none focus:border-[#ff1493] focus:ring-2 focus:ring-[#ff1493]/20" />
          <label className="mt-5 block text-base font-normal" htmlFor="login-password">Password</label>
          <div className="relative mt-2">
            <input id="login-password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="h-11 w-full rounded-[3px] border border-[#ff3fd0] px-3 pr-12 text-lg text-[#111] outline-none focus:border-[#ff1493] focus:ring-2 focus:ring-[#ff1493]/20" />
            <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1683c7]"><Eye className="h-5 w-5" /></button>
          </div>
          {message && <div className="mt-4 rounded-[3px] bg-[#d70032] p-3 text-sm font-bold text-white">{message}</div>}
          {debug && <p className="mt-2 text-xs leading-5 text-[#7b6e78]">{debug}</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
            <button disabled={submitting} type="submit" className="rounded-full bg-gradient-to-b from-[#ff58bf] to-[#e60073] px-7 py-3 text-base font-bold text-white shadow-sm disabled:opacity-60">{submitting ? 'Checking...' : 'Log In'}</button>
            <label className="justify-self-start text-right text-base text-[#003b5c] sm:justify-self-end"><input type="checkbox" name="remember" className="mb-2 block h-4 w-4 rounded border-[#999] sm:ml-auto" />Remember Me</label>
          </div>
        </form>
        <div className="mt-4 grid w-full gap-4 text-sm font-bold sm:grid-cols-2"><a href="/help" className="text-white">Lost your password?</a><a href="/" className="text-right text-white">&larr; Go to Nairobi Escorts</a></div>
        <a href="/privacy-policy" className="mt-4 text-sm text-[#ff1493]">Privacy Policy</a>
      </section>
    </main>
  );
}
