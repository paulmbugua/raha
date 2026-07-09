'use client';

import { Bell, Check, ChevronRight, FileCheck2, Gauge, Lock, Mail, MessageCircle, Search, ShieldCheck, Star, Upload, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { UtamuModel } from '../../data/utamu';
import { models } from '../../data/utamu';
import { utamuApi } from '../../lib/utamuApi';
import { useUtamuDirectory } from '../../hooks/useUtamuDirectory';

type UtamuAppProps = { slug?: string[] };

type UtamuSession = { token: string; user: { id?: string; username?: string; email?: string; fullName?: string; accountType?: string; emailVerified?: boolean } | null };
type View = 'home' | 'register' | 'registration' | 'confirm' | 'profile' | 'dashboard' | 'messages' | 'verification' | 'checkout' | 'review' | 'admin' | 'notification';

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
  '/register',
  '/register/independent-model',
  '/register/agency',
  '/register/member',
  '/register/confirm-email',
  '/messages',
  '/model/amina-w',
  '/model/profile',
  '/model/dashboard',
  '/model/dashboard-pending-verification',
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
  if (path === 'register') return 'register';
  if (path === 'register/confirm-email' || path === 'register/complete') return 'confirm';
  if (path.startsWith('register/')) return 'registration';
  if (path === 'messages') return 'messages';
  if (['edit-profile', 'change-password', 'verify-account', 'blacklisted-clients', 'logout'].includes(path)) return 'dashboard';
  if (path.startsWith('admin')) return 'admin';
  if (path.startsWith('checkout')) return 'checkout';
  if (path.startsWith('reviews')) return 'review';
  if (path.startsWith('notifications')) return 'notification';
  if (path.startsWith('verification')) return 'verification';
  if (path.includes('dashboard')) return 'dashboard';
  if (path.startsWith('model')) return 'profile';
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
    <main className="min-h-screen overflow-x-hidden bg-[#101010] font-serif text-[#2b1037] selection:bg-[#ec2aa0] selection:text-white">
      <div className="mx-auto w-full max-w-[1180px] bg-[#fff0f6] shadow-2xl shadow-black/40">
        <header className="bg-[#2b0a3d] text-white">
          <div className="flex min-h-[72px] flex-col items-stretch gap-3 px-3 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <a href="/" className="text-center font-serif text-3xl font-bold italic leading-none tracking-tight text-white [text-shadow:0_2px_0_#8b6a9b] sm:text-4xl lg:text-left lg:text-5xl">Secret Nairobi</a>
            <nav className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold sm:text-sm lg:flex-1 lg:justify-start">
              <a href="/" className="rounded-full bg-[#ec4eb8] px-3 py-2 text-white shadow-sm sm:px-4">All Nairobi Models</a>
              <a href="/admin/verification-review" className="hover:text-[#ffb7df]">Agencies</a>
              <a href="/reviews/ratings" className="hover:text-[#ffb7df]">Reviews</a>
              <a href="/register" className="uppercase hover:text-[#ffb7df]">Advertise here</a>
            </nav>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold sm:text-sm lg:justify-end">
              {!session && <a href="/register" className="rounded-full bg-[#ec4eb8] px-3 py-2">Register</a>}
              {!session ? <a href="/login" className="rounded-full bg-[#ec4eb8] px-3 py-2">Login</a> : <a href="/model/dashboard" className="rounded-full bg-[#ec4eb8] px-3 py-2">My Account</a>}
              <form action="/discover" className="flex items-center overflow-hidden rounded-full bg-white/10">
                <input name="query" aria-label="Search models" placeholder="Search" className="h-8 w-24 bg-transparent px-3 text-xs text-white outline-none placeholder:text-white/70 sm:w-36" />
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

function ModelCard({ model, index = 0 }: { model: UtamuModel; index?: number }) {
  const verified = model.verified || index < 8;
  const isNew = index >= 8;
  return (
    <a href={`/model/${model.slug}`} className="group relative block overflow-hidden rounded-[3px] border border-[#ff6d73] bg-white shadow-sm">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={model.image} alt={`${model.name} Nairobi model portfolio`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute right-[-34px] top-3 rotate-45 bg-gradient-to-r from-[#ff8a00] to-[#ffbd00] px-9 py-1 text-[10px] font-bold uppercase text-white shadow">VIP</div>
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between bg-gradient-to-r from-[#bc3c96]/80 via-[#e86ab7]/75 to-[#bc3c96]/80 px-2 py-1 text-white">
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
  const { filteredModels, actions } = useUtamuDirectory();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    actions.setQuery(params.get('query') || '');
  }, []);
  const directoryModels = Array.from({ length: 48 }, (_, index) => {
    const base = filteredModels[index % filteredModels.length] || models[index % models.length];
    const names = ['Sara', 'Mila', 'Emma', 'Sofia', 'Fiona', 'Evelyn', 'Susi', 'Model Neha', 'Elexx', 'Lussia', 'Bela', 'Eisha', 'Nadia', 'Ivy', 'Renee', 'Tasha'];
    return { ...base, id: `home-${index}`, name: names[index] || base.name, verified: index < 9, elite: true };
  });

  return (
    <>
      <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
        <section className="bg-[#fff0f6] px-4 py-5 md:px-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-normal text-[#3b164b]">All models</h1>
            <div className="flex flex-wrap gap-2 text-sm">
              {['Female', 'Independent', 'VIP', 'New'].map((item) => <a key={item} href="/discover" className="rounded-full border border-[#d3e8f4] bg-[#eef9ff] px-4 py-2 text-[#ec2aa0]">{item}</a>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {directoryModels.map((model, index) => <ModelCard key={model.id} model={model} index={index} />)}
          </div>
          <div className="mt-8 flex justify-center gap-1 text-sm font-bold text-white">
            {['1', '2', '...', '9', '10'].map((page) => <a key={page} href="/discover" className="grid h-7 min-w-7 place-items-center rounded-full bg-[#ec2aa0] px-2">{page}</a>)}
          </div>
        </section>
        <aside className="bg-[#101010] text-white">
          <div className="bg-[#e60073] px-4 py-5">
            <h2 className="mb-3 text-base font-bold">Quick Search:</h2>
            <div className="space-y-3 text-sm">
              <select className="w-full rounded-none border border-white bg-white px-2 py-2 text-[#6b5c6b]"><option>Country</option><option>Kenya</option></select>
              <select className="w-20 rounded-none border border-white bg-white px-2 py-2 text-[#6b5c6b]"><option>Fem...</option><option>Female</option></select>
              <label className="flex items-center gap-2"><input type="checkbox" />Only VIP</label>
              <label className="flex items-center gap-2"><input type="checkbox" />Only independent</label>
              <div className="text-center"><button className="rounded-full bg-white px-7 py-2 font-bold text-[#e60073]">Search</button></div>
              <a href="/discover" className="block text-center text-[#ffd6ec]">Advanced search</a>
            </div>
          </div>
          <div className="hidden min-h-[760px] bg-[#101010] lg:block" />
        </aside>
      </div>
      <section className="border-t border-[#ffd7e6] bg-[#fff0f6] px-4 py-6 text-[#111] md:px-5">
        <h2 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl">Secret Nairobi Models - Home Of The Most Alluring Talent</h2>
        <p className="mb-3 text-[15px] leading-7">Entertainment, events, fashion, and lifestyle productions across Nairobi need dependable talent with polished presentation and professional communication. Secret Nairobi Models gives clients a simple way to browse verified profiles, compare styles, review availability, and connect with models suited for campaigns, hospitality, launches, brand shoots, and private creative bookings.</p>
        <p className="mb-3 text-[15px] leading-7">Our directory focuses on elegant presentation, quick discovery, and transparent profile signals. You can explore independent models, VIP profiles, new listings, and verified members from one place. Nairobi offers a deep pool of creative talent ready to bring your concept to life.</p>
        <h3 className="mb-2 text-2xl font-bold">We Serve The Best Model Directory Experience In Kenya</h3>
        <p className="text-[15px] leading-7">At Secret Nairobi, our listed models are presented with clear photos, verification labels, review flows, and profile details so clients can make informed decisions. Whether you prefer studio talent, event hosts, commercial faces, runway profiles, or lifestyle creators, our goal is to make discovery fast, attractive, and easy to navigate.</p>
      </section>
      <footer className="bg-[#2b0a3d] px-5 py-5 text-center text-sm text-white">
        <div className="mb-2 font-serif text-3xl font-bold italic">Secret Nairobi</div>
        <div className="flex flex-wrap justify-center gap-4 font-bold text-[#ffb7df]"><a href="/">All Nairobi Models</a><a href="/admin/verification-review">Agencies</a><a href="/reviews/ratings">Reviews</a><a href="/register">Advertise here</a></div>
      </footer>
    </>
  );
}


function RegisterScreen() {
  const plans = [
    {
      title: 'Register as Independent Model',
      price: 'Free',
      cta: 'Register here',
      ctaHref: '/register/independent-model',
      features: ['Add a single profile', 'Add portfolio pictures', 'Add contact information', 'Upgrade to VIP visibility', 'Manage blocked clients', 'Profile analytics and messages'],
      highlight: 'Ksh 1,000 for 1 month',
    },
    {
      title: 'Register as Agency',
      price: 'Ksh 5,000 for 1 month',
      cta: 'Register here',
      ctaHref: '/register/agency',
      features: ['Add multiple profiles', 'Add profile pictures', 'Add contact information', 'Upgrade agency listings to VIP', 'Add internal notes', 'Manage verification workflow'],
      highlight: 'Ksh 1,000 for 1 month',
    },
    {
      title: 'Register as Normal User',
      price: 'Free',
      cta: 'Register here',
      ctaHref: '/register/member',
      features: ['Mark favorite profiles', 'See profile photos', 'Contact verified models', 'Add reviews to models you rate', 'Save Nairobi searches', 'Receive profile updates'],
    },
  ];
  const infoBlocks = [
    {
      title: 'Why Choose Our Models In Nairobi?',
      body: 'Secret Nairobi makes model discovery direct, attractive, and organized. Clients can compare verified profiles, browse portfolio images, review availability signals, and choose talent suited for campaigns, launches, hospitality, shoots, and lifestyle events across Nairobi.',
    },
    {
      title: 'The Gratifying Professional Services',
      body: 'Every profile flow is built around presentation quality and trust. Independent models can manage their own listing, agencies can coordinate multiple profiles, and clients get a familiar directory experience with clear account paths and visible verification cues.',
    },
    {
      title: 'Affordable Models Make Life Enjoyable',
      body: 'The platform keeps discovery simple for everyone. Free user accounts support favorites and reviews, while model and agency accounts can upgrade visibility through VIP placement when they need stronger exposure in the Nairobi directory.',
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
                {plan.highlight && <div className="mt-3 text-center"><span className="inline-flex bg-[#1fbfa5] px-2 py-1 text-xs font-bold text-white">{plan.highlight}</span></div>}
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
        <p>This platform is intended for adults creating or browsing professional model profiles. By entering, you confirm that you will use the site responsibly, respect listed members, and follow all applicable booking, privacy, and platform safety rules.</p>
        <div className="mt-5 font-bold text-[#2b0a3d]">ADULTS only or <a href="/" className="text-[#e60073]">LEAVE THE SITE NOW!</a></div>
      </section>
      <footer className="bg-[#fff0f6] px-4 pb-5 text-center text-xs text-[#e60073] md:px-5">
        <div className="mb-4 flex flex-wrap justify-center gap-2"><a href="/">Secret Nairobi</a><span>-</span><a href="/login">Login</a><span>-</span><a href="/register">Register</a><span>-</span><a href="/privacy-policy">Privacy Policy</a><span>-</span><a href="/terms">Terms and Conditions</a><span>-</span><a href="/help">Contact</a><span>-</span><a href="/sitemap.xml">Sitemap</a></div>
        <div className="-mx-4 bg-[#101010] py-2 text-white md:-mx-5">(c) 2026 SecretNairobi.com - Models in Nairobi</div>
      </footer>
    </>
  );
}


function RegistrationQuickSearch() {
  return (
    <aside className="bg-[#101010] text-white">
      <div className="bg-[#e60073] px-4 py-5">
        <h2 className="mb-3 text-base font-bold">Quick Search:</h2>
        <div className="space-y-3 text-sm">
          <select className="w-full rounded-none border border-white bg-white px-2 py-2 text-[#6b5c6b]"><option>Country</option><option>Kenya</option></select>
          <select className="w-20 rounded-none border border-white bg-white px-2 py-2 text-[#6b5c6b]"><option>Fem...</option><option>Female</option></select>
          <label className="flex items-center gap-2"><input type="checkbox" />Only VIP</label>
          <label className="flex items-center gap-2"><input type="checkbox" />Only independent</label>
          <div className="text-center"><button className="rounded-full bg-white px-7 py-2 font-bold text-[#e60073]">Search</button></div>
          <a href="/discover" className="block text-center text-[#ffd6ec]">Advanced search</a>
        </div>
      </div>
      <div className="min-h-full bg-[#101010]" />
    </aside>
  );
}

function RegistrationFooter() {
  return (
    <>
      <section className="bg-[#fff0f6] px-5 py-16 text-[#111] md:py-20">
        <div className="grid gap-10 md:grid-cols-3">
          <article><h2 className="mb-5 text-xl font-bold text-[#9b9098]">Why Choose Our Models In Nairobi?</h2><p className="text-[15px] leading-8">Secret Nairobi makes registration clear for models, agencies, and members. Every account path is organized around profile quality, communication, verification, and safe discovery.</p></article>
          <article><h2 className="mb-5 text-xl font-bold text-[#9b9098]">The Gratifying Professional Services</h2><p className="text-[15px] leading-8">Independent models can prepare a complete public profile, agencies can coordinate multiple listings, and members can create lightweight accounts for favorites, reviews, and saved browsing.</p></article>
          <article><h2 className="mb-5 text-xl font-bold text-[#9b9098]">Affordable Models Make Life Enjoyable</h2><p className="text-[15px] leading-8">The platform keeps Nairobi discovery simple while giving premium accounts stronger visibility through VIP placement, profile completeness, and trusted account signals.</p></article>
        </div>
        <p className="mx-auto mt-12 max-w-5xl text-center text-[14px] leading-7 text-[#b3a7af]">This platform is intended for adults creating or browsing professional model profiles. By entering, you confirm that you will use the site responsibly, respect listed members, and follow all applicable booking, privacy, and platform safety rules.</p>
        <div className="mt-6 text-center font-bold text-[#2b0a3d]">ADULTS only or <a href="/" className="text-[#e60073]">LEAVE THE SITE NOW!</a></div>
        <div className="mt-10 flex flex-wrap justify-center gap-2 text-center text-xs text-[#e60073]"><a href="/">Secret Nairobi</a><span>-</span><a href="/login">Login</a><span>-</span><a href="/register">Register</a><span>-</span><a href="/privacy-policy">Privacy Policy</a><span>-</span><a href="/terms">Terms and Conditions</a><span>-</span><a href="/help">Contact</a><span>-</span><a href="/sitemap.xml">Sitemap</a></div>
      </section>
      <footer className="bg-[#101010] px-5 py-2 text-center text-xs font-bold text-white">(c) 2026 SecretNairobi.com - Models in Nairobi</footer>
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

function RegistrationFormScreen({ path }: { path: string }) {
  const kind = path.split('/')[1] || 'member';
  const isIndependent = kind === 'independent-model';
  const isAgency = kind === 'agency';
  const isMember = kind === 'member';
  const title = isIndependent ? 'Independent Model Registration' : isAgency ? 'Register as Agency' : 'Member Registration';
  const formMinHeight = isIndependent ? 'lg:min-h-[2080px]' : isAgency ? 'lg:min-h-[980px]' : 'lg:min-h-[720px]';
  const services = ['Portfolio shoots', 'Brand launches', 'Hospitality hosting', 'Fashion campaigns', 'Beauty content', 'Runway presentation', 'Lifestyle production', 'Commercial creator work', 'Event appearance', 'Travel-ready bookings', 'VIP visibility', 'Agency management'];
  const agencyServices = ['Independent model management', 'Portfolio coordination', 'Client vetting', 'Campaign staffing', 'Event staffing', 'Verification support', 'Image review', 'Booking calendar', 'VIP placement', 'Multi-city coverage', 'Model onboarding', 'Brand partnerships'];
  const memberPreferences = ['Save favorite profiles', 'Compare model profiles', 'Request booking details', 'Follow verified models', 'Review completed bookings', 'Receive availability updates', 'Browse VIP profiles', 'Contact agencies'];
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
    const result = await utamuApi.registerAccount(payload);
    setSubmitting(false);
    if (!(result as any).registrationComplete) {
      setRegistrationError('Registration could not be completed. Please check your details and try again.');
      return;
    }
    setRegistrationResult(result);
    window.localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(result));
    window.history.pushState({}, '', '/register/confirm-email');
  }

  if (registrationResult) return <ConfirmEmailScreen pending={registrationResult} />;

  return (
    <>
      <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
        <section className={'min-w-0 bg-[#fff0f6] px-4 py-5 text-[#003b5c] sm:px-5 ' + formMinHeight}>
          <h1 className="text-2xl font-normal text-[#3b164b]">{title}</h1>
          {isMember && <div className="mt-5 bg-[#d70032] py-2 text-center text-sm font-bold text-white">Models should register here</div>}
          <p className="mt-4 text-xs">Fields marked with <span className="font-bold text-[#ff1493]">*</span> are mandatory</p>
          <form className="mt-7 space-y-6" onSubmit={handleRegistrationSubmit}>
            <FormRow label="Username" hint="Between 4 and 30 characters" required><input name="username" className={fieldClass} /></FormRow>
            <FormRow label="Password" hint="Must be between 6 and 50 characters" required><input name="password" type="password" className={fieldClass} /></FormRow>
            {!isMember && <FormRow label={isAgency ? 'Email' : 'Your email'} required><input name="email" type="email" className={fieldClass} /></FormRow>}
            {isMember && <FormRow label="Name" hint="will be publicly shown" required><input name="name" className={fieldClass} /></FormRow>}
            {isMember && <FormRow label="Email" required><input name="email" type="email" className={fieldClass} /></FormRow>}
            {isMember && <FormRow label="City"><select className={selectClass + ' w-full'}>{kenyanTowns.map((town) => <option key={town}>{town}</option>)}</select></FormRow>}
            {isMember && <FormRow label="Browsing interest"><select className={selectClass + ' w-full'}><option>Verified Nairobi models</option><option>VIP models</option><option>Agency represented models</option><option>Portfolio and campaign talent</option></select></FormRow>}
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
                <FormRow label="Gender" required><select className={selectClass + ' w-full'}><option>Female</option><option>Male</option></select></FormRow>
                <FormRow label="Date of birth" hint="we calculate your age from this" required><div className="grid gap-2 sm:grid-cols-3"><select className={selectClass + ' w-full'}><option>Year</option>{birthYears.map((year) => <option key={year}>{year}</option>)}</select><select className={selectClass + ' w-full'}><option>Month</option>{birthMonths.map((month) => <option key={month}>{month}</option>)}</select><select className={selectClass + ' w-full'}><option>Date</option>{birthDays.map((day) => <option key={day}>{day}</option>)}</select></div></FormRow>
                <FormRow label="Ethnicity" required><select className={selectClass + ' w-full'}><option>Select ethnicity</option>{kenyanEthnicities.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Hair Color" required><select className={selectClass + ' w-full'}><option>Select hair color</option>{hairColors.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Hair length" required><select className={selectClass + ' w-full'}><option>Select hair length</option>{hairLengths.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Bust size" required><select className={selectClass + ' w-full'}><option>Select bust size</option>{bustSizes.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Build" required><select className={selectClass + ' w-full'}><option>Select build</option>{buildOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Looks" required><select className={selectClass + ' w-full'}><option>Select looks</option>{lookOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Height" required><select className={selectClass + ' w-full'}><option>Select height</option>{heightOptions.map((height) => <option key={height}>{height} cm</option>)}</select></FormRow>
                <FormRow label="Weight" required><select className={selectClass + ' w-full'}><option>Select weight</option>{weightOptions.map((weight) => <option key={weight}>{weight} kg</option>)}</select></FormRow>
                <FormRow label="Availability" required><div className="grid gap-2 sm:grid-cols-2">{['Studio / incall', 'On-location / outcall'].map((item) => { const selected = selectedAvailability.includes(item); return <button type="button" key={item} onClick={() => toggleAvailability(item)} className={serviceTileBaseClass + ' ' + (selected ? serviceTileSelectedClass : serviceTileIdleClass)}><span className={'grid h-5 w-5 shrink-0 place-items-center rounded-full border ' + (selected ? 'border-white bg-white text-[#e60073]' : 'border-[#ff8bc6] bg-white text-transparent')}><Check className="h-3.5 w-3.5" /></span>{item}</button>; })}</div></FormRow>
                <FormRow label="Smoker" required><select className={selectClass + ' w-full'}>{smokerOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="About you" required><textarea className="min-h-36 w-full border border-[#ff55c7] bg-white p-2 text-sm text-[#111] outline-none" /><span className="mt-1 block text-xs text-[#a99aa5]">html code will be removed</span></FormRow>
                <FormRow label="Professional orientation"><select className={selectClass + ' w-full'}><option>Select orientation</option>{orientationOptions.map((item) => <option key={item}>{item}</option>)}</select></FormRow>
                <FormRow label="Languages spoken"><div className="space-y-2">{[0, 1, 2].map((item) => <div key={item} className="grid gap-2 sm:grid-cols-[1fr_160px]"><select className={selectClass + ' w-full'}><option>Select language</option>{spokenLanguages.map((language) => <option key={language}>{language}</option>)}</select><select className={selectClass + ' w-full'}><option>Select level</option>{languageLevels.map((level) => <option key={level}>{level}</option>)}</select></div>)}</div></FormRow>
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
  useEffect(() => {
    if (data) return;
    const params = new URLSearchParams(window.location.search);
    const stored = window.localStorage.getItem(PENDING_REGISTRATION_KEY);
    setData(stored ? JSON.parse(stored) : { validationToken: params.get('token'), user: null });
  }, [data]);
  async function confirm() {
    const token = data?.validationToken || new URLSearchParams(window.location.search).get('token');
    if (!token) { setMessage('Validation token is missing. Please resend the validation email.'); return; }
    setConfirming(true);
    const result: any = await utamuApi.confirmEmail(token);
    setConfirming(false);
    if (!result?.token) { setMessage('The validation link could not be confirmed.'); return; }
    saveSession(result);
    window.localStorage.removeItem(PENDING_REGISTRATION_KEY);
    window.location.href = '/model/dashboard';
  }
  async function resend() {
    const email = data?.user?.email;
    if (!email) { setMessage('Email address is missing. Please register again.'); return; }
    await utamuApi.resendValidation(email);
    setMessage('Validation email sent again. Check your inbox or the backend email preview log in development.');
  }
  return <section className="bg-[#fff0f6] px-5 py-8 text-[#003b5c]">
    <div className="rounded-[3px] bg-[#67a62b] py-3 text-center text-2xl text-black">Your registration is complete</div>
    <div className="mt-10 max-w-3xl text-lg leading-8"><p>Before you can use the site you will need to validate your email address.</p><p>We sent a validation link to your email address.</p><p>Please click the link from that email so we can activate your account.</p><p>If you do not validate your email in the next 3 days your account will be deleted.</p></div>
    <div className="mt-6 flex flex-wrap gap-3"><button onClick={confirm} disabled={confirming} className="rounded-[4px] bg-gradient-to-b from-[#ff58bf] to-[#e60073] px-5 py-3 font-bold text-white">{confirming ? 'Confirming...' : 'Confirm email and open account'}</button><button onClick={resend} className="rounded-[4px] border border-[#e60073] px-5 py-3 font-bold text-[#e60073]">Resend validation email</button></div>
    {data?.confirmationUrl && <p className="mt-5 break-all text-sm text-[#8c6f7e]">Development validation link: <a className="text-[#e60073]" href={data.confirmationUrl}>{data.confirmationUrl}</a></p>}
    {message && <p className="mt-4 rounded bg-white p-3 text-sm text-[#d70032]">{message}</p>}
  </section>;
}

function ProfileScreen({ path }: { path: string }) {
  const slug = path.replace(/^model\/?/, '') || 'amina-w';
  const model = models.find((item) => item.slug === slug) || models[0];
  const displayName = model.name.replace(' W.', '').replace(' K.', '').replace(' M.', '').replace(' A.', '') || 'Sara';
  const phone = '+254710474716';
  const gallery = Array.from({ length: 10 }, (_, index) => model.gallery[index % model.gallery.length] || model.image);
  const topRated = Array.from({ length: 8 }, (_, index) => {
    const base = models[index % models.length];
    const names = ['Jenny Nairobi', 'Miss Anna', 'Evelyn', 'Selena no.1 Nairobi', 'Mia', 'Hellen', 'Emma', 'Ivy'];
    return { ...base, id: `top-${index}`, name: names[index] || base.name, verified: true, elite: true };
  });
  const facts = [
    ['Availability', 'Incall, Outcall'],
    ['Ethnicity', 'Kenyan'],
    ['Hair color', 'Blonde'],
    ['Hair length', 'Long'],
    ['Bust size', 'Regular'],
    ['Height', model.height],
    ['Weight', '48kg'],
    ['Build', 'Regular'],
    ['Looks', 'Ultra polished'],
    ['Smoker', 'No'],
    ['Professional style', 'Calm, reliable and polished'],
  ];
  const services = ['Portfolio shoots', 'Brand launches', 'Hospitality hosting', 'Fashion campaigns', 'Beauty content', 'Runway presentation', 'Lifestyle production', 'Commercial creator work', 'Event appearance', 'Travel-ready bookings'];
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  async function startMessage() {
    const session = readSession();
    if (!session?.token) { setLoginPrompt(true); return; }
    setComposerOpen(true);
  }
  async function sendProfileMessage() {
    const session = readSession();
    if (!session?.token) { setLoginPrompt(true); return; }
    await utamuApi.sendMessage({ modelSlug: model.slug, modelName: displayName, message: messageBody, subject: 'Profile enquiry' }, session.token);
    setMessageStatus('Message sent. The model will see it in their account notifications.');
    setMessageBody('');
  }

  return (
    <>
      <div className="grid gap-0 lg:grid-cols-[1fr_220px]">
        <section className="min-w-0 bg-[#fff0f6] px-3 py-5 text-[#2b1037] md:px-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-normal text-[#ff4eb8]">{displayName}</h1>
              <div className="mt-2 flex gap-2 text-[11px] font-bold uppercase text-white"><span className="rounded-full bg-[#ff8a00] px-2 py-1">VIP</span><span className="rounded-full bg-[#18c26a] px-2 py-1">Verified</span></div>
            </div>
            <div className="text-right text-[#ff4eb8]"><div className="text-xs text-[#8d7a88]">call me</div><a href={`tel:${phone}`} className="text-2xl font-bold">{phone}</a></div>
          </div>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
            {gallery.map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${displayName} portfolio ${index + 1}`} className="aspect-[4/5] w-full object-cover" />)}
          </div>
          <section className="mt-6 bg-white p-5">
            <h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">About me:</h2>
            <p className="mt-4 text-[14px] leading-7"><strong>{model.age} years old {model.category} - Independent Nairobi Model.</strong></p>
            <p className="mt-2 text-[14px] leading-7">Hello, my name is {displayName}. I am based around {model.city}, {model.county}, and available for polished model bookings, portfolio shoots, campaigns, brand appearances, hospitality hosting, and creative productions. I keep communication clear, arrive prepared, and work with clients who value professionalism and privacy.</p>
            <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} className="mt-4 inline-flex font-bold text-[#ff1d9b]">WhatsApp Me</a>
          </section>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <section className="bg-white p-5">
              <div className="mb-4 text-center text-[#1598e8]"><div className="text-4xl tracking-widest">*****</div><strong className="block text-[#2b1037]">Model rating</strong><span className="text-sm italic text-[#7b6e78]">{model.reviews} reviews</span></div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
                {facts.map(([label, value]) => <div key={label}><dt className="mb-1 font-bold uppercase text-[#ff4eb8]">{label}</dt><dd>{value}</dd></div>)}
              </dl>
            </section>
            <section className="bg-white p-5">
              <h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Services:</h2>
              <ul className="mt-4 space-y-2 text-[14px]">{services.map((service) => <li key={service} className="flex gap-2"><Check className="h-4 w-4 text-[#25b86b]" /><span>{service}</span></li>)}</ul>
            </section>
            <section className="bg-white p-5">
              <h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Languages spoken:</h2>
              <p className="mt-4 text-[13px]"><strong className="uppercase text-[#ff4eb8]">English:</strong><br />Fluent</p>
              <p className="mt-3 text-[13px]"><strong className="uppercase text-[#ff4eb8]">Swahili:</strong><br />Fluent</p>
            </section>
            <section className="bg-white p-5">
              <h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Rates:</h2>
              <div className="mt-5 grid grid-cols-[1fr_1fr_1fr] text-center text-[13px]"><strong></strong><strong className="bg-[#ff4eb8] py-1 text-white">Studio</strong><strong className="bg-[#ff4eb8] py-1 text-white">Event</strong><strong className="py-3 text-left">1 hour</strong><span className="py-3">{kes(model.priceFrom)}</span><span className="py-3">{kes(model.priceFrom + 2500)}</span></div>
            </section>
            <section className="bg-white p-5">
              <h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Contact info:</h2>
              <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-2 text-[13px]"><dt className="font-bold">Phone:</dt><dd className="text-[#ff4eb8]">{phone}</dd><dt className="font-bold">WhatsApp:</dt><dd><a href={`https://wa.me/${phone.replace(/\D/g, '')}`} className="text-[#ff4eb8]">WhatsApp</a></dd></dl>
              <p className="mt-4 text-[13px] leading-6">Tell us you found this profile on <strong>Secret Nairobi</strong> to improve response handling and platform safety.</p>
              <button onClick={startMessage} className="mt-4 inline-flex rounded-full bg-[#ff4eb8] px-4 py-2 text-xs font-bold text-white"><Mail className="mr-1 h-4 w-4" />Email Me</button>{loginPrompt && <div className="mt-4 flex items-center justify-between rounded-[3px] bg-[#d70032] px-4 py-3 text-sm font-bold text-white"><span>You need to register or login to send messages</span><button onClick={() => setLoginPrompt(false)} className="rounded-full bg-white px-2 py-1 text-xs text-[#d70032]">Close x</button></div>}{composerOpen && <div className="mt-4 rounded border border-[#ffd0e8] bg-[#fff0f6] p-3"><textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder="Write your message" className="min-h-24 w-full border border-[#ff55c7] bg-white p-2 text-sm outline-none" /><button onClick={sendProfileMessage} className="mt-2 rounded-full bg-[#ff4eb8] px-4 py-2 text-xs font-bold text-white">Send message</button>{messageStatus && <p className="mt-2 text-xs text-[#168a4a]">{messageStatus}</p>}</div>}
            </section>
          </div>
          <section className="mt-3 bg-white p-5">
            <div className="flex items-center justify-between"><h2 className="border-l-4 border-[#ff1d9b] pl-3 text-base font-bold uppercase text-[#ff1d9b]">Reviews:</h2><a href="/reviews/ratings" className="rounded-full bg-[#ff4eb8] px-4 py-2 text-xs font-bold text-white">Add Review</a></div>
            <p className="mt-4 text-sm">No reviews yet</p>
          </section>
          <section className="mt-6">
            <h2 className="mb-4 text-xl font-normal text-[#3b164b]">Top Rated Models</h2>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-4">{topRated.map((item, index) => <ModelCard key={item.id} model={item} index={index} />)}</div>
          </section>
        </section>
        <aside className="bg-[#101010] text-white">
          <div className="bg-[#e60073] px-4 py-5">
            <h2 className="mb-3 text-base font-bold">Quick Search:</h2>
            <div className="space-y-3 text-sm"><select className="w-full rounded-none border border-white bg-white px-2 py-2 text-[#6b5c6b]"><option>Country</option><option>Kenya</option></select><select className="w-20 rounded-none border border-white bg-white px-2 py-2 text-[#6b5c6b]"><option>Fem...</option><option>Female</option></select><label className="flex items-center gap-2"><input type="checkbox" />Only VIP</label><label className="flex items-center gap-2"><input type="checkbox" />Only independent</label><div className="text-center"><button className="rounded-full bg-white px-7 py-2 font-bold text-[#e60073]">Search</button></div><a href="/discover" className="block text-center text-[#ffd6ec]">Advanced search</a></div>
          </div>
          <div className="hidden min-h-[1800px] bg-[#101010] lg:block" />
        </aside>
      </div>

      <section className="bg-[#fff0f6] px-5 py-10 text-[#111]">
        <div className="grid gap-10 md:grid-cols-3">
          <article>
            <h2 className="mb-5 text-xl font-bold text-[#9b9098]">Why Choose Our Models In Nairobi?</h2>
            <p className="text-[15px] leading-8">Secret Nairobi makes model discovery direct, attractive, and organized. Clients can compare verified profiles, browse portfolio images, review availability signals, and choose talent suited for campaigns, launches, hospitality, shoots, and lifestyle events across Nairobi.</p>
          </article>
          <article>
            <h2 className="mb-5 text-xl font-bold text-[#9b9098]">The Gratifying Professional Services</h2>
            <p className="text-[15px] leading-8">Every profile flow is built around presentation quality and trust. Independent models can manage their own listing, agencies can coordinate multiple profiles, and clients get a familiar directory experience with clear account paths and visible verification cues.</p>
          </article>
          <article>
            <h2 className="mb-5 text-xl font-bold text-[#9b9098]">Affordable Models Make Life Enjoyable</h2>
            <p className="text-[15px] leading-8">The platform keeps discovery simple for everyone. Free user accounts support favorites and reviews, while model and agency accounts can upgrade visibility through VIP placement when they need stronger exposure in the Nairobi directory.</p>
          </article>
        </div>
        <p className="mx-auto mt-12 max-w-5xl text-center text-[14px] leading-7 text-[#b3a7af]">This platform is intended for adults creating or browsing professional model profiles. By entering, you confirm that you will use the site responsibly, respect listed members, and follow all applicable booking, privacy, and platform safety rules.</p>
        <div className="mt-6 text-center font-bold text-[#2b0a3d]">ADULTS only or <a href="/" className="text-[#e60073]">LEAVE THE SITE NOW!</a></div>
        <div className="mt-10 flex flex-wrap justify-center gap-2 text-center text-xs text-[#e60073]"><a href="/">Secret Nairobi</a><span>-</span><a href="/login">Login</a><span>-</span><a href="/register">Register</a><span>-</span><a href="/privacy-policy">Privacy Policy</a><span>-</span><a href="/terms">Terms and Conditions</a><span>-</span><a href="/help">Contact</a><span>-</span><a href="/sitemap.xml">Sitemap</a></div>
      </section>
      <footer className="bg-[#101010] px-5 py-2 text-center text-xs font-bold text-white">(c) 2026 SecretNairobi.com - Models in Nairobi</footer>
    </>
  );
}

function AccountSidebar({ active }: { active: string }) {
  const links = [['View my Profile', '/model/profile'], ['Edit my Profile', '/edit-profile'], ['Change Password', '/change-password'], ['Verified status', '/verify-account'], ['Blacklisted Clients', '/blacklisted-clients'], ['LogOut', '/logout']];
  return <aside className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 text-lg font-bold text-[#ff1d9b]">My Account</h2><div className="mt-4 grid gap-2">{links.map(([label, href]) => <a key={href} href={href} className={'rounded-[3px] px-3 py-2 text-sm font-bold ' + (active === href.slice(1) ? 'bg-[#e60073] text-white' : 'bg-[#fff0f6] text-[#3b164b] hover:bg-[#ffd6ec]')}>{label}</a>)}</div></aside>;
}

function DashboardScreen({ path = 'model/dashboard' }: { path?: string }) {
  const [session, setSession] = useState<UtamuSession | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (path === 'logout') { clearSession(); window.location.href = '/'; return; }
    const next = readSession();
    setSession(next);
    if (next?.token) utamuApi.getMe(next.token).then(setAccount);
  }, [path]);
  async function addImage() {
    if (!session?.token || !imageUrl) return;
    const image = await utamuApi.addProfileImage({ url: imageUrl }, session.token);
    setAccount((current: any) => ({ ...(current || {}), images: [...(current?.images || []), image] }));
    setImageUrl('');
    setNotice('Image added to your profile.');
  }
  async function changePassword() {
    if (!session?.token) return;
    await utamuApi.changePassword({ password }, session.token);
    setPassword('');
    setNotice('Password changed successfully.');
  }
  if (!session?.token) return <section className="bg-[#fff0f6] px-5 py-16"><div className="rounded bg-[#d70032] p-4 text-center font-bold text-white">You need to <a className="underline" href="/register">register</a> or <a className="underline" href="/login">login</a> to access your account.</div></section>;
  const images = account?.images || [];
  return <section className="grid gap-4 bg-[#fff0f6] px-4 py-6 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="space-y-4"><div className="bg-white p-5"><h1 className="text-3xl text-[#ff4eb8]">My profile dashboard</h1><p className="mt-2 text-sm text-[#7b6e78]">Logged in as {session.user?.fullName || session.user?.email}</p>{notice && <p className="mt-3 rounded bg-[#e6ffe9] p-3 text-sm text-[#147a33]">{notice}</p>}</div><div className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Add profile images</h2><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Paste image URL" className={fieldClass} /><button onClick={addImage} className="rounded-full bg-[#ff4eb8] px-5 py-2 text-sm font-bold text-white">Add image</button></div><div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-4">{images.map((image: any) => <img key={image.id || image.url} src={image.url} alt={image.alt || 'Profile image'} className="aspect-[4/5] w-full object-cover" />)}</div></div>{path === 'edit-profile' && <div className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Edit my profile</h2><textarea className="mt-4 min-h-32 w-full border border-[#ff55c7] p-3" defaultValue={account?.user?.profile?.about || ''} /><button className="mt-3 rounded-full bg-[#ff4eb8] px-5 py-2 text-sm font-bold text-white">Save profile</button></div>}{path === 'change-password' && <div className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Change password</h2><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass + ' mt-4'} placeholder="New password" /><button onClick={changePassword} className="mt-3 rounded-full bg-[#ff4eb8] px-5 py-2 text-sm font-bold text-white">Change password</button></div>}{path === 'verify-account' && <div className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Verified status</h2><p className="mt-4 text-sm">Email: {account?.user?.emailVerified ? 'Verified' : 'Pending validation'}<br />Profile: {account?.model?.verified ? 'Verified' : 'Pending review'}</p><a href="/verification/step-1" className="mt-4 inline-flex rounded-full bg-[#ff4eb8] px-5 py-2 text-sm font-bold text-white">Submit verification</a></div>}{path === 'blacklisted-clients' && <div className="bg-white p-5"><h2 className="border-l-4 border-[#ff1d9b] pl-3 font-bold uppercase text-[#ff1d9b]">Blacklisted Clients</h2><p className="mt-4 text-sm">No blacklisted clients yet.</p></div>}</div><AccountSidebar active={path} /></section>;
}

function VerificationScreen({ path }: { path: string }) {
  const rejected = path.includes('rejected');
  const resubmitted = path.includes('resubmission');
  const submitted = path.includes('submitted') || resubmitted;
  return <section className="mx-auto max-w-3xl px-5 py-10"><div className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-6"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ffd700]/10 text-[#ffd700]">{rejected ? <X className="h-8 w-8" /> : submitted ? <Check className="h-8 w-8" /> : <Upload className="h-8 w-8" />}</div><h1 className="mt-5 text-center font-display text-3xl font-bold text-[#fff6df]">{rejected ? 'Verification rejected' : submitted ? 'Application submitted' : 'Verification step 1'}</h1><p className="mx-auto mt-3 max-w-xl text-center text-[#d0c6ab]">{rejected ? 'Your documents need a clearer upload before your Utamu profile can go live.' : submitted ? 'Your identity verification is in the admin queue. You will receive a notification after review.' : 'Upload ID, selfie proof, service categories, rate card, and M-Pesa payout number for review.'}</p><div className="mt-6 grid gap-3">{['Legal name', 'National ID or passport', 'Live selfie', 'Portfolio images', 'M-Pesa payout phone'].map((field) => <input key={field} placeholder={field} className="rounded-lg border border-[#353534] bg-[#201f1f] p-4 text-[#fff6df] placeholder:text-[#999077]" />)}</div><a href="/verification/submitted" className="mt-5 flex items-center justify-center rounded-lg bg-[#ffd700] px-5 py-3 font-bold text-[#221b00]">Submit for review</a>{rejected && <a href="/verification/re-apply" className="mt-3 flex items-center justify-center rounded-lg border border-[#4d4732] px-5 py-3 font-semibold text-[#fff6df]">Re-apply</a>}</div></section>;
}

function CheckoutScreen() {
  const [phone, setPhone] = useState('2547');
  const [sent, setSent] = useState(false);
  async function pay() {
    await utamuApi.createMpesaPayment({ phone, amount: 500, modelId: 'm-001' });
    setSent(true);
  }
  return <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-5 lg:grid-cols-[0.9fr_1.1fr] lg:py-10"><div className="overflow-hidden rounded-2xl border border-[#2a2a2a]"><img src={models[0].image} alt="Checkout model" className="h-full min-h-[280px] w-full object-cover sm:min-h-[440px]" /></div><div className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-6"><StatusBadge tone="green">M-Pesa Express</StatusBadge><h1 className="mt-4 font-display text-4xl font-bold text-[#fff6df]">Pay with M-Pesa</h1><p className="mt-3 text-[#d0c6ab]">A Ksh 500 verified deposit unlocks secure direct coordination and confirms your account intent.</p><div className="mt-6 rounded-xl border border-[#353534] bg-[#201f1f] p-4"><div className="flex justify-between"><span>Portfolio access deposit</span><strong className="text-[#ffd700]">Ksh 500</strong></div><div className="mt-3 flex justify-between text-sm text-[#999077]"><span>Platform safety fee</span><span>Included</span></div></div><label className="mt-5 block text-sm font-semibold text-[#d0c6ab]">M-Pesa phone number</label><input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-lg border border-[#353534] bg-[#201f1f] p-4 text-[#fff6df]" /><button onClick={pay} className="mt-5 w-full rounded-lg bg-[#25d366] px-5 py-4 font-bold text-white">Send STK push</button>{sent && <p className="mt-4 rounded-lg border border-[#61f595]/30 bg-[#61f595]/10 p-4 text-sm text-[#6bfe9c]">STK push sent. Enter your PIN on your phone and keep this page open.</p>}</div></section>;
}

function ReviewScreen() {
  return <section className="mx-auto max-w-2xl px-5 py-10"><div className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-6"><h1 className="font-display text-2xl font-bold text-[#fff6df] sm:text-3xl">Submit verified review</h1><div className="mt-5 flex gap-2">{[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-8 w-8 fill-[#ffd700] text-[#ffd700]" />)}</div><textarea placeholder="Describe professionalism, punctuality, communication, and accuracy." className="mt-5 min-h-40 w-full rounded-lg border border-[#353534] bg-[#201f1f] p-4 text-[#fff6df] placeholder:text-[#999077]" /><label className="mt-4 flex items-center gap-2 text-sm text-[#d0c6ab]"><input type="checkbox" />Post anonymously</label><button className="mt-5 rounded-lg bg-[#ffd700] px-6 py-3 font-bold text-[#221b00]">Submit review</button><p className="mt-4 text-sm text-[#999077]">Verified reviews are weighted heavily in Utamu ranking and compliance checks.</p></div></section>;
}

function AdminScreen({ path }: { path: string }) {
  const { verificationCases, analytics } = useUtamuDirectory();
  if (path.includes('analytics')) {
    return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5"><h1 className="font-display text-3xl font-bold text-[#fff6df] sm:text-4xl">Admin analytics</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{[['Revenue', kes(analytics.revenue)], ['Bookings', analytics.bookings], ['Approval rate', `${analytics.approvalRate}%`], ['Active models', analytics.activeModels]].map(([label, value]) => <div key={String(label)} className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-5"><p className="text-xs uppercase tracking-widest text-[#999077]">{String(label)}</p><strong className="mt-3 block font-display text-2xl text-[#fff6df]">{String(value)}</strong></div>)}</div><div className="mt-6 grid h-64 grid-cols-8 items-end gap-2 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:h-72 sm:gap-3 sm:p-6">{analytics.chart.map((height, index) => <div key={index} className="rounded-t-lg bg-[#ffd700]" style={{ height: `${height}%` }} />)}</div></section>;
  }
  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-5"><h1 className="font-display text-3xl font-bold text-[#fff6df] sm:text-4xl">Verification review</h1><div className="mt-6 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]"><aside className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4">{verificationCases.map((item) => <div key={item.id} className="mb-3 rounded-xl border border-[#353534] bg-[#201f1f] p-4"><p className="font-semibold text-[#fff6df]">{item.modelName}</p><p className="text-xs text-[#999077]">{item.id} - {item.submittedAt}</p><StatusBadge tone={item.status === 'rejected' ? 'red' : item.status === 'pending' ? 'gold' : 'green'}>{item.status}</StatusBadge></div>)}</aside><div className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-6"><h2 className="font-display text-2xl font-bold text-[#fff6df]">Amina W. compliance packet</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{['ID document', 'Selfie match', 'M-Pesa owner'].map((item) => <div key={item} className="rounded-xl border border-[#353534] bg-[#201f1f] p-4"><FileCheck2 className="mb-8 h-6 w-6 text-[#ffd700]" /><p className="font-semibold">{item}</p><p className="text-xs text-[#999077]">Ready for review</p></div>)}</div><div className="mt-6 flex flex-wrap gap-3"><button className="rounded-lg bg-[#61f595] px-5 py-3 font-bold text-[#00210c]">Approve</button><button className="rounded-lg bg-[#93000a] px-5 py-3 font-bold text-[#ffdad6]">Reject</button><button className="rounded-lg border border-[#4d4732] px-5 py-3 font-semibold text-[#fff6df]">Request changes</button></div></div></div></section>;
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
  return <section className="grid min-h-[calc(100vh-80px)] place-items-center bg-[#0e0e0e] px-5 py-10"><div className="w-full max-w-sm rounded-[2rem] border border-[#353534] bg-black p-4 shadow-2xl"><div className="rounded-[1.5rem] bg-[#131313] p-5"><p className="text-center text-xs text-[#999077]">Monday, 29 June</p><div className="mt-8 rounded-2xl border border-[#4d4732] bg-[#201f1f]/90 p-4 backdrop-blur"><div className="flex items-center gap-3"><Bell className="h-6 w-6 text-[#ffd700]" /><div><p className="font-semibold text-[#fff6df]">Utamu Verification</p><p className="text-xs text-[#999077]">Now</p></div></div><p className="mt-3 text-sm text-[#d0c6ab]">Your application needs clearer documents. Tap to review and re-submit.</p></div><a href="/verification/rejected" className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-[#ffd700] px-5 py-3 font-bold text-[#221b00]"><Lock className="h-4 w-4" />Open Utamu</a></div></div></section>;
}

function Panel({ title, icon: Icon, items }: { title: string; icon: typeof Gauge; items: string[] }) {
  return <div className="min-w-0 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4 sm:p-6"><Icon className="mb-6 h-7 w-7 text-[#ffd700]" /><h2 className="font-display text-2xl font-bold text-[#fff6df]">{title}</h2><div className="mt-4 grid gap-3">{items.map((item) => <div key={item} className="flex items-center justify-between rounded-xl border border-[#353534] bg-[#201f1f] p-3 text-sm text-[#d0c6ab]"><span>{item}</span><ChevronRight className="h-4 w-4" /></div>)}</div></div>;
}

function RouteIndex() {
  return <section className="mx-auto max-w-7xl px-4 py-10 pb-28 sm:px-5"><h2 className="font-display text-2xl font-bold text-[#fff6df]">Connected Utamu routes</h2><div className="mt-4 flex flex-wrap gap-2">{routeLinks.map((route) => <a key={route} href={route} className="rounded-full border border-[#4d4732] bg-[#1e1e1e] px-4 py-2 text-sm text-[#d0c6ab] hover:border-[#ffd700]">{route}</a>)}</div></section>;
}

export default function UtamuApp({ slug }: UtamuAppProps) {
  const path = useMemo(() => slug?.join('/') || '', [slug]);
  const view = viewFor(slug);
  return <Shell>{view === 'home' && <DiscoveryHome />}{view === 'register' && <RegisterScreen />}{view === 'registration' && <RegistrationFormScreen path={path} />}{view === 'confirm' && <ConfirmEmailScreen />}{view === 'profile' && <ProfileScreen path={path} />}{view === 'dashboard' && <DashboardScreen path={path} />}{view === 'messages' && <MessagesScreen />}{view === 'verification' && <VerificationScreen path={path} />}{view === 'checkout' && <CheckoutScreen />}{view === 'review' && <ReviewScreen />}{view === 'admin' && <AdminScreen path={path} />}{view === 'notification' && <NotificationScreen />}{!['home', 'register', 'registration', 'confirm', 'profile', 'dashboard', 'messages'].includes(view) && <RouteIndex />}</Shell>;
}
