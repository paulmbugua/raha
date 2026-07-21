'use client';

import { Bell, Check, ChevronRight, FileCheck2, Gauge, Lock, Mail, MessageCircle, Search, ShieldCheck, Star, Upload, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { UtamuModel } from '../../data/utamu';
import { cities } from '../../data/utamu';
import { utamuApi } from '../../lib/utamuApi';
import { useUtamuDirectory } from '../../hooks/useUtamuDirectory';

type UtamuAppProps = { slug?: string[] };

type UtamuSession = { token: string; user: { id?: string; username?: string; email?: string; phone?: string; fullName?: string; accountType?: string; emailVerified?: boolean } | null };
type View = 'home' | 'advancedSearch' | 'register' | 'registration' | 'confirm' | 'profile' | 'dashboard' | 'messages' | 'monetization' | 'clientPortal' | 'verification' | 'checkout' | 'review' | 'admin' | 'notification';

const SESSION_KEY = 'utamu.session';
const PENDING_REGISTRATION_KEY = 'utamu.pendingRegistration';

function readSession(): UtamuSession | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
}

function saveSession(session: UtamuSession) {
  if (typeof window !== 'undefined') window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY);
}


const routeLinks = [
  '/',
  '/discover',
  '/advanced-search',
  '/register',
  '/register/independent-model',
  '/register/agency',
  '/register/member',
  '/register/confirm-email',
  '/messages',
  '/monetization',
  '/client-portal',
  '/escort/profile',
  '/escort/dashboard',
  '/escort/dashboard-pending-verification',
  '/verification/step-1',
  '/verification/submitted',
  '/verification/rejected',
  '/verification/re-apply',
  '/verification/resubmission-success',
  '/checkout/mpesa',
  '/reviews/ratings',
  '/notifications/rejection-alert',
  '/admin/verification-review',
  '/admin/analytics',
];

function viewFor(slug?: string[]): View {
  const path = slug?.join('/') || '';
  if (!path || path === 'discover') return 'home';
  if (path === 'advanced-search') return 'advancedSearch';
  if (path === 'register') return 'register';
  if (path === 'register/confirm-email' || path === 'register/complete') return 'confirm';
  if (path.startsWith('register/')) return 'registration';
  if (path === 'messages') return 'messages';
  if (path === 'monetization') return 'monetization';
  if (path === 'client-portal') return 'clientPortal';
  if (['model/profile', 'escort/profile', 'edit-profile', 'change-password', 'verify-account', 'blacklisted-clients', 'logout'].includes(path)) return 'dashboard';
  if (path.startsWith('admin')) return 'admin';
  if (path.startsWith('checkout')) return 'checkout';
  if (path.startsWith('reviews')) return 'review';
  if (path.startsWith('notifications')) return 'notification';
  if (path.startsWith('verification')) return 'verification';
  if (path.includes('dashboard')) return 'dashboard';
  if (path.startsWith('model') || path.startsWith('escort')) return 'profile';
  return 'home';
}

function kes(value: number) {
  return `Ksh ${value.toLocaleString('en-KE')}`;
}

function StatusBadge({ children, tone = 'gold' }: { children: React.ReactNode; tone?: 'gold' | 'green' | 'red' | 'muted' }) {
  const tones = {
    gold: 'border-[#ffd700]/30 bg-[#ffd700]/10 text-[#ffe16d]',
    green: 'border-[#61f595]/30 bg-[#61f595]/10 text-[#6bfe9c]',
    red: 'border-[#ffb4ab]/30 bg-[#93000a]/40 text-[#ffdad6]',
    muted: 'border-[#4d4732] bg-[#201f1f] text-[#d0c6ab]',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-semibold ${tones[tone]}`}>{children}</span>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UtamuSession | null>(null);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const next = readSession();
    setSession(next);
    if (next?.token) utamuApi.getNotifications(next.token).then((data: any) => setUnread(Number(data.unreadMessages || 0)));
  }, []);
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070707] font-serif text-[#21102b] selection:bg-[#e60073] selection:text-white">
      <div className="mx-auto w-full max-w-[1180px] bg-[#fff7fb] shadow-2xl shadow-black/50 ring-1 ring-[#f0b323]/20">
        <header className="border-t-4 border-[#f0b323] bg-gradient-to-r from-[#170421] via-[#2b0a3d] to-[#063b2c] text-white shadow-lg shadow-black/30">
          <div className="flex min-h-[72px] flex-col items-stretch gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <a href="/" className="text-center font-serif text-3xl font-bold italic leading-none tracking-tight text-white [text-shadow:0_2px_0_#7f6a90,0_0_22px_rgba(240,179,35,.22)] sm:text-4xl lg:text-left lg:text-5xl">Secret Nairobi</a>
            <nav className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold sm:text-sm lg:flex-1 lg:justify-start">
              <a href="/" className="rounded-full bg-gradient-to-r from-[#e60073] to-[#ff57b8] px-3 py-2 text-white shadow-sm shadow-[#e60073]/30 ring-1 ring-white/15 sm:px-4">All Nairobi Escorts</a>
              <a href="/admin/verification-review" className="hover:text-[#f0b323]">Agencies</a>
              <a href="/reviews/ratings" className="hover:text-[#f0b323]">Reviews</a>
              <a href="/register" className="uppercase hover:text-[#f0b323]">Advertise here</a>
            </nav>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold sm:text-sm lg:justify-end">
              {!session && <a href="/register" className="rounded-full bg-gradient-to-r from-[#e60073] to-[#ff57b8] px-3 py-2 shadow-sm shadow-[#e60073]/30">Register</a>}
              {!session ? <a href="/login" className="rounded-full bg-gradient-to-r from-[#e60073] to-[#ff57b8] px-3 py-2 shadow-sm shadow-[#e60073]/30">Login</a> : <a href="/escort/dashboard" className="rounded-full bg-gradient-to-r from-[#006b3f] to-[#10a66a] px-3 py-2 shadow-sm shadow-[#006b3f]/30">My Account</a>}
              <form action="/discover" className="flex items-center overflow-hidden rounded-full bg-white/10">
                <input name="query" aria-label="Search escorts" placeholder="Search" className="h-8 w-24 bg-transparent px-3 text-xs text-white outline-none placeholder:text-white/70 sm:w-36" />
                <button className="grid h-8 w-8 place-items-center" type="submit"><Search className="h-4 w-4" /></button>
              </form>
              <a href="/messages" className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"><Mail className="h-5 w-5" />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#e60073] px-1 text-[10px]">{unread}</span>}</a>
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}


function buildSearchUrl(params: Record<string, string | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === false || value === '' || value === 'All') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `/discover?${query}` : '/discover';
}

function QuickSearchPanel({ spacerClass = 'hidden min-h-[760px] bg-[#101010] lg:block' }: { spacerClass?: string }) {
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [gender, setGender] = useState('All');
  const [listing, setListing] = useState('All');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('query') || '');
    setGender(params.get('gender') || 'All');
    setListing(params.get('listing') || (params.get('vip') === 'true' ? 'VIP' : params.get('verified') === 'true' ? 'Trusted' : 'All'));
  }, []);
  const listingOptions = [
    { label: 'All escorts', value: 'All' },
    { label: 'Only VIP', value: 'VIP' },
    { label: 'Only independent', value: 'Independent' },
    { label: 'Trusted badge', value: 'Trusted' },
  ];
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (typeof window !== 'undefined') {
      window.location.href = buildSearchUrl({ query, country, gender, listing, vip: listing === 'VIP', verified: listing === 'Trusted' });
    }
  }
  return (
    <aside className="bg-[#101010] text-white">
      <form onSubmit={submit} className="bg-gradient-to-b from-[#e60073] via-[#cf0065] to-[#3b0d42] px-4 py-5 shadow-inner">
        <h2 className="mb-3 text-base font-bold">Quick Search:</h2>
        <div className="space-y-3 text-sm">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, area, service" className="w-full rounded-[3px] border border-white bg-white px-2 py-2 text-[#35213f] outline-none focus:ring-2 focus:ring-[#f0b323]" />
          <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-[3px] border border-white bg-white px-2 py-2 text-[#35213f] outline-none focus:ring-2 focus:ring-[#f0b323]">
            <option>Kenya</option>
          </select>
          <select value={gender} onChange={(event) => setGender(event.target.value)} className="w-full rounded-[3px] border border-white bg-white px-2 py-2 text-[#35213f] outline-none focus:ring-2 focus:ring-[#f0b323]">
            <option value="All">Any gender</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>
          <div className="space-y-2">
            {listingOptions.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 font-semibold">
                <input type="radio" name="quick-listing" value={option.value} checked={listing === option.value} onChange={() => setListing(option.value)} className="h-4 w-4 accent-[#f0b323]" />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
          <div className="text-center"><button className="rounded-full bg-white px-7 py-2 font-bold text-[#e60073] shadow-sm transition hover:bg-[#f0b323] hover:text-[#2b0a3d]">Search</button></div>
          <a href="/advanced-search" className="block text-center font-semibold text-[#ffe4f3] hover:text-white"><Search className="mr-1 inline h-3.5 w-3.5" />Advanced search</a>
        </div>
      </form>
      <div className={spacerClass} />
    </aside>
  );
}

function ModelCard({ model, index = 0 }: { model: UtamuModel; index?: number }) {
  const verified = Boolean(model.verified || model.trustedBadge);
  const isVip = Boolean(model.elite || model.listingTier === 'vip');
  const isNew = Boolean((model as UtamuModel & { isNew?: boolean }).isNew);
  return (
    <a href={`/escort/${model.slug}`} className="group relative block overflow-hidden rounded-[3px] border border-[#f0b323]/70 bg-white shadow-md shadow-[#2b0a3d]/10 ring-1 ring-[#e60073]/10">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={model.image} alt={`${model.name} Nairobi escort profile`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        {isVip && <div className="absolute right-[-34px] top-3 rotate-45 bg-gradient-to-r from-[#ff8a00] to-[#ffbd00] px-9 py-1 text-[10px] font-bold uppercase text-white shadow">VIP</div>}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between bg-gradient-to-r from-[#2b0a3d]/85 via-[#e60073]/75 to-[#006b3f]/80 px-2 py-1 text-white">
          <span className="truncate text-center text-base font-normal">{model.name.replace(' W.', '').replace(' K.', '').replace(' M.', '').replace(' A.', '')}</span>
          <span className="flex shrink-0 gap-1">
            {isNew && <span className="rounded-sm bg-[#ff3bbd] px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none">New</span>}
            <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none ${verified ? 'bg-[#18c26a]' : 'bg-[#ff2336]'}`}>{verified ? 'Verified' : 'Unverified'}</span>
          </span>
        </div>
      </div>
    </a>
  );
}

function DiscoveryHome() {
  const { filteredModels, filters, actions } = useUtamuDirectory();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    actions.applySearchParams(params);
  }, []);
  const hasActiveFilters = Boolean(filters.query || filters.city !== 'All' || filters.category !== 'All' || filters.gender !== 'All' || filters.listingType !== 'All' || filters.service !== 'All' || filters.minPrice || filters.maxPrice || filters.verifiedOnly || filters.eliteOnly);
  const sortedHomeModels = filteredModels.slice().sort((a, b) => Number(b.elite) - Number(a.elite) || b.rating - a.rating || b.reviews - a.reviews);
  const directoryModels = sortedHomeModels;

  return (
    <>
      <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
        <section className="bg-[#fff7fb] px-4 py-5 md:px-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-normal text-[#3b164b]">All escorts</h1>
            <div className="flex flex-wrap gap-2 text-sm">
              {[
                { label: 'Female', href: '/discover?gender=Female' },
                { label: 'Independent', href: '/discover?listing=Independent' },
                { label: 'VIP', href: '/discover?listing=VIP&vip=true' },
                { label: 'New', href: '/discover?query=new' },
              ].map((item) => <a key={item.label} href={item.href} className="rounded-full border border-[#f0b323]/40 bg-white px-4 py-2 text-[#e60073] shadow-sm hover:border-[#006b3f]/50 hover:text-[#006b3f]">{item.label}</a>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {directoryModels.map((model, index) => <ModelCard key={model.id} model={model} index={index} />)}
          </div>
          {directoryModels.length === 0 && <div className="mt-6 rounded-[4px] border border-[#ffd1e8] bg-white p-6 text-center text-sm font-semibold text-[#3b164b]">No real escort profiles are available for those filters yet.</div>}

        </section>
        <QuickSearchPanel />
      </div>
      <section className="border-t-4 border-[#006b3f] bg-[#fff7fb] px-4 py-7 text-[#111] md:px-5">
        <h2 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl">Secret Nairobi Escorts - Nairobi's Premium Companion Directory</h2>
        <p className="mb-3 text-[15px] leading-7">Across Nairobi, adults need a discreet and organized way to discover verified escorts with polished presentation, clear communication, and reliable profile details. Secret Nairobi Escorts gives members a simple way to browse listings, compare styles, review availability, and connect with companions suited for private bookings, hospitality, travel-ready arrangements, and premium social experiences.</p>
        <p className="mb-3 text-[15px] leading-7">Our directory focuses on elegant presentation, quick discovery, and visible trust signals. You can explore independent escorts, VIP profiles, new listings, and verified members from one place, with Nairobi neighborhoods and Kenyan payment flows designed into the experience.</p>
        <h3 className="mb-2 text-2xl font-bold">We Serve The Best Escort Directory Experience In Kenya</h3>
        <p className="text-[15px] leading-7">At Secret Nairobi, listed escorts are presented with clear photos, verification labels, review flows, and profile details so adults can make informed choices. Whether you prefer VIP visibility, independent listings, agency-managed profiles, or discreet Nairobi bookings, the goal is to make discovery fast, attractive, and easy to navigate.</p>
      </section>
      <footer className="bg-gradient-to-r from-[#170421] via-[#2b0a3d] to-[#063b2c] px-5 py-5 text-center text-sm text-white">
        <div className="mb-2 font-serif text-3xl font-bold italic">Secret Nairobi</div>
        <div className="flex flex-wrap justify-center gap-4 font-bold text-[#ffb7df]"><a href="/">All Nairobi Escorts</a><a href="/admin/verification-review">Agencies</a><a href="/reviews/ratings">Reviews</a><a href="/register">Advertise here</a></div>
      </footer>
    </>
  );
}


function RegisterScreen() {
  const plans = [
    {
      title: 'Register as Independent Escort',
      price: 'Free',
      cta: 'Register here',
      ctaHref: '/register/independent-model',
      features: ['Add a single profile', 'Add portfolio pictures', 'Add contact information', 'Manage blocked clients', 'Profile analytics and messages'],
      vipFeature: 'Upgrade to VIP visibility',
      highlight: 'Ksh 5 for 1 month',
    },
    {
      title: 'Register as Agency',
      price: 'Ksh 5 for 1 month',
      cta: 'Register here',
      ctaHref: '/register/agency',
      features: ['Add multiple profiles', 'Add profile pictures', 'Add contact information', 'Add internal notes', 'Manage verification workflow'],
      vipFeature: 'Upgrade agency listings to VIP',
      highlight: 'Ksh 5 for 1 month',
    },
    {
      title: 'Register as Normal User',
      price: 'Free',
      cta: 'Register here',
      ctaHref: '/register/member',
      features: ['Mark favorite profiles', 'See profile photos', 'Contact verified escorts', 'Add reviews to escorts you rate', 'Save Nairobi searches', 'Receive profile updates'],
    },
  ];
  const infoBlocks = [
    {
      title: 'Why Choose Our Escorts In Nairobi?',
      body: 'Secret Nairobi makes escort discovery direct, attractive, and organized. Members can compare verified profiles, browse images, review availability signals, and choose companions suited for discreet Nairobi bookings, hospitality, travel, and premium social time.',
    },
    {
      title: 'The Gratifying Professional Services',
      body: 'Every profile flow is built around presentation quality and trust. Independent escorts can manage their own listing, agencies can coordinate multiple profiles, and members get a familiar directory experience with clear account paths and visible verification cues.',
    },
    {
      title: 'Affordable Escorts Make Life Enjoyable',
      body: 'The platform keeps discovery simple for adults. Free user accounts support favorites and reviews, while escort and agency accounts can upgrade visibility through VIP placement when they need stronger exposure in the Nairobi directory.',
    },
  ];

  return (
    <>
      <section className="bg-[#101010] px-4 pb-6 pt-2 text-[#222] md:px-5">
        <h1 className="text-center text-3xl font-normal leading-tight text-white md:text-4xl">Create an Account</h1>
        <div className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 lg:py-10">
          {plans.map((plan) => (
            <article key={plan.title} className="overflow-hidden rounded-[3px] bg-white shadow-lg shadow-black/30">
              <h2 className="bg-gradient-to-b from-[#ff4fbd] to-[#e60073] px-3 py-3 text-sm font-bold text-white">{plan.title}</h2>
              <div className="p-5">
                <ul className="space-y-3 text-sm text-[#8a8a8a]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#168eea]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.vipFeature && <div className="mt-4 rounded-[3px] border border-[#ffb100] bg-[#fff8df] p-3 text-[#3b164b]"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-bold">{plan.vipFeature}</span>{plan.highlight && <span className="rounded-full bg-[#1fbfa5] px-3 py-1 text-xs font-bold text-white">{plan.highlight}</span>}</div><a href="/checkout/mpesa" className="mt-3 inline-flex rounded-full bg-[#e60073] px-4 py-2 text-xs font-bold text-white">Upgrade after registration</a></div>}
                <div className="mt-6 border-t border-[#eeeeee] pt-4">
                  <p className="mb-4 text-2xl font-normal text-[#555]">{plan.price}</p>
                  <a href={plan.ctaHref} className="inline-flex items-center gap-2 rounded-[3px] bg-[#23b86b] px-5 py-3 text-sm font-bold text-white hover:bg-[#1fa461]">{plan.cta}<ChevronRight className="h-4 w-4" /></a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#fff0f6] px-4 py-10 text-[#111] md:px-5">
        <div className="grid gap-8 md:grid-cols-3">
          {infoBlocks.map((block) => (
            <article key={block.title}>
              <h2 className="mb-4 text-base font-bold text-[#9b9098]">{block.title}</h2>
              <p className="text-[14px] leading-7">{block.body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#fff0f6] px-4 pb-8 text-center text-[13px] leading-6 text-[#b3a7af] md:px-5">
        <p>This platform is intended for adults creating or browsing professional escort profiles. By entering, you confirm that you will use the site responsibly, respect listed members, and follow all applicable booking, privacy, and platform safety rules.</p>
        <div className="mt-5 font-bold text-[#2b0a3d]">ADULTS only or <a href="/" className="text-[#e60073]">LEAVE THE SITE NOW!</a></div>
      </section>
      <footer className="bg-[#fff0f6] px-4 pb-5 text-center text-xs text-[#e60073] md:px-5">
        <div className="mb-4 flex flex-wrap justify-center gap-2"><a href="/">Secret Nairobi</a><span>-</span><a href="/login">Login</a><span>-</span><a href="/register">Register</a><span>-</span><a href="/privacy-policy">Privacy Policy</a><span>-</span><a href="/terms">Terms and Conditions</a><span>-</span><a href="/help">Contact</a><span>-</span><a href="/sitemap.xml">Sitemap</a></div>
        <div className="-mx-4 bg-[#101010] py-2 text-white md:-mx-5">(c) 2026 SecretNairobi.com - Escorts in Nairobi</div>
      </footer>
    </>
  );
}


function RegistrationQuickSearch() {
  return <QuickSearchPanel spacerClass="min-h-full bg-[#101010]" />;
}

function RegistrationFooter() {
  return (
    <>
      <section className="border-t-4 border-[#f0b323]/70 bg-[#fff7fb] px-5 py-16 text-[#111] md:py-20">
        <div className="grid gap-10 md:grid-cols-3">
          <article><h2 className="mb-5 text-xl font-bold text-[#9b9098]">Why Choose Our Escorts In Nairobi?</h2><p className="text-[15px] leading-8">Secret Nairobi makes registration clear for escorts, agencies, and members. Every account path is organized around profile quality, communication, verification, and discreet discovery.</p></article>
          <article><h2 className="mb-5 text-xl font-bold text-[#9b9098]">The Gratifying Professional Services</h2><p className="text-[15px] leading-8">Independent escorts can prepare a complete public profile, agencies can coordinate multiple listings, and members can create lightweight accounts for favorites, reviews, and saved browsing.</p></article>
          <article><h2 className="mb-5 text-xl font-bold text-[#9b9098]">Affordable Escorts Make Life Enjoyable</h2><p className="text-[15px] leading-8">The platform keeps Nairobi discovery simple while giving premium accounts stronger visibility through VIP placement, profile completeness, and trusted account signals.</p></article>
        </div>
        <p className="mx-auto mt-12 max-w-5xl text-center text-[14px] leading-7 text-[#b3a7af]">This platform is intended for adults creating or browsing professional escort profiles. By entering, you confirm that you will use the site responsibly, respect listed members, and follow all applicable booking, privacy, and platform safety rules.</p>
        <div className="mt-6 text-center font-bold text-[#2b0a3d]">ADULTS only or <a href="/" className="text-[#e60073]">LEAVE THE SITE NOW!</a></div>
        <div className="mt-10 flex flex-wrap justify-center gap-2 text-center text-xs text-[#e60073]"><a href="/">Secret Nairobi</a><span>-</span><a href="/login">Login</a><span>-</span><a href="/register">Register</a><span>-</span><a href="/privacy-policy">Privacy Policy</a><span>-</span><a href="/terms">Terms and Conditions</a><span>-</span><a href="/help">Contact</a><span>-</span><a href="/sitemap.xml">Sitemap</a></div>
      </section>
      <footer className="bg-[#070707] px-5 py-3 text-center text-xs font-bold text-white ring-1 ring-[#f0b323]/20">(c) 2026 SecretNairobi.com - Escorts in Nairobi</footer>
    </>
  );
}

function FormRow({ label, hint, required = false, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 lg:grid-cols-[minmax(160px,260px)_1fr] lg:items-start">
      <label className="text-sm font-normal text-[#00627c]">{label}{required && <span className="text-[#ff1493]">*</span>}{hint && <span className="mt-1 block text-xs text-[#a99aa5]">{hint}</span>}</label>
      <div>{children}</div>
    </div>
  );
}

const fieldClass = 'min-h-10 w-full min-w-0 border border-[#ff55c7] bg-white px-2 text-sm text-[#111] outline-none focus:ring-2 focus:ring-[#ff55c7]/20';
const selectClass = 'min-h-10 min-w-0 border border-[#ff55c7] bg-white px-2 text-sm text-[#59606a] outline-none';
const checkboxCardClass = 'flex min-h-9 cursor-pointer items-center gap-2 rounded-[3px] border border-[#ffd0e8] bg-white/80 px-3 py-2 text-sm text-[#003b5c] transition hover:border-[#ff55c7] hover:bg-white';
const serviceTileBaseClass = 'flex min-h-12 cursor-pointer items-center gap-3 rounded-[4px] border px-3 py-3 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-[#ff55c7]/30 sm:px-4';
const serviceTileSelectedClass = 'border-[#e60073] bg-[#e60073] text-white shadow-sm';
const serviceTileIdleClass = 'border-[#ffbad9] bg-white/85 text-[#003b5c] hover:border-[#e60073] hover:bg-[#fff8fc]';
const kenyanTowns = [
  'Nairobi', 'Westlands', 'Karen', 'Kilimani', 'Runda', 'Kitengela', 'Ruiru', 'Thika', 'Kiambu', 'Kikuyu',
  'Ngong', 'Athi River', 'Machakos', 'Mombasa', 'Diani', 'Kilifi', 'Malindi', 'Watamu', 'Lamu', 'Voi',
  'Nakuru', 'Naivasha', 'Nanyuki', 'Nyeri', 'Eldoret', 'Kisumu', 'Kakamega', 'Kisii', 'Kericho', 'Bomet',
  'Narok', 'Meru', 'Embu', 'Isiolo', 'Garissa', 'Wajir', 'Marsabit', 'Bungoma', 'Busia', 'Homa Bay',
  'Migori', 'Kitale', 'Lodwar', 'Mandera'
];
const birthYears = Array.from({ length: 49 }, (_, index) => 2008 - index);
const birthMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const birthDays = Array.from({ length: 31 }, (_, index) => index + 1);
const kenyanEthnicities = ['Kikuyu', 'Luhya', 'Kalenjin', 'Luo', 'Kamba', 'Somali', 'Kisii', 'Mijikenda', 'Meru', 'Maasai', 'Turkana', 'Teso', 'Embu', 'Taita', 'Taveta', 'Kuria', 'Samburu', 'Borana', 'Swahili', 'Orma', 'Rendille', 'El Molo', 'Ogiek', 'Suba', 'Pokot', 'Nandi', 'Marakwet', 'Keiyo', 'Tugen', 'Ilchamus', 'Tharaka', 'Mbeere', 'Gabra', 'Bajuni', 'Boni', 'Prefer not to say'];
const hairColors = ['Black', 'Dark brown', 'Brown', 'Light brown', 'Blonde', 'Auburn', 'Red', 'Grey', 'Dyed / fashion color', 'Prefer not to say'];
const hairLengths = ['Shaved', 'Short', 'Shoulder length', 'Medium', 'Long', 'Very long', 'Braids / locs', 'Wig / varies', 'Prefer not to say'];
const bustSizes = ['Petite', 'Small', 'Medium', 'Full', 'Large', 'Very large', 'Prefer not to say'];
const buildOptions = ['Petite', 'Slim', 'Athletic', 'Toned', 'Average', 'Curvy', 'Full figured', 'Tall', 'Prefer not to say'];
const lookOptions = ['Natural', 'Elegant', 'Glamorous', 'Sporty', 'Corporate', 'Fashion-forward', 'Classic', 'Runway', 'Commercial', 'Luxury'];
const heightOptions = Array.from({ length: 46 }, (_, index) => 145 + index);
const weightOptions = Array.from({ length: 36 }, (_, index) => 40 + index * 2);
const smokerOptions = ['No', 'Occasionally', 'Yes', 'Prefer not to say'];
const orientationOptions = ['Fashion and runway', 'Commercial modeling', 'Beauty and skincare', 'Lifestyle content', 'Event hosting', 'Hospitality presentation', 'Brand ambassador', 'Portfolio shoots', 'Editorial campaigns', 'Promotional campaigns'];
const spokenLanguages = ['English', 'Kiswahili', 'Kikuyu', 'Luhya', 'Luo', 'Kalenjin', 'Kamba', 'Somali', 'Kisii', 'Meru', 'Maasai', 'Arabic', 'French', 'German', 'Spanish', 'Chinese'];
const languageLevels = ['Basic', 'Conversational', 'Fluent', 'Native'];
const modelServices = ['Portfolio shoots', 'Brand launches', 'Hospitality hosting', 'Fashion campaigns', 'Beauty content', 'Runway presentation', 'Lifestyle production', 'Commercial creator work', 'Event appearance', 'Travel-ready bookings', 'VIP visibility', 'Agency management'];


function AdvancedSearchScreen() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All');
  const [gender, setGender] = useState('All');
  const [listing, setListing] = useState('All');
  const [service, setService] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [verified, setVerified] = useState(false);
  const townOptions = cities.filter((item) => item !== 'All');
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (typeof window !== 'undefined') {
      window.location.href = buildSearchUrl({ query, city, gender, listing, service, minPrice, maxPrice, verified, vip: listing === 'VIP' });
    }
  }
  return (
    <div className="grid gap-0 bg-[#fff0f6] lg:grid-cols-[1fr_220px]">
      <section className="px-4 py-8 text-[#003b5c] md:px-6 lg:py-10">
        <div className="mb-6 max-w-3xl">
          <h1 className="text-3xl font-bold text-[#3b164b]">Advanced Search</h1>
          <p className="mt-2 text-sm leading-6 text-[#7b6e78]">Refine Nairobi escort discovery by gender, city, verification, services, and budget.</p>
        </div>
        <form onSubmit={submit} className="max-w-5xl rounded-[4px] border border-[#ffd1e8] bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">Keyword<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, area, service" className={fieldClass + ' mt-2'} /></label>
            <label className="text-sm font-semibold">City<select value={city} onChange={(event) => setCity(event.target.value)} className={selectClass + ' mt-2 w-full'}><option value="All">All Kenya</option>{townOptions.map((town) => <option key={town}>{town}</option>)}</select></label>
            <label className="text-sm font-semibold">Gender<select value={gender} onChange={(event) => setGender(event.target.value)} className={selectClass + ' mt-2 w-full'}><option value="All">Any gender</option><option>Female</option><option>Male</option></select></label>
            <label className="text-sm font-semibold">Service<select value={service} onChange={(event) => setService(event.target.value)} className={selectClass + ' mt-2 w-full'}><option value="All">All services</option>{modelServices.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">Minimum budget<input inputMode="numeric" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Ksh" className={fieldClass + ' mt-2'} /></label>
            <label className="text-sm font-semibold">Maximum budget<input inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Ksh" className={fieldClass + ' mt-2'} /></label>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['All', 'All escorts'],
              ['VIP', 'Only VIP'],
              ['Independent', 'Only independent'],
              ['Trusted', 'Trusted badge'],
            ].map(([value, label]) => (
              <label key={value} className={'flex cursor-pointer items-center gap-3 rounded-[4px] border px-4 py-3 text-sm font-bold transition ' + (listing === value ? 'border-[#e60073] bg-[#ffe3f1] text-[#e60073]' : 'border-[#ffd1e8] bg-[#fff7fb] text-[#3b164b]')}>
                <input type="radio" name="advanced-listing" checked={listing === value} onChange={() => setListing(value)} className="h-4 w-4 accent-[#e60073]" />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-[4px] border border-[#ffd1e8] bg-[#fff7fb] px-4 py-3 text-sm font-bold text-[#3b164b]">
            <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="h-4 w-4 accent-[#006b3f]" />
            <span>Verified profiles only</span>
          </label>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-full bg-gradient-to-b from-[#ff58bf] to-[#e60073] px-8 py-3 font-bold text-white shadow-sm">Search escorts</button>
            <a href="/discover" className="rounded-full border border-[#e60073] px-8 py-3 font-bold text-[#e60073]">Reset</a>
          </div>
        </form>
      </section>
      <RegistrationQuickSearch />
    </div>
  );
}

function RegistrationFormScreen({ path }: { path: string }) {
  const kind = path.split('/')[1] || 'member';
  const isIndependent = kind === 'independent-model';
  const isAgency = kind === 'agency';
  const isMember = kind === 'member';
  const title = isIndependent ? 'Independent Escort Registration' : isAgency ? 'Register as Agency' : 'Member Registration';
  const formMinHeight = isIndependent ? 'lg:min-h-[2080px]' : isAgency ? 'lg:min-h-[980px]' : 'lg:min-h-[720px]';
  const services = modelServices;
  const agencyServices = ['Independent escort management', 'Portfolio coordination', 'Client vetting', 'Campaign staffing', 'Event staffing', 'Verification support', 'Image review', 'Booking calendar', 'VIP placement', 'Multi-city coverage', 'Escort onboarding', 'Brand partnerships'];
  const memberPreferences = ['Save favorite profiles', 'Compare escort profiles', 'Request booking details', 'Follow verified escorts', 'Review completed bookings', 'Receive availability updates', 'Browse VIP profiles', 'Contact agencies'];
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [registrationError, setRegistrationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const allServicesSelected = selectedServices.length === services.length;
  const toggleService = (service: string) => setSelectedServices((current) => current.includes(service) ? current.filter((item) => item !== service) : [...current, service]);
  const toggleAllServices = () => setSelectedServices(allServicesSelected ? [] : services);
  const toggleAvailability = (item: string) => setSelectedAvailability((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);

  async function handleRegistrationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegistrationError('');
    if (isIndependent && selectedAvailability.length === 0) {
      setRegistrationError('Please select at least one availability option.');
      return;
    }
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    const payload = { ...values, accountType: kind, services: isIndependent ? selectedServices : isAgency ? agencyServices.filter((item) => formData.getAll('agencyServices').includes(item)) : [], availability: selectedAvailability, preferences: formData.getAll('preferences'), profile: values };
    try {
      const result = await utamuApi.registerAccount(payload);
      if (!(result as any).registrationComplete) {
        setRegistrationError('Registration could not be completed. Please check your details and try again.');
        return;
      }
      setRegistrationResult(result);
      window.localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(result));
      window.history.pushState({}, '', '/register/confirm-email');
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Registration request failed. Confirm the backend is running on http://localhost:4008.');
    } finally {
      setSubmitting(false);
    }
  }

  if (registrationResult) return <ConfirmEmailScreen pending={registrationResult} />;

  return (
    <>
      <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
        <section className={'min-w-0 bg-[#fff0f6] px-4 py-5 text-[#003b5c] sm:px-5 ' + formMinHeight}>
          <h1 className="text-2xl font-normal text-[#3b164b]">{title}</h1>
          {isMember && <div className="mt-5 bg-[#d70032] py-2 text-center text-sm font-bold text-white">Escorts should register here</div>}
          <p className="mt-4 text-xs">Fields marked with <span className="font-bold text-[#ff1493]">*</span> are mandatory</p>
          <form className="mt-7 space-y-6" onSubmit={handleRegistrationSubmit}>
            <FormRow label="Username" hint="Between 4 and 30 characters" required><input name="username" className={fieldClass} /></FormRow>
            <FormRow label="Password" hint="Must be between 6 and 50 characters" required><input name="password" type="password" className={fieldClass} /></FormRow>
            {!isMember && <FormRow label={isAgency ? 'Email' : 'Your email'} required><input name="email" type="email" className={fieldClass} /></FormRow>}
            {isMember && <FormRow label="Name" hint="will be publicly shown" required><input name="name" className={fieldClass} /></FormRow>}
            {isMember && <FormRow label="Email" required><input name="email" type="email" className={fieldClass} /></FormRow>}
            {isMember && <FormRow label="City"><select className={selectClass + ' w-full'}>{kenyanTowns.map((town) => <option key={town}>{town}</option>)}</select></FormRow>}
            {isMember && <FormRow label="Browsing interest"><select className={selectClass + ' w-full'}><option>Verified Nairobi escorts</option><option>VIP escorts</option><option>Agency represented escorts</option><option>Discreet Nairobi companions</option></select></FormRow>}
            {isMember && <FormRow label="Member preferences"><div className="grid gap-2 md:grid-cols-2">{memberPreferences.map((item) => <label key={item} className={checkboxCardClass}><input name="preferences" value={item} type="checkbox" /> {item}</label>)}</div></FormRow>}
            {isIndependent && <FormRow label="Name" hint="will be publicly shown" required><input name="name" className={fieldClass} /></FormRow>}
            {isAgency && <FormRow label="Agency Name" required><input name="agencyName" className={fieldClass} /></FormRow>}
            {!isMember && <FormRow label="Phone" required><input name="phone" className={fieldClass} /></FormRow>}
            {!isMember && <FormRow label="Website"><input name="website" className={fieldClass} /></FormRow>}
            {!isMember && <FormRow label="Country" required><select name="country" className={selectClass}><option>Kenya</option></select></FormRow>}
            {!isMember && <FormRow label="City" required><select name="city" className={selectClass + ' w-full'}>{kenyanTowns.map((town) => <option key={town}>{town}</option>)}</select><span className="mt-1 block text-xs text-[#a99aa5]">Popular Kenyan towns and Nairobi neighborhoods are included for faster setup.</span></FormRow>}
            {isAgency && <FormRow label="About the Agency" required><textarea className="min-h-32 w-full border border-[#ff55c7] bg-white p-2 text-sm text-[#111] outline-none" /></FormRow>}
            {isAgency && <FormRow label="Agency services"><div className="grid gap-2 md:grid-cols-2">{agencyServices.map((service) => <label key={service} className={checkboxCardClass}><input name="agencyServices" value={service} type="checkbox" /> {service}</label>)}</div></FormRow>}
            {isAgency && <FormRow label="Primary markets"><div className="grid gap-2 md:grid-cols-2">{kenyanTowns.slice(0, 12).map((town) => <label key={town} className={checkboxCardClass}><input type="checkbox" /> {town}</label>)}</div></FormRow>}
            {isIndependent && (
              <>
                <FormRow label="Gender" required><select name="gender" className={selectClass + ' w-full'}><option>Female</option><option>Male</option></select></FormRow>
                <FormRow label="Date of birth" hint="we calculate your age from this" required><div className="grid gap-2 sm:grid-cols-3"><select name="birthYear" className={selectClass + ' w-full'}><option>Year</option>{birthYears.map((year) => <option key={year}>{year}</option>)}</select><select name="birthMonth" className={selectClass + ' w-full'}><option>Month</option>{birthMonths.map((month) => <option key={month}>{month}</option>)}</select><select name="birthDay" className={selectClass + ' w-full'}><option>Date</option>{birthDays.map((day) => <option key={day}>{day}</option>)}</select></div></FormRow>
                <FormRow label="Ethnicity" required><select name="ethnicity" className={selectClass + ' w-full'}><option>Select ethnicity</option>{kenyanEthnicities.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Hair Color" required><select name="hairColor" className={selectClass + ' w-full'}><option>Select hair color</option>{hairColors.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Hair length" required><select name="hairLength" className={selectClass + ' w-full'}><option>Select hair length</option>{hairLengths.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Bust size" required><select name="bustSize" className={selectClass + ' w-full'}><option>Select bust size</option>{bustSizes.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Build" required><select name="build" className={selectClass + ' w-full'}><option>Select build</option>{buildOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Looks" required><select name="looks" className={selectClass + ' w-full'}><option>Select looks</option>{lookOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Height" required><select name="height" className={selectClass + ' w-full'}><option>Select height</option>{heightOptions.map((height) => <option key={height}>{height} cm</option>)}</select></FormRow>
                <FormRow label="Weight" required><select name="weight" className={selectClass + ' w-full'}><option>Select weight</option>{weightOptions.map((weight) => <option key={weight}>{weight} kg</option>)}</select></FormRow>
                <FormRow label="Availability" required><div className="grid gap-2 sm:grid-cols-2">{['Studio / incall', 'On-location / outcall'].map((item) => { const selected = selectedAvailability.includes(item); return <button type="button" key={item} onClick={() => toggleAvailability(item)} className={serviceTileBaseClass + ' ' + (selected ? serviceTileSelectedClass : serviceTileIdleClass)}><span className={'grid h-5 w-5 shrink-0 place-items-center rounded-full border ' + (selected ? 'border-white bg-white text-[#e60073]' : 'border-[#ff8bc6] bg-white text-transparent')}><Check className="h-3.5 w-3.5" /></span>{item}</button>; })}</div></FormRow>
                <FormRow label="Smoker" required><select name="smoker" className={selectClass + ' w-full'}>{smokerOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="About you" required><textarea name="about" className="min-h-36 w-full border border-[#ff55c7] bg-white p-2 text-sm text-[#111] outline-none" /><span className="mt-1 block text-xs text-[#a99aa5]">html code will be removed</span></FormRow>
                <FormRow label="Professional orientation"><select name="orientation" className={selectClass + ' w-full'}><option>Select orientation</option>{orientationOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Languages spoken"><div className="space-y-2">{[0, 1, 2].map((item) => <div key={item} className="grid gap-2 sm:grid-cols-[1fr_160px]"><select name={'language' + item} className={selectClass + ' w-full'}><option>Select language</option>{spokenLanguages.map((language) => <option key={language}>{language}</option>)}</select><select name={'languageLevel' + item} className={selectClass + ' w-full'}><option>Select level</option>{languageLevels.map((level) => <option key={level}>{level}</option>)}</select></div>)}</div></FormRow>
                <FormRow label="Rates"><div className="max-w-full overflow-x-auto"><div className="mb-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-end sm:gap-3"><span>Currency:</span><select className={selectClass + ' w-full sm:w-72'}><option>KES - Kenyan Shilling</option></select></div><div className="grid min-w-[440px] grid-cols-[100px_1fr_1fr] gap-2 text-center text-xs sm:grid-cols-[120px_1fr_1fr] sm:text-sm"><strong></strong><strong>Incall</strong><strong>Outcall</strong>{['30 minutes', '1 hour', '2 hours', '3 hours', '6 hours', '12 hours', '24 hours'].map((rate) => <div key={rate} className="contents"><span className="py-2 text-right">{rate}</span><input className={fieldClass} /><input className={fieldClass} /></div>)}</div></div></FormRow>
                <FormRow label="Services"><div className="grid gap-2 md:grid-cols-2">
                  <label className={serviceTileBaseClass + ' md:col-span-2 ' + (allServicesSelected ? serviceTileSelectedClass : serviceTileIdleClass)}>
                    <input className="sr-only" type="checkbox" checked={allServicesSelected} onChange={toggleAllServices} />
                    <span className={'grid h-5 w-5 shrink-0 place-items-center rounded-full border ' + (allServicesSelected ? 'border-white bg-white text-[#e60073]' : 'border-[#e60073] bg-white text-transparent')}><Check className="h-3.5 w-3.5" /></span>
                    <span className="flex-1">Select all services</span>
                    <span className={allServicesSelected ? 'text-xs text-white' : 'text-xs text-[#9b8090]'}>{selectedServices.length}/{services.length} selected</span>
                  </label>
                  {services.map((service) => {
                    const selected = selectedServices.includes(service);
                    return (
                      <label key={service} className={serviceTileBaseClass + ' ' + (selected ? serviceTileSelectedClass : serviceTileIdleClass)}>
                        <input className="sr-only" type="checkbox" checked={selected} onChange={() => toggleService(service)} />
                        <span className={'grid h-5 w-5 shrink-0 place-items-center rounded-full border ' + (selected ? 'border-white bg-white text-[#e60073]' : 'border-[#ff8bc6] bg-white text-transparent')}><Check className="h-3.5 w-3.5" /></span>
                        <span>{service}</span>
                      </label>
                    );
                  })}
                </div></FormRow>
              </>
            )}
            {registrationError && <p className="rounded bg-[#d70032] p-3 text-center text-sm font-bold text-white">{registrationError}</p>}<div className="pt-2 text-center"><button disabled={submitting} className="rounded-full bg-gradient-to-b from-[#ff58bf] to-[#e60073] px-8 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60">{submitting ? 'Submitting...' : 'Complete Registration'}</button></div>
          </form>
        </section>
        <RegistrationQuickSearch />
      </div>
      <section className="bg-[#fff0f6] px-4 py-16 sm:px-5 md:py-28">
        <div className="mx-auto max-w-5xl border-y border-[#ffc4e1] bg-white/45 px-4 py-10 text-center shadow-inner sm:px-6 sm:py-12">
          <p className="text-sm leading-7 text-[#9b8090]">Your account details are reviewed carefully so every Secret Nairobi profile starts with cleaner data, better trust signals, and a more polished public presence.</p>
          <div className="mx-auto mt-10 h-1.5 w-32 rounded-full bg-[#e60073]" />
        </div>
      </section>
      <RegistrationFooter />
    </>
  );
}

function ConfirmEmailScreen({ pending }: { pending?: any }) {
  const [data, setData] = useState<any>(pending || null);
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [autoConfirmAttempted, setAutoConfirmAttempted] = useState(false);
  useEffect(() => {
    if (data) return;
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const stored = window.localStorage.getItem(PENDING_REGISTRATION_KEY);
    const storedData = stored ? JSON.parse(stored) : null;
    setData(urlToken ? { ...(storedData || {}), validationToken: urlToken, confirmationUrl: `${window.location.origin}/register/confirm-email?token=${urlToken}` } : storedData || { validationToken: null, user: null });
  }, [data]);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token || autoConfirmAttempted || confirming) return;
    setAutoConfirmAttempted(true);
    void confirm(token);
  }, [autoConfirmAttempted, confirming]);
  async function confirm(tokenOverride?: string) {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    const token = tokenOverride || urlToken || data?.validationToken;
    if (!token) { setMessage('Validation token is missing. Please resend the validation email.'); return; }
    if (confirming) return;
    setConfirming(true);
    setMessage('');
    try {
      const result: any = await utamuApi.confirmEmail(token);
      if (!result?.token) { setMessage('The validation link could not be confirmed.'); return; }
      saveSession(result);
      window.localStorage.removeItem(PENDING_REGISTRATION_KEY);
      window.location.href = '/escort/profile';
    } catch (error) {
      const fallback = 'Validation link is invalid or already used. If you already confirmed this account, please login.';
      setMessage(error instanceof Error ? error.message || fallback : fallback);
    } finally {
      setConfirming(false);
    }
  }
  async function resend() {
    const email = data?.user?.email;
    if (!email) { setMessage('Email address is missing. Please register again.'); return; }
    if (resending || resendCooldown > 0) return;
    setResending(true);
    setMessage('');
    try {
      const result: any = await utamuApi.resendValidation(email);
      if (result?.recentlySent) {
        setResendCooldown(Number(result.retryAfterSeconds || 60));
        setMessage(`A validation email was just sent. Please wait ${Number(result.retryAfterSeconds || 60)} seconds before requesting another one.`);
      } else {
        setResendCooldown(60);
        setMessage('Validation email sent again. Check your inbox and spam folder.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Validation email could not be resent.');
    } finally {
      setResending(false);
    }
  }
  return <section className="bg-[#fff0f6] px-5 py-8 text-[#003b5c]">
    <div className="rounded-[3px] bg-[#67a62b] py-3 text-center text-2xl text-black">Your registration is complete</div>
    <div className="mt-10 max-w-3xl text-lg leading-8"><p>Before you can use the site you will need to validate your email address.</p><p>We sent a validation link to your email address.</p><p>Please click the link from that email so we can activate your account.</p><p>If you do not validate your email in the next 3 days your account will be deleted.</p></div>
    <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => confirm()} disabled={confirming} className="rounded-[4px] bg-gradient-to-b from-[#ff58bf] to-[#e60073] px-5 py-3 font-bold text-white">{confirming ? 'Confirming...' : 'Confirm email and open account'}</button><button onClick={resend} disabled={resending || resendCooldown > 0} className="rounded-[4px] border border-[#e60073] px-5 py-3 font-bold text-[#e60073] disabled:cursor-not-allowed disabled:opacity-60">{resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend validation email'}</button></div>
    {data?.confirmationUrl && <p className="mt-5 break-all text-sm text-[#8c6f7e]">Development validation link: <a className="text-[#e60073]" href={data.confirmationUrl}>{data.confirmationUrl}</a></p>}
    {message && <p className="mt-4 rounded bg-white p-3 text-sm text-[#d70032]">{message}</p>}
  </section>;
}

function ProfileScreen({ path }: { path: string }) {
  const slug = path.replace(/^(model|escort)\/?/, '');
  const directory = useUtamuDirectory();
  const [remoteModel, setRemoteModel] = useState<UtamuModel | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [tipTokens, setTipTokens] = useState('25');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingLocation, setBookingLocation] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoadingProfile(true);
    setProfileError('');
    utamuApi.getModel(slug).then((next: any) => {
      if (!mounted) return;
      setRemoteModel(next?.id ? next : null);
      if (!next?.id) setProfileError('Profile not found.');
    }).catch((error) => {
      if (!mounted) return;
      setProfileError(error instanceof Error ? error.message : 'Profile could not be loaded.');
      setRemoteModel(null);
    }).finally(() => {
      if (mounted) setLoadingProfile(false);
    });
    return () => { mounted = false; };
  }, [slug]);

  const model = remoteModel || directory.models.find((item) => item.slug === slug) || null;
  const modelProfile = (model as any)?.profile || {};
  const displayName = model?.name || modelProfile.name || 'Profile';
  const phone = String((model as any)?.phone || modelProfile.phone || '').trim();
  const gallery = model ? ((model.gallery?.length ? model.gallery : model.image ? [model.image] : []).filter(Boolean)) : [];
  const topRated = directory.filteredModels.filter((item) => item.slug !== slug).slice(0, 8);
  const services = Array.isArray(modelProfile.services) && modelProfile.services.length ? modelProfile.services : model?.specialties || [];
  const languageRows = Array.isArray(modelProfile.languages) ? modelProfile.languages.filter((item: any) => item?.language) : [];
  const priceFrom = Number(model?.priceFrom || 0);
  const facts = [
    ['Availability', Array.isArray(modelProfile.availability) ? modelProfile.availability.join(', ') : 'Not specified'],
    ['Ethnicity', modelProfile.ethnicity || 'Not specified'],
    ['Hair color', modelProfile.hairColor || 'Not specified'],
    ['Hair length', modelProfile.hairLength || 'Not specified'],
    ['Bust size', modelProfile.bustSize || 'Not specified'],
    ['Height', model?.height || modelProfile.height || 'Not specified'],
    ['Weight', modelProfile.weight || 'Not specified'],
    ['Build', modelProfile.build || 'Not specified'],
    ['Looks', modelProfile.looks || 'Not specified'],
    ['Smoker', modelProfile.smoker || 'Not specified'],
    ['Professional style', modelProfile.orientation || modelProfile.professionalOrientation || 'Not specified'],
  ];

  useEffect(() => {
    if (model?.city && !bookingLocation) setBookingLocation(model.city);
  }, [model?.city, bookingLocation]);

  async function startMessage() {
    const session = readSession();
    if (!session?.token) { setLoginPrompt(true); return; }
    setComposerOpen(true);
  }
  async function sendProfileMessage() {
    const session = readSession();
    if (!session?.token || !model) { setLoginPrompt(true); return; }
    try {
      await utamuApi.sendMessage({ modelSlug: model.slug, modelName: displayName, message: messageBody, subject: 'Profile enquiry' }, session.token);
      setMessageStatus('Message sent. The escort will see it in their account notifications.');
      setMessageBody('');
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Message could not be sent.');
    }
  }
  async function sendProfileTip() {
    const session = readSession();
    if (!session?.token || !model) { setLoginPrompt(true); return; }
    try {
      await utamuApi.sendTip({ modelSlug: model.slug, amountTokens: Number(tipTokens || 0), message: 'Profile appreciation tip' }, session.token);
      setMessageStatus('Tip sent successfully.');
    } catch (error) {
      setMessageStatus(error instanceof Error ? error.message : 'Tip could not be sent.');
    }
  }
  async function submitBookingLead() {
    const session = readSession();
    if (!session?.token || !model) { setLoginPrompt(true); return; }
    try {
      await utamuApi.createBookingLead({ modelSlug: model.slug, modelName: displayName, requestedDate: bookingDate || null, location: bookingLocation, message: bookingMessage }, session.token);
      setBookingStatus('Booking request sent to the dashboard.');
      setBookingMessage('');
    } catch (error) {
      setBookingStatus(error instanceof Error ? error.message : 'Booking request could not be sent.');
    }
  }

  if (loadingProfile && !model) {
    return <div className="grid gap-0 lg:grid-cols-[1fr_220px]"><section className="min-h-[520px] bg-[#fff0f6] px-5 py-10 text-[#3b164b]"><div className="rounded-[4px] bg-white p-6 shadow-sm">Loading real profile...</div></section><QuickSearchPanel spacerClass="hidden min-h-[520px] bg-[#101010] lg:block" /></div>;
  }
  if (!model) {
    return <div className="grid gap-0 lg:grid-cols-[1fr_220px]"><section className="min-h-[520px] bg-[#fff0f6] px-5 py-10 text-[#3b164b]"><div className="rounded-[4px] bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold text-[#e60073]">Profile not available</h1><p className="mt-2 text-sm text-[#7b6e78]">{profileError || 'This escort profile is not available.'}</p><a href="/register" className="mt-4 inline-flex rounded-full bg-[#e60073] px-5 py-2 text-sm font-bold text-white">Create a real profile</a></div></section><QuickSearchPanel spacerClass="hidden min-h-[520px] bg-[#101010] lg:block" /></div>;
  }

  return (
    <>
      <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
        <section className="min-w-0 bg-[#fff0f6] px-3 py-5 text-[#2b1037] md:px-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-normal text-[#ff4eb8]">{displayName}</h1>
              <div className="mt-2 flex gap-2 text-[11px] font-bold uppercase text-white">{(model.elite || model.listingTier === 'vip') && <span className="rounded-full bg-[#ff8a00] px-2 py-1">VIP</span>}{(model.verified || model.trustedBadge) && <span className="rounded-full bg-[#18c26a] px-2 py-1">Verified</span>}</div>
            </div>
            {phone && <div className="text-right text-[#ff4eb8]"><div className="text-xs text-[#8d7a88]">call me</div><a href={`tel:${phone}`} className="text-2xl font-bold">{phone}</a></div>}
          </div>
          {gallery.length > 0 ? <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">{gallery.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${displayName} portfolio ${index + 1}`} className="aspect-[4/5] w-full object-cover" />)}</div> : <div className="rounded-[4px] border border-[#ffd1e8] bg-white p-6 text-center text-sm font-semibold text-[#7b6e78]">This real profile has not added public images yet.</div>}
          <section className="mt-6 bg-white p-5">
            <h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">About me:</h2>
            <p className="mt-4 text-[14px] leading-7"><strong>{model.age} years old {model.category}.</strong></p>
            <p className="mt-2 text-[14px] leading-7">{model.bio || modelProfile.about || `${displayName} is based around ${model.city}, ${model.county}.`}</p>
            {phone && <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} className="mt-4 inline-flex font-bold text-[#ff1d9b]">WhatsApp Me</a>}
          </section>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <section className="bg-white p-5">
              <div className="mb-4 text-center text-[#1598e8]"><div className="text-4xl tracking-widest">*****</div><strong className="block text-[#2b1037]">Escort rating</strong><span className="text-sm italic text-[#7b6e78]">{model.reviews} reviews</span></div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">{facts.map(([label, value]) => <div key={label}><dt className="mb-1 font-bold uppercase text-[#ff4eb8]">{label}</dt><dd>{value}</dd></div>)}</dl>
            </section>
            <section className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Services:</h2>{services.length ? <ul className="mt-4 space-y-2 text-[14px]">{services.map((service: string) => <li key={service} className="flex gap-2"><Check className="h-4 w-4 text-[#25b86b]" /><span>{service}</span></li>)}</ul> : <p className="mt-4 text-sm text-[#7b6e78]">Services have not been listed yet.</p>}</section>
            <section className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Languages spoken:</h2>{languageRows.length ? <div className="mt-4 space-y-3 text-[13px]">{languageRows.map((item: any, index: number) => <p key={`${item.language}-${index}`}><strong className="uppercase text-[#ff4eb8]">{item.language}:</strong><br />{item.level || 'Conversational'}</p>)}</div> : <p className="mt-4 text-sm text-[#7b6e78]">Languages have not been listed yet.</p>}</section>
            <section className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Rates:</h2>{priceFrom ? <div className="mt-5 grid grid-cols-[1fr_1fr_1fr] text-center text-[13px]"><strong></strong><strong className="bg-[#ff4eb8] py-1 text-white">Studio</strong><strong className="bg-[#ff4eb8] py-1 text-white">Event</strong><strong className="py-3 text-left">1 hour</strong><span className="py-3">{kes(priceFrom)}</span><span className="py-3">{kes(priceFrom + 2500)}</span></div> : <p className="mt-4 text-sm text-[#7b6e78]">Rates have not been listed yet.</p>}</section>
            <section className="bg-white p-5">
              <h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Contact info:</h2>
              {phone ? <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-2 text-[13px]"><dt className="font-bold">Phone:</dt><dd className="text-[#ff4eb8]">{phone}</dd><dt className="font-bold">WhatsApp:</dt><dd><a href={`https://wa.me/${phone.replace(/\D/g, '')}`} className="text-[#ff4eb8]">WhatsApp</a></dd></dl> : <p className="mt-4 text-sm text-[#7b6e78]">Contact details are available after login or direct enquiry.</p>}
              <p className="mt-4 text-[13px] leading-6">Tell us you found this profile on <strong>Secret Nairobi</strong> to improve response handling and platform safety.</p>
              <div className="mt-4 flex flex-wrap gap-2"><button onClick={startMessage} className="inline-flex rounded-full bg-[#ff4eb8] px-4 py-2 text-xs font-bold text-white"><Mail className="mr-1 h-4 w-4" />Email Me</button><button onClick={() => setBookingOpen((value) => !value)} className="inline-flex rounded-full bg-[#006b3f] px-4 py-2 text-xs font-bold text-white">Request booking</button><button onClick={sendProfileTip} className="inline-flex rounded-full bg-[#f0b323] px-4 py-2 text-xs font-bold text-[#211000]">Tip {tipTokens} tokens</button><input value={tipTokens} onChange={(event) => setTipTokens(event.target.value)} className="w-20 rounded-full border border-[#ffd0e8] px-3 text-xs" /></div>{loginPrompt && <div className="mt-4 flex items-center justify-between rounded-[3px] bg-[#d70032] px-4 py-3 text-sm font-bold text-white"><span>You need to register or login to send messages, tips, or booking requests</span><button onClick={() => setLoginPrompt(false)} className="rounded-full bg-white px-2 py-1 text-xs text-[#d70032]">Close x</button></div>}{composerOpen && <div className="mt-4 rounded border border-[#ffd0e8] bg-[#fff0f6] p-3"><p className="mb-2 text-xs text-[#7b6e78]">Private messages cost wallet tokens. Buy bundles from My Account - Monetization.</p><textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder="Write your message" className="min-h-24 w-full border border-[#ff55c7] bg-white p-2 text-sm outline-none" /><button onClick={sendProfileMessage} className="mt-2 rounded-full bg-[#ff4eb8] px-4 py-2 text-xs font-bold text-white">Send message</button>{messageStatus && <p className="mt-2 text-xs text-[#168a4a]">{messageStatus}</p>}</div>}{bookingOpen && <div className="mt-4 rounded border border-[#ffd0e8] bg-[#fff0f6] p-3"><div className="grid gap-2 sm:grid-cols-2"><input type="datetime-local" value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} className={fieldClass} /><input value={bookingLocation} onChange={(event) => setBookingLocation(event.target.value)} placeholder="Preferred location" className={fieldClass} /></div><textarea value={bookingMessage} onChange={(event) => setBookingMessage(event.target.value)} placeholder="Share timing, area, screening details, and what you want confirmed" className="mt-2 min-h-24 w-full border border-[#ff55c7] bg-white p-2 text-sm outline-none" /><button onClick={submitBookingLead} className="mt-2 rounded-full bg-[#006b3f] px-4 py-2 text-xs font-bold text-white">Send booking request</button>{bookingStatus && <p className="mt-2 text-xs text-[#168a4a]">{bookingStatus}</p>}</div>}
            </section>
          </div>
          <section className="mt-3 bg-white p-5"><div className="flex items-center justify-between"><h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Reviews:</h2><a href="/reviews/ratings" className="rounded-full bg-[#ff4eb8] px-4 py-2 text-xs font-bold text-white">Add Review</a></div><p className="mt-4 text-sm">No reviews yet</p></section>
          {topRated.length > 0 && <section className="mt-6"><h2 className="mb-4 text-xl font-normal text-[#3b164b]">Other Real Escorts</h2><div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-4">{topRated.map((item, index) => <ModelCard key={item.id} model={item} index={index} />)}</div></section>}
        </section>
        <QuickSearchPanel spacerClass="hidden min-h-[1800px] bg-[#101010] lg:block" />
      </div>

      <RegistrationFooter />
    </>
  );
}

function EditProfileForm({ account, onSave, saving }: { account: any; onSave: (event: React.FormEvent<HTMLFormElement>) => void; saving: boolean }) {
  const profile = account?.user?.profile || {};
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  useEffect(() => {
    setSelectedServices(Array.isArray(profile.services) ? profile.services : []);
    setSelectedAvailability(Array.isArray(profile.availability) ? profile.availability : []);
  }, [account?.user?.id]);
  const allServicesSelected = selectedServices.length === modelServices.length;
  const toggleService = (service: string) => setSelectedServices((current) => current.includes(service) ? current.filter((item) => item !== service) : [...current, service]);
  const toggleAllServices = () => setSelectedServices(allServicesSelected ? [] : modelServices);
  const toggleAvailability = (item: string) => setSelectedAvailability((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  const languageRows = [0, 1, 2].map((index) => (Array.isArray(profile.languages) ? profile.languages[index] : null) || {});

  return (
    <form key={account?.user?.id || 'edit-profile'} onSubmit={onSave} className="bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Edit profile details</h2>
          <p className="mt-2 text-sm text-[#7b6e78]">Update the same profile details you submitted during registration.</p>
        </div>
        <button disabled={saving} className="rounded-full bg-gradient-to-b from-[#ff58bf] to-[#e60073] px-6 py-2 text-sm font-bold text-white shadow-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
      </div>
      <div className="mt-6 space-y-6 text-[#003b5c]">
        <FormRow label="Name" hint="will be publicly shown" required><input name="name" className={fieldClass} defaultValue={profile.name || account?.user?.fullName || ''} /></FormRow>
        <FormRow label="Phone" required><input name="phone" className={fieldClass} defaultValue={profile.phone || account?.user?.phone || ''} /></FormRow>
        <FormRow label="Website"><input name="website" className={fieldClass} defaultValue={profile.website || ''} /></FormRow>
        <FormRow label="Country" required><select name="country" className={selectClass + ' w-full'} defaultValue={profile.country || 'Kenya'}><option>Kenya</option></select></FormRow>
        <FormRow label="City" required><select name="city" className={selectClass + ' w-full'} defaultValue={profile.city || 'Nairobi'}>{kenyanTowns.map((town) => <option key={town}>{town}</option>)}</select></FormRow>
        <FormRow label="Gender" required><select name="gender" className={selectClass + ' w-full'} defaultValue={profile.gender || 'Female'}><option>Female</option><option>Male</option></select></FormRow>
        <FormRow label="Date of birth" hint="we calculate your age from this" required><div className="grid gap-2 sm:grid-cols-3"><select name="birthYear" className={selectClass + ' w-full'} defaultValue={profile.birthYear || 'Year'}><option>Year</option>{birthYears.map((year) => <option key={year}>{year}</option>)}</select><select name="birthMonth" className={selectClass + ' w-full'} defaultValue={profile.birthMonth || 'Month'}><option>Month</option>{birthMonths.map((month) => <option key={month}>{month}</option>)}</select><select name="birthDay" className={selectClass + ' w-full'} defaultValue={profile.birthDay || 'Date'}><option>Date</option>{birthDays.map((day) => <option key={day}>{day}</option>)}</select></div></FormRow>
        <FormRow label="Ethnicity" required><select name="ethnicity" className={selectClass + ' w-full'} defaultValue={profile.ethnicity || 'Select ethnicity'}><option>Select ethnicity</option>{kenyanEthnicities.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
        <FormRow label="Hair Color" required><select name="hairColor" className={selectClass + ' w-full'} defaultValue={profile.hairColor || 'Select hair color'}><option>Select hair color</option>{hairColors.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
        <FormRow label="Hair length" required><select name="hairLength" className={selectClass + ' w-full'} defaultValue={profile.hairLength || 'Select hair length'}><option>Select hair length</option>{hairLengths.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
        <FormRow label="Bust size" required><select name="bustSize" className={selectClass + ' w-full'} defaultValue={profile.bustSize || 'Select bust size'}><option>Select bust size</option>{bustSizes.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
        <FormRow label="Build" required><select name="build" className={selectClass + ' w-full'} defaultValue={profile.build || 'Select build'}><option>Select build</option>{buildOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
        <FormRow label="Looks" required><select name="looks" className={selectClass + ' w-full'} defaultValue={profile.looks || 'Select looks'}><option>Select looks</option>{lookOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
        <FormRow label="Height" required><select name="height" className={selectClass + ' w-full'} defaultValue={profile.height || 'Select height'}><option>Select height</option>{heightOptions.map((height) => <option key={height}>{height} cm</option>)}</select></FormRow>
        <FormRow label="Weight" required><select name="weight" className={selectClass + ' w-full'} defaultValue={profile.weight || 'Select weight'}><option>Select weight</option>{weightOptions.map((weight) => <option key={weight}>{weight} kg</option>)}</select></FormRow>
        <FormRow label="Availability" required><div className="grid gap-2 sm:grid-cols-2">{['Studio / incall', 'On-location / outcall'].map((item) => { const selected = selectedAvailability.includes(item); return <label key={item} className={serviceTileBaseClass + ' ' + (selected ? serviceTileSelectedClass : serviceTileIdleClass)}><input className="sr-only" name="availability" value={item} type="checkbox" checked={selected} onChange={() => toggleAvailability(item)} /><span className={'grid h-5 w-5 shrink-0 place-items-center rounded-full border ' + (selected ? 'border-white bg-white text-[#e60073]' : 'border-[#ff8bc6] bg-white text-transparent')}><Check className="h-3.5 w-3.5" /></span>{item}</label>; })}</div></FormRow>
        <FormRow label="Smoker" required><select name="smoker" className={selectClass + ' w-full'} defaultValue={profile.smoker || 'No'}>{smokerOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
        <FormRow label="About you" required><textarea name="about" className="min-h-36 w-full border border-[#ff55c7] bg-white p-2 text-sm text-[#111] outline-none" defaultValue={profile.about || ''} /><span className="mt-1 block text-xs text-[#a99aa5]">html code will be removed</span></FormRow>
        <FormRow label="Professional orientation"><select name="orientation" className={selectClass + ' w-full'} defaultValue={profile.orientation || 'Select orientation'}><option>Select orientation</option>{orientationOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
        <FormRow label="Languages spoken"><div className="space-y-2">{languageRows.map((row: any, item) => <div key={item} className="grid gap-2 sm:grid-cols-[1fr_160px]"><select name={'language' + item} className={selectClass + ' w-full'} defaultValue={row.language || 'Select language'}><option>Select language</option>{spokenLanguages.map((language) => <option key={language}>{language}</option>)}</select><select name={'languageLevel' + item} className={selectClass + ' w-full'} defaultValue={row.level || 'Select level'}><option>Select level</option>{languageLevels.map((level) => <option key={level}>{level}</option>)}</select></div>)}</div></FormRow>
        <FormRow label="Services"><div className="grid gap-2 md:grid-cols-2">
          <label className={serviceTileBaseClass + ' md:col-span-2 ' + (allServicesSelected ? serviceTileSelectedClass : serviceTileIdleClass)}>
            <input className="sr-only" type="checkbox" checked={allServicesSelected} onChange={toggleAllServices} />
            <span className={'grid h-5 w-5 shrink-0 place-items-center rounded-full border ' + (allServicesSelected ? 'border-white bg-white text-[#e60073]' : 'border-[#e60073] bg-white text-transparent')}><Check className="h-3.5 w-3.5" /></span>
            <span className="flex-1">Select all services</span>
            <span className={allServicesSelected ? 'text-xs text-white' : 'text-xs text-[#9b8090]'}>{selectedServices.length}/{modelServices.length} selected</span>
          </label>
          {modelServices.map((service) => {
            const selected = selectedServices.includes(service);
            return (
              <label key={service} className={serviceTileBaseClass + ' ' + (selected ? serviceTileSelectedClass : serviceTileIdleClass)}>
                <input className="sr-only" name="services" value={service} type="checkbox" checked={selected} onChange={() => toggleService(service)} />
                <span className={'grid h-5 w-5 shrink-0 place-items-center rounded-full border ' + (selected ? 'border-white bg-white text-[#e60073]' : 'border-[#ff8bc6] bg-white text-transparent')}><Check className="h-3.5 w-3.5" /></span>
                <span>{service}</span>
              </label>
            );
          })}
        </div></FormRow>
        <div className="pt-2 text-center"><button disabled={saving} className="rounded-full bg-gradient-to-b from-[#ff58bf] to-[#e60073] px-8 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save profile changes'}</button></div>
      </div>
    </form>
  );
}

function AccountSidebar({ active }: { active: string }) {
  const links = [['View my Profile', '/escort/profile'], ['Edit my Profile', '/edit-profile'], ['Monetization', '/monetization'], ['Client Portal', '/client-portal'], ['Change Password', '/change-password'], ['Verified status', '/verify-account'], ['Blacklisted Clients', '/blacklisted-clients'], ['LogOut', '/logout']];
  return <aside className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 text-lg font-bold text-[#ff1d9b]">My Account</h2><div className="mt-4 grid gap-2">{links.map(([label, href]) => <a key={href} href={href} className={'rounded-[3px] px-3 py-2 text-sm font-bold ' + (active === href.slice(1) ? 'bg-[#e60073] text-white' : 'bg-[#fff0f6] text-[#3b164b] hover:bg-[#ffd6ec]')}>{label}</a>)}</div></aside>;
}

function DashboardScreen({ path = 'escort/dashboard' }: { path?: string }) {
  const [session, setSession] = useState<UtamuSession | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{ name: string; url: string; size: number }[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (path === 'logout') { clearSession(); window.location.href = '/'; return; }
    const next = readSession();
    setSession(next);
    if (next?.token) utamuApi.getMe(next.token).then(setAccount);
  }, [path]);
  function clearSelectedImages() {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    setSelectedImageFiles([]);
    setImagePreviews([]);
  }
  function selectImages(files: FileList | null) {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    const nextFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/')).slice(0, 8);
    setSelectedImageFiles(nextFiles);
    setImagePreviews(nextFiles.map((file) => ({ name: file.name, size: file.size, url: URL.createObjectURL(file) })));
    setNotice(nextFiles.length ? 'Preview ready. Review, then publish online.' : 'Please select image files only.');
  }
  async function addImage() {
    if (!session?.token || !selectedImageFiles.length || uploadingImages) return;
    setUploadingImages(true);
    try {
      const uploaded: any = await utamuApi.uploadProfileImages(selectedImageFiles, session.token);
      const nextImages = Array.isArray(uploaded) ? uploaded : [uploaded];
      setAccount((current: any) => ({ ...(current || {}), images: [...(current?.images || []), ...nextImages] }));
      clearSelectedImages();
      setNotice('Images published to your profile.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Images could not be uploaded.');
    } finally {
      setUploadingImages(false);
    }
  }
  async function deleteImage(id: string) {
    if (!session?.token || !id) return;
    await utamuApi.deleteProfileImage(id, session.token);
    setAccount((current: any) => ({ ...(current || {}), images: (current?.images || []).filter((image: any) => image.id !== id) }));
    setNotice('Image removed from your profile.');
  }
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.token || savingProfile) return;
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries()) as Record<string, FormDataEntryValue>;
    const clean = (key: string) => String(values[key] || '').trim();
    const languages = [0, 1, 2]
      .map((index) => ({ language: clean('language' + index), level: clean('languageLevel' + index) }))
      .filter((item) => item.language && item.language !== 'Select language');
    const currentProfile = account?.user?.profile || {};
    const nextProfile = {
      ...currentProfile,
      name: clean('name'),
      phone: clean('phone'),
      website: clean('website'),
      country: clean('country') || 'Kenya',
      city: clean('city'),
      gender: clean('gender'),
      birthYear: clean('birthYear'),
      birthMonth: clean('birthMonth'),
      birthDay: clean('birthDay'),
      ethnicity: clean('ethnicity'),
      hairColor: clean('hairColor'),
      hairLength: clean('hairLength'),
      bustSize: clean('bustSize'),
      build: clean('build'),
      looks: clean('looks'),
      height: clean('height'),
      weight: clean('weight'),
      smoker: clean('smoker'),
      about: clean('about'),
      orientation: clean('orientation'),
      availability: formData.getAll('availability').map(String),
      services: formData.getAll('services').map(String),
      languages,
    };
    setSavingProfile(true);
    try {
      const result: any = await utamuApi.updateProfile({ profile: nextProfile, name: nextProfile.name, phone: nextProfile.phone, city: nextProfile.city, country: nextProfile.country, services: nextProfile.services, availability: nextProfile.availability }, session.token);
      setAccount((current: any) => ({ ...(current || {}), user: result.user || current?.user, model: result.model || current?.model }));
      if (result.user) saveSession({ ...session, user: result.user });
      setNotice('Profile changes saved.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Profile changes could not be saved.');
    } finally {
      setSavingProfile(false);
    }
  }
  async function changePassword() {
    if (!session?.token) return;
    await utamuApi.changePassword({ password }, session.token);
    setPassword('');
    setNotice('Password changed successfully.');
  }
  if (!session?.token) return <section className="bg-[#fff0f6] px-5 py-16"><div className="rounded bg-[#d70032] p-4 text-center font-bold text-white">You need to <a className="underline" href="/register">register</a> or <a className="underline" href="/login">login</a> to access your account.</div></section>;
  const images = account?.images || [];
  const profile = account?.user?.profile || {};
  const model = account?.model || {};
  const isViewProfile = ['model/profile', 'model/dashboard', 'escort/profile', 'escort/dashboard'].includes(path);
  const isEditProfile = path === 'edit-profile';
  const showFirstUpload = isViewProfile && images.length === 0;
  const profileRows = [
    ['Name', account?.user?.fullName || model.display_name],
    ['Username', account?.user?.username],
    ['Email', account?.user?.email],
    ['Phone', account?.user?.phone],
    ['Account type', account?.user?.accountType],
    ['City', profile.city || model.city],
    ['Country', profile.country],
    ['Gender', profile.gender],
    ['Date of birth', [profile.birthDay, profile.birthMonth, profile.birthYear].filter(Boolean).join(' ')],
    ['Ethnicity', profile.ethnicity],
    ['Hair color', profile.hairColor],
    ['Hair length', profile.hairLength],
    ['Bust size', profile.bustSize],
    ['Height', profile.height],
    ['Weight', profile.weight],
    ['Build', profile.build],
    ['Looks', profile.looks],
    ['Smoker', profile.smoker],
    ['Professional orientation', profile.orientation],
    ['Availability', (profile.availability || []).join(', ')],
    ['Languages', (profile.languages || []).map((item: any) => [item.language, item.level].filter(Boolean).join(' - ')).filter(Boolean).join(', ')],
    ['Services', (profile.services || []).join(', ')],
  ].filter(([, value]) => Boolean(value));
  const uploadPanel = <div className="bg-white p-5 shadow-sm"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">{showFirstUpload ? 'Add your first profile images' : 'Profile image manager'}</h2><p className="mt-3 text-sm leading-6 text-[#7b6e78]">{showFirstUpload ? 'Select portfolio images, preview them here, then publish them online. After your first upload, image management moves to Edit my Profile.' : 'Preview new portfolio images before publishing, or remove older ones.'}</p><div className="mt-4 flex flex-col gap-3 rounded-[3px] border border-dashed border-[#ff9bd0] bg-[#fff8fb] p-4"><input id="profile-image-files" type="file" accept="image/*" multiple onChange={(event) => selectImages(event.target.files)} className="hidden" /><label htmlFor="profile-image-files" className="inline-flex w-fit cursor-pointer rounded-full bg-[#3b164b] px-5 py-2 text-sm font-bold text-white">Select images</label>{imagePreviews.length > 0 && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{imagePreviews.map((preview) => <figure key={preview.url} className="overflow-hidden rounded-[3px] border border-[#ffd1e8] bg-white"><img src={preview.url} alt={preview.name} className="aspect-[4/5] w-full object-cover" /><figcaption className="truncate px-2 py-1 text-xs text-[#7b6e78]">{preview.name}</figcaption></figure>)}</div>}<div className="flex flex-wrap gap-2">{imagePreviews.length > 0 && <button onClick={addImage} disabled={uploadingImages} className="rounded-full bg-[#ff4eb8] px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{uploadingImages ? 'Uploading...' : 'Publish selected images'}</button>}{imagePreviews.length > 0 && <button onClick={clearSelectedImages} className="rounded-full border border-[#e60073] px-5 py-2 text-sm font-bold text-[#e60073]">Clear previews</button>}</div></div>{images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{images.map((image: any) => <figure key={image.id || image.url} className="relative overflow-hidden rounded-[3px] border border-[#ffd1e8]"><img src={image.url} alt={image.alt || 'Profile image'} className="aspect-[4/5] w-full object-cover" />{isEditProfile && <button onClick={() => deleteImage(image.id)} className="absolute right-2 top-2 rounded-full bg-[#d70032] px-3 py-1 text-xs font-bold text-white">Delete</button>}</figure>)}</div>}</div>;
  const profileDataPanel = <div className="bg-white p-5 shadow-sm"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">My uploaded profile data</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{profileRows.map(([label, value]) => <div key={String(label)} className="rounded-[3px] border border-[#ffd1e8] bg-[#fff8fb] p-3"><p className="text-[11px] font-bold uppercase text-[#ff1d9b]">{label}</p><p className="mt-1 text-sm text-[#2b123a]">{String(value)}</p></div>)}</div>{profile.about && <div className="mt-4 rounded-[3px] border border-[#ffd1e8] bg-[#fff8fb] p-3"><p className="text-[11px] font-bold uppercase text-[#ff1d9b]">About</p><p className="mt-2 text-sm leading-7 text-[#2b123a]">{profile.about}</p></div>}{images.length > 0 && isViewProfile && <a href="/edit-profile" className="mt-5 inline-flex rounded-full bg-[#ff4eb8] px-5 py-2 text-sm font-bold text-white">Edit profile images</a>}</div>;
  return <section className="grid gap-4 bg-[#fff0f6] px-4 py-6 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="space-y-4"><div className="bg-white p-5 shadow-sm"><h1 className="text-3xl text-[#ff4eb8]">{isEditProfile ? 'Edit my profile' : isViewProfile ? 'View my profile' : 'My account'}</h1><p className="mt-2 text-sm text-[#7b6e78]">Logged in as {session.user?.fullName || session.user?.email}</p>{notice && <p className="mt-3 rounded bg-[#e6ffe9] p-3 text-sm text-[#147a33]">{notice}</p>}</div>{showFirstUpload && uploadPanel}{isViewProfile && profileDataPanel}{isEditProfile && account?.user && <><EditProfileForm account={account} onSave={saveProfile} saving={savingProfile} />{uploadPanel}{profileDataPanel}</>}{path === 'change-password' && <div className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Change password</h2><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass + ' mt-4'} placeholder="New password" /><button onClick={changePassword} className="mt-3 rounded-full bg-[#ff4eb8] px-5 py-2 text-sm font-bold text-white">Change password</button></div>}{path === 'verify-account' && <div className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Verified status</h2><p className="mt-4 text-sm">Email: {account?.user?.emailVerified ? 'Verified' : 'Pending validation'}<br />Profile: {account?.model?.verified ? 'Verified' : 'Pending review'}</p><a href="/verification/step-1" className="mt-4 inline-flex rounded-full bg-[#ff4eb8] px-5 py-2 text-sm font-bold text-white">Submit verification</a></div>}{path === 'blacklisted-clients' && <div className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Blacklisted Clients</h2><p className="mt-4 text-sm">No blacklisted clients yet.</p></div>}</div><AccountSidebar active={path} /></section>;
}

function MonetizationScreen() {
  const [session, setSession] = useState<UtamuSession | null>(null);
  const [overview, setOverview] = useState<any>({ products: [], wallet: null, subscriptions: [], assistant: null, clientPortal: null, leads: [], transactions: [], payments: [], messageTokenCost: 5 });
  const [method, setMethod] = useState<'mpesa' | 'paystack'>('mpesa');
  const [phone, setPhone] = useState('2547');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busyProduct, setBusyProduct] = useState('');
  const [aiTone, setAiTone] = useState('polite');
  const [aiInstructions, setAiInstructions] = useState('');
  useEffect(() => {
    const next = readSession();
    setSession(next);
    if (next?.token) utamuApi.getMonetization(next.token).then((data: any) => {
      setOverview(data);
      setAiTone(data.assistant?.tone || 'polite');
      setAiInstructions(data.assistant?.instructions || '');
      setEmail(next.user?.email || '');
      setPhone(next.user?.phone || '2547');
    });
  }, []);
  async function checkout(productId: string) {
    if (!session?.token) { window.location.href = '/login'; return; }
    setBusyProduct(productId);
    setStatus('');
    try {
      const result: any = await utamuApi.createMonetizationCheckout({ productId, method, phone, email }, session.token);
      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
        return;
      }
      setStatus(result.instructions || 'Payment started. Complete checkout to activate this feature.');
      const refreshed = await utamuApi.getMonetization(session.token);
      setOverview(refreshed);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Checkout could not be started.');
    } finally {
      setBusyProduct('');
    }
  }
  async function saveAssistant(enabled = true) {
    if (!session?.token) return;
    const assistant = await utamuApi.configureAiAssistant({ enabled, tone: aiTone, instructions: aiInstructions, autoReplyEnabled: true }, session.token);
    setOverview((current: any) => ({ ...current, assistant }));
    setStatus(enabled ? 'AI assistant settings saved.' : 'AI assistant paused.');
  }
  if (!session?.token) return <section className="bg-[#fff7fb] px-5 py-16"><div className="rounded bg-[#d70032] p-4 text-center font-bold text-white">Login to manage monetization.</div></section>;
  const grouped = (overview.products || []).reduce((acc: any, product: any) => ({ ...acc, [product.category]: [...(acc[product.category] || []), product] }), {});
  const categoryTitles: Record<string, string> = { verification: 'Paid verification and trust badges', listing: 'Tiered featured listings', wallet: 'Message tokens and tips', ai: 'AI companion assistant', client_portal: 'Verified client portal' };
  return <section className="grid gap-4 bg-[#fff7fb] px-4 py-6 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="space-y-5"><div className="bg-gradient-to-r from-[#170421] via-[#2b0a3d] to-[#063b2c] p-5 text-white"><StatusBadge tone="gold">Revenue center</StatusBadge><h1 className="mt-3 text-3xl font-bold">Monetization</h1><p className="mt-2 max-w-3xl text-sm text-white/80">Sell trust badges, featured placement, tokenized messages, tips, AI assistant access, vetted client subscriptions, and booking leads from one account area.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded border border-white/15 bg-white/10 p-3"><p className="text-xs uppercase text-white/60">Wallet</p><strong className="text-2xl">{overview.wallet?.balance_tokens || 0} tokens</strong></div><div className="rounded border border-white/15 bg-white/10 p-3"><p className="text-xs uppercase text-white/60">Listing tier</p><strong className="text-2xl capitalize">{overview.model?.listing_tier || 'free'}</strong></div><div className="rounded border border-white/15 bg-white/10 p-3"><p className="text-xs uppercase text-white/60">Trusted badge</p><strong className="text-2xl">{overview.model?.trusted_badge ? 'Active' : 'Not active'}</strong></div></div></div><div className="bg-white p-4 shadow-sm"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><select value={method} onChange={(event) => setMethod(event.target.value as 'mpesa' | 'paystack')} className={selectClass}><option value="mpesa">M-Pesa</option><option value="paystack">Paystack</option></select><input value={method === 'mpesa' ? phone : email} onChange={(event) => method === 'mpesa' ? setPhone(event.target.value) : setEmail(event.target.value)} className={fieldClass} placeholder={method === 'mpesa' ? '2547...' : 'email@example.com'} /><a href="/checkout/mpesa" className="rounded-full bg-[#f0b323] px-5 py-2 text-center text-sm font-bold text-[#211000]">VIP quick pay</a></div>{status && <p className="mt-3 rounded bg-[#e6ffe9] p-3 text-sm text-[#147a33]">{status}</p>}</div>{Object.entries(grouped).map(([category, products]: any) => <section key={category} className="bg-white p-5 shadow-sm"><h2 className="border-l-4 border-[#e60073] pl-3 text-lg font-bold text-[#e60073]">{categoryTitles[category] || category}</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{products.map((product: any) => <article key={product.id} className="rounded border border-[#ffd1e8] bg-[#fff8fb] p-4"><p className="text-xs font-bold uppercase text-[#006b3f]">{product.category}</p><h3 className="mt-2 text-xl font-bold text-[#2b0a3d]">{product.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-[#7b6e78]">{product.description}</p><div className="mt-3 flex items-center justify-between"><strong className="text-lg text-[#111]">{kes(product.amountKes || product.amount_kes || 0)}</strong>{product.tokenAmount || product.token_amount ? <span className="rounded-full bg-[#006b3f] px-2 py-1 text-xs font-bold text-white">{product.tokenAmount || product.token_amount} tokens</span> : <span className="rounded-full bg-[#f0b323] px-2 py-1 text-xs font-bold text-[#211000]">{product.durationDays || product.duration_days || 30} days</span>}</div><button disabled={busyProduct === product.id} onClick={() => checkout(product.id)} className="mt-4 w-full rounded-full bg-[#e60073] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busyProduct === product.id ? 'Starting...' : 'Activate'}</button></article>)}</div></section>)}<section className="bg-white p-5 shadow-sm"><h2 className="border-l-4 border-[#006b3f] pl-3 text-lg font-bold text-[#006b3f]">AI assistant settings</h2><div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr]"><select value={aiTone} onChange={(event) => setAiTone(event.target.value)} className={selectClass}><option>polite</option><option>warm</option><option>direct</option><option>premium</option></select><input value={aiInstructions} onChange={(event) => setAiInstructions(event.target.value)} className={fieldClass} placeholder="Screening rules, availability notes, preferred response style" /></div><div className="mt-3 flex gap-2"><button onClick={() => saveAssistant(true)} className="rounded-full bg-[#006b3f] px-5 py-2 text-sm font-bold text-white">Save assistant</button><button onClick={() => saveAssistant(false)} className="rounded-full border border-[#006b3f] px-5 py-2 text-sm font-bold text-[#006b3f]">Pause</button></div></section><section className="bg-white p-5 shadow-sm"><h2 className="border-l-4 border-[#e60073] pl-3 text-lg font-bold text-[#e60073]">Booking leads</h2><div className="mt-4 grid gap-3">{(overview.leads || []).length === 0 && <p className="text-sm text-[#7b6e78]">No paid leads yet.</p>}{(overview.leads || []).map((lead: any) => <article key={lead.id} className="rounded border border-[#ffd1e8] p-3 text-sm"><strong>{lead.model_name || 'Profile lead'}</strong><p className="mt-1 text-[#7b6e78]">{lead.message}</p><span className="text-xs text-[#006b3f]">Lead fee: {kes(Number(lead.lead_fee_kes || 0))}</span></article>)}</div></section></div><AccountSidebar active="monetization" /></section>;
}

function ClientPortalScreen() {
  const [session, setSession] = useState<UtamuSession | null>(null);
  const [portal, setPortal] = useState<any>({ profiles: [] });
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const next = readSession();
    setSession(next);
    if (next?.token) utamuApi.getClientPortal(next.token).then(setPortal).catch((error) => setNotice(error instanceof Error ? error.message : 'Upgrade required.'));
  }, []);
  if (!session?.token) return <section className="bg-[#fff7fb] px-5 py-16"><div className="rounded bg-[#d70032] p-4 text-center font-bold text-white">Login to access the vetted client portal.</div></section>;
  return <section className="grid gap-4 bg-[#fff7fb] px-4 py-6 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="space-y-4"><div className="bg-white p-5 shadow-sm"><h1 className="text-3xl text-[#ff4eb8]">Vetted client portal</h1><p className="mt-2 text-sm text-[#7b6e78]">Premium matching for verified, trusted, and VIP profiles.</p>{notice && <p className="mt-3 rounded bg-[#fff0d0] p-3 text-sm text-[#7a4d00]">{notice} <a href="/monetization" className="font-bold text-[#e60073]">Activate access</a></p>}</div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{(portal.profiles || []).map((profile: any) => <a key={profile.id} href={`/escort/${profile.slug}`} className="overflow-hidden rounded border border-[#f0b323]/70 bg-white shadow-sm">{profile.image_url ? <img src={profile.image_url} alt={profile.display_name} className="aspect-[3/4] w-full object-cover" /> : <div className="grid aspect-[3/4] place-items-center bg-[#fff0f6] p-4 text-center text-xs font-bold uppercase tracking-wide text-[#9b8090]">Real profile image pending</div>}<div className="p-3"><strong className="text-[#2b0a3d]">{profile.display_name}</strong><p className="text-xs text-[#7b6e78]">{profile.city} - {profile.listing_tier || 'trusted'}</p></div></a>)}</div></div><AccountSidebar active="client-portal" /></section>;
}


function VerificationScreen({ path }: { path: string }) {
  const rejected = path.includes('rejected');
  const resubmitted = path.includes('resubmission');
  const submitted = path.includes('submitted') || resubmitted;
  return <section className="mx-auto max-w-3xl px-5 py-10"><div className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-6"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ffd700]/10 text-[#ffd700]">{rejected ? <X className="h-8 w-8" /> : submitted ? <Check className="h-8 w-8" /> : <Upload className="h-8 w-8" />}</div><h1 className="mt-5 text-center font-display text-3xl font-bold text-[#fff6df]">{rejected ? 'Verification rejected' : submitted ? 'Application submitted' : 'Verification step 1'}</h1><p className="mx-auto mt-3 max-w-xl text-center text-[#d0c6ab]">{rejected ? 'Your documents need a clearer upload before your Secret Nairobi profile can go live.' : submitted ? 'Your identity verification is in the admin queue. You will receive a notification after review.' : 'Upload ID, selfie proof, service categories, rate card, and M-Pesa payout number for review.'}</p><div className="mt-6 grid gap-3">{['Legal name', 'National ID or passport', 'Live selfie', 'Portfolio images', 'M-Pesa payout phone'].map((field) => <input key={field} placeholder={field} className="rounded-lg border border-[#353534] bg-[#201f1f] p-4 text-[#fff6df] placeholder:text-[#999077]" />)}</div><a href="/verification/submitted" className="mt-5 flex items-center justify-center rounded-lg bg-[#ffd700] px-5 py-3 font-bold text-[#221b00]">Submit for review</a>{rejected && <a href="/verification/re-apply" className="mt-3 flex items-center justify-center rounded-lg border border-[#4d4732] px-5 py-3 font-semibold text-[#fff6df]">Re-apply</a>}</div></section>;
}

function CheckoutScreen() {
  const [method, setMethod] = useState<'mpesa' | 'paystack'>('mpesa');
  const [phone, setPhone] = useState('2547');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [paying, setPaying] = useState(false);
  async function pay() {
    setStatus('');
    setPaying(true);
    try {
      const payload = { amount: 5, modelSlug: 'amina-w', purpose: 'vip_visibility', description: 'Secret Nairobi VIP visibility - 1 month' };
      if (method === 'mpesa') {
        const result: any = await utamuApi.createMpesaPayment({ ...payload, phone });
        setStatus(result.instructions || 'STK push sent. Enter your PIN on your phone and keep this page open.');
      } else {
        const result: any = await utamuApi.createPaystackPayment({ ...payload, email });
        if (result.authorizationUrl && typeof window !== 'undefined') window.location.href = result.authorizationUrl;
        setStatus(result.authorizationUrl ? 'Opening Paystack checkout...' : 'Paystack checkout could not be opened.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Payment could not be started.');
    } finally {
      setPaying(false);
    }
  }
  return <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-5 lg:grid-cols-[0.9fr_1.1fr] lg:py-10"><div className="grid min-h-[280px] place-items-center rounded-2xl border border-[#2a2a2a] bg-[radial-gradient(circle_at_top,#5c1746,#161016_62%)] p-6 text-center sm:min-h-[440px]"><div><StatusBadge tone="gold">Featured placement</StatusBadge><p className="mt-5 font-display text-4xl font-bold text-[#fff6df]">Real escorts first</p><p className="mx-auto mt-3 max-w-xs text-sm text-[#d0c6ab]">VIP upgrades boost approved profiles without showing sample listings.</p></div></div><div className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-6"><StatusBadge tone="gold">VIP Visibility</StatusBadge><h1 className="mt-4 font-display text-4xl font-bold text-[#fff6df]">Upgrade to VIP visibility</h1><p className="mt-3 text-[#d0c6ab]">Ksh 5 places the selected escort in VIP ranking for 1 month during testing.</p><div className="mt-6 rounded-xl border border-[#353534] bg-[#201f1f] p-4"><div className="flex justify-between"><span>VIP visibility</span><strong className="text-[#ffd700]">Ksh 5</strong></div><div className="mt-3 flex justify-between text-sm text-[#999077]"><span>Duration</span><span>1 month</span></div></div><div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-[#201f1f] p-1">{(['mpesa', 'paystack'] as const).map((item) => <button key={item} onClick={() => setMethod(item)} className={'rounded-lg px-4 py-3 text-sm font-bold ' + (method === item ? 'bg-[#ff4eb8] text-white' : 'text-[#d0c6ab] hover:bg-white/5')}>{item === 'mpesa' ? 'M-Pesa' : 'Paystack'}</button>)}</div>{method === 'mpesa' ? <><label className="mt-5 block text-sm font-semibold text-[#d0c6ab]">M-Pesa phone number</label><input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-lg border border-[#353534] bg-[#201f1f] p-4 text-[#fff6df]" /></> : <><label className="mt-5 block text-sm font-semibold text-[#d0c6ab]">Email address</label><input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-[#353534] bg-[#201f1f] p-4 text-[#fff6df]" placeholder="name@example.com" /></>}<button disabled={paying} onClick={pay} className="mt-5 w-full rounded-lg bg-[#25d366] px-5 py-4 font-bold text-white disabled:opacity-60">{paying ? 'Starting payment...' : method === 'mpesa' ? 'Send STK push' : 'Continue to Paystack'}</button>{status && <p className="mt-4 rounded-lg border border-[#61f595]/30 bg-[#61f595]/10 p-4 text-sm text-[#6bfe9c]">{status}</p>}</div></section>;
}


function ReviewScreen() {
  const directory = useUtamuDirectory();
  const [remoteReviews, setRemoteReviews] = useState<any[]>([]);
  useEffect(() => {
    utamuApi.getReviews().then((items: any) => setRemoteReviews(Array.isArray(items) ? items : []));
  }, []);
  const sourceReviews = remoteReviews.length ? remoteReviews : directory.reviews;
  const reviewItems = sourceReviews.map((review: any, index: number) => {
    const modelName = review.modelName || review.model_name || review.model || 'Secret Nairobi escort';
    const model = directory.models.find((item) => item.name === modelName || item.slug === review.modelSlug || item.slug === review.model_slug);
    return {
      id: review.id || modelName + '-' + index,
      modelName,
      modelSlug: model?.slug || review.modelSlug || review.model_slug || '',
      modelImage: review.modelImage || review.model_image || model?.image || '',
      author: review.author || review.author_name || (review.anonymous ? 'Anonymous member' : 'Normal user'),
      rating: Math.max(1, Math.min(5, Number(review.rating || 5))),
      body: review.body || 'The profile was reviewed by a registered member.',
      createdAt: review.createdAt || review.created_at || new Date().toISOString(),
    };
  });
  return <div className="grid gap-0 bg-[#fff0f6] lg:grid-cols-[1fr_220px]"><section className="px-4 py-5 text-[#003b5c] md:px-5"><div className="mb-6 flex items-center justify-between gap-3"><h1 className="text-xl font-normal text-[#3b164b]">Escort Reviews</h1><a href="/reviews/ratings#submit-review" className="rounded-[3px] bg-[#e60073] px-4 py-2 text-sm font-bold text-white">Agency Reviews</a></div><div className="space-y-8">{reviewItems.length === 0 && <p className="bg-white p-5 text-sm text-[#7b6e78]">No real profile reviews have been submitted yet.</p>}{reviewItems.map((review) => <article key={review.id} className="grid gap-4 sm:grid-cols-[145px_1fr]">{review.modelImage ? <img src={review.modelImage} alt={review.modelName + ' escort profile'} className="h-[210px] w-full rounded-[3px] object-cover sm:w-[145px]" /> : <div className="grid h-[210px] place-items-center rounded-[3px] bg-white p-4 text-center text-xs font-bold uppercase tracking-wide text-[#9b8090] sm:w-[145px]">Real image pending</div>}<div className="pt-1"><div className="flex flex-wrap items-center gap-2 text-sm"><span className="flex">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={'h-4 w-4 ' + (star <= review.rating ? 'fill-[#f3c300] text-[#f3c300]' : 'text-[#9ac8e6]')} />)}</span><span className="italic text-[#00627c]">submitted by</span><strong className="text-[#00627c]">{review.author}</strong><span>for</span>{review.modelSlug ? <a href={'/escort/' + review.modelSlug} className="font-bold text-[#e60073]">{review.modelName}</a> : <strong className="text-[#e60073]">{review.modelName}</strong>}<span>on {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div><p className="mt-5 max-w-3xl text-sm leading-7">{review.body}</p></div></article>)}</div><form id="submit-review" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); utamuApi.submitReview({ modelSlug: form.get('modelSlug'), author: form.get('author'), rating: Number(form.get('rating') || 5), body: form.get('body') }).then((item: any) => setRemoteReviews((current) => [item, ...current])); event.currentTarget.reset(); }} className="mt-10 rounded-[3px] border border-[#ffd1e8] bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Submit a review</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><input name="author" placeholder="Your name" className={fieldClass} /><select name="modelSlug" className={selectClass} disabled={!directory.models.length}>{directory.models.length ? directory.models.map((model) => <option key={model.id} value={model.slug}>{model.name}</option>) : <option>No real profiles yet</option>}</select><select name="rating" className={selectClass}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select></div><textarea name="body" placeholder="Write a concise review" className="mt-3 min-h-28 w-full border border-[#ff55c7] p-3 text-sm outline-none" /><button disabled={!directory.models.length} className="mt-3 rounded-full bg-[#ff4eb8] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">Submit review</button></form></section><RegistrationQuickSearch /></div>;
}


function AdminScreen({ path }: { path: string }) {
  const { verificationCases, analytics } = useUtamuDirectory();
  if (path.includes('analytics')) {
    return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5"><h1 className="font-display text-3xl font-bold text-[#fff6df] sm:text-4xl">Admin analytics</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{[['Revenue', kes(analytics.revenue)], ['Bookings', analytics.bookings], ['Approval rate', `${analytics.approvalRate}%`], ['Active escorts', analytics.activeModels]].map(([label, value]) => <div key={String(label)} className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-5"><p className="text-xs uppercase tracking-widest text-[#999077]">{String(label)}</p><strong className="mt-3 block font-display text-2xl text-[#fff6df]">{String(value)}</strong></div>)}</div><div className="mt-6 grid h-64 grid-cols-8 items-end gap-2 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:h-72 sm:gap-3 sm:p-6">{analytics.chart.map((height, index) => <div key={index} className="rounded-t-lg bg-[#ffd700]" style={{ height: `${height}%` }} />)}</div></section>;
  }
  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5"><h1 className="font-display text-3xl font-bold text-[#fff6df] sm:text-4xl">Verification review</h1><div className="mt-6 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]"><aside className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4">{verificationCases.map((item) => <div key={item.id} className="mb-3 rounded-xl border border-[#353534] bg-[#201f1f] p-4"><p className="font-semibold text-[#fff6df]">{item.modelName}</p><p className="text-xs text-[#999077]">{item.id} - {item.submittedAt}</p><StatusBadge tone={item.status === 'rejected' ? 'red' : item.status === 'pending' ? 'gold' : 'green'}>{item.status}</StatusBadge></div>)}</aside><div className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-6"><h2 className="font-display text-2xl font-bold text-[#fff6df]">{verificationCases[0]?.modelName ? `${verificationCases[0].modelName} compliance packet` : 'Real verification packet'}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{['ID document', 'Selfie match', 'M-Pesa owner'].map((item) => <div key={item} className="rounded-xl border border-[#353534] bg-[#201f1f] p-4"><FileCheck2 className="mb-8 h-6 w-6 text-[#ffd700]" /><p className="font-semibold">{item}</p><p className="text-xs text-[#999077]">Ready for review</p></div>)}</div><div className="mt-6 flex flex-wrap gap-3"><button className="rounded-lg bg-[#61f595] px-5 py-3 font-bold text-[#00210c]">Approve</button><button className="rounded-lg bg-[#93000a] px-5 py-3 font-bold text-[#ffdad6]">Reject</button><button className="rounded-lg border border-[#4d4732] px-5 py-3 font-semibold text-[#fff6df]">Request changes</button></div></div></div></section>;
}

function MessagesScreen() {
  const [session, setSession] = useState<UtamuSession | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    const next = readSession();
    setSession(next);
    if (next?.token) utamuApi.getMessages(next.token).then((items: any) => setMessages(Array.isArray(items) ? items : []));
  }, []);
  if (!session?.token) return <section className="bg-[#fff0f6] px-5 py-16"><div className="rounded bg-[#d70032] p-4 text-center font-bold text-white">You need to <a className="underline" href="/register">register</a> or <a className="underline" href="/login">login</a> to send and read messages</div></section>;
  return <section className="bg-[#fff0f6] px-5 py-8"><h1 className="text-3xl text-[#ff4eb8]">Messages</h1><div className="mt-5 grid gap-3">{messages.length === 0 && <p className="bg-white p-5 text-sm">No messages yet.</p>}{messages.map((message) => <article key={message.id} className="bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><strong className="text-[#3b164b]">{message.subject}</strong><span className="text-xs text-[#9b8090]">{new Date(message.created_at).toLocaleString()}</span></div><p className="mt-2 text-sm text-[#7b6e78]">From {message.sender_name} about {message.model_name || message.model_slug || 'profile'}</p><p className="mt-3 text-sm leading-6">{message.body}</p></article>)}</div></section>;
}

function NotificationScreen() {
  return <section className="grid min-h-[calc(100vh-80px)] place-items-center bg-[#0e0e0e] px-5 py-10"><div className="w-full max-w-sm rounded-[2rem] border border-[#353534] bg-black p-4 shadow-2xl"><div className="rounded-[1.5rem] bg-[#131313] p-5"><p className="text-center text-xs text-[#999077]">Monday, 29 June</p><div className="mt-8 rounded-2xl border border-[#4d4732] bg-[#201f1f]/90 p-4 backdrop-blur"><div className="flex items-center gap-3"><Bell className="h-6 w-6 text-[#ffd700]" /><div><p className="font-semibold text-[#fff6df]">Secret Nairobi Verification</p><p className="text-xs text-[#999077]">Now</p></div></div><p className="mt-3 text-sm text-[#d0c6ab]">Your application needs clearer documents. Tap to review and re-submit.</p></div><a href="/verification/rejected" className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-[#ffd700] px-5 py-3 font-bold text-[#221b00]"><Lock className="h-4 w-4" />Open Secret Nairobi</a></div></div></section>;
}

function Panel({ title, icon: Icon, items }: { title: string; icon: typeof Gauge; items: string[] }) {
  return <div className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-6"><Icon className="mb-6 h-7 w-7 text-[#ffd700]" /><h2 className="font-display text-2xl font-bold text-[#fff6df]">{title}</h2><div className="mt-4 grid gap-3">{items.map((item) => <div key={item} className="flex items-center justify-between rounded-xl border border-[#353534] bg-[#201f1f] p-3 text-sm text-[#d0c6ab]"><span>{item}</span><ChevronRight className="h-4 w-4" /></div>)}</div></div>;
}

function RouteIndex() {
  return <section className="mx-auto max-w-7xl px-4 py-10 pb-28 sm:px-5"><h2 className="font-display text-2xl font-bold text-[#fff6df]">Connected Secret Nairobi routes</h2><div className="mt-4 flex flex-wrap gap-2">{routeLinks.map((route) => <a key={route} href={route} className="rounded-full border border-[#4d4732] bg-[#1e1e1e] px-4 py-2 text-sm text-[#d0c6ab] hover:border-[#ffd700]">{route}</a>)}</div></section>;
}

export default function UtamuApp({ slug }: UtamuAppProps) {
  const path = useMemo(() => slug?.join('/') || '', [slug]);
  const view = viewFor(slug);
  return <Shell>{view === 'home' && <DiscoveryHome />}{view === 'advancedSearch' && <AdvancedSearchScreen />}{view === 'register' && <RegisterScreen />}{view === 'registration' && <RegistrationFormScreen path={path} />}{view === 'confirm' && <ConfirmEmailScreen />}{view === 'profile' && <ProfileScreen path={path} />}{view === 'dashboard' && <DashboardScreen path={path} />}{view === 'messages' && <MessagesScreen />}{view === 'monetization' && <MonetizationScreen />}{view === 'clientPortal' && <ClientPortalScreen />}{view === 'verification' && <VerificationScreen path={path} />}{view === 'checkout' && <CheckoutScreen />}{view === 'review' && <ReviewScreen />}{view === 'admin' && <AdminScreen path={path} />}{view === 'notification' && <NotificationScreen />}{!['home', 'advancedSearch', 'register', 'registration', 'confirm', 'profile', 'dashboard', 'messages', 'monetization', 'clientPortal', 'verification', 'checkout', 'review', 'admin', 'notification'].includes(view) && <RouteIndex />}</Shell>;
}
