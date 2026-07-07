'use client';

import { Bell, Check, ChevronRight, FileCheck2, Gauge, Lock, Mail, MessageCircle, Search, ShieldCheck, Star, Upload, Wallet, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { UtamuModel } from '../../data/utamu';
import { models } from '../../data/utamu';
import { utamuApi } from '../../lib/utamuApi';
import { useUtamuDirectory } from '../../hooks/useUtamuDirectory';

type UtamuAppProps = { slug?: string[] };

type View = 'home' | 'register' | 'profile' | 'dashboard' | 'verification' | 'checkout' | 'review' | 'admin' | 'notification';


const routeLinks = [
  '/',
  '/discover',
  '/register',
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
  return (
    <main className="min-h-screen bg-[#101010] font-serif text-[#2b1037] selection:bg-[#ec2aa0] selection:text-white">
      <div className="mx-auto max-w-[1180px] bg-[#fff0f6] shadow-2xl shadow-black/40">
        <header className="bg-[#2b0a3d] text-white">
          <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 px-5 py-3 md:flex-nowrap">
            <a href="/" className="font-serif text-4xl font-bold italic leading-none tracking-tight text-white [text-shadow:0_2px_0_#8b6a9b] md:text-5xl">Secret Nairobi</a>
            <nav className="flex flex-1 flex-wrap items-center gap-3 text-sm font-bold">
              <a href="/" className="rounded-full bg-[#ec4eb8] px-4 py-2 text-white shadow-sm">All Nairobi Models</a>
              <a href="/admin/verification-review" className="hover:text-[#ffb7df]">Agencies</a>
              <a href="/reviews/ratings" className="hover:text-[#ffb7df]">Reviews</a>
              <a href="/verification/step-1" className="uppercase hover:text-[#ffb7df]">Advertise for free!</a>
            </nav>
            <div className="flex items-center gap-2 text-sm font-bold">
              <a href="/register" className="rounded-full bg-[#ec4eb8] px-3 py-2">Register</a>
              <a href="/login" className="rounded-full bg-[#ec4eb8] px-3 py-2">Login</a>
              <a href="/discover" className="grid h-7 w-7 place-items-center"><Search className="h-5 w-5" /></a>
              <a href="/help" className="grid h-7 w-7 place-items-center"><Mail className="h-5 w-5" /></a>
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
  const { filteredModels } = useUtamuDirectory();
  const directoryModels = Array.from({ length: 12 }, (_, index) => {
    const base = filteredModels[index % filteredModels.length] || models[index % models.length];
    const names = ['Sara', 'Mila', 'Emma', 'Sofia', 'Fiona', 'Evelyn', 'Susi', 'Model Neha', 'Elexx', 'Lussia', 'Bela', 'Eisha'];
    return { ...base, id: `home-${index}`, name: names[index] || base.name, verified: index < 9, elite: true };
  });

  return (
    <>
      <div className="grid gap-0 md:grid-cols-[1fr_220px]">
        <section className="bg-[#fff0f6] px-4 py-5 md:px-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-normal text-[#3b164b]">All models</h1>
            <div className="flex flex-wrap gap-2 text-sm">
              {['Female', 'Independent', 'VIP', 'New'].map((item) => <a key={item} href="/discover" className="rounded-full border border-[#d3e8f4] bg-[#eef9ff] px-4 py-2 text-[#ec2aa0]">{item}</a>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
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
          <div className="min-h-[760px] bg-[#101010]" />
        </aside>
      </div>
      <section className="border-t border-[#ffd7e6] bg-[#fff0f6] px-4 py-6 text-[#111] md:px-5">
        <h2 className="mb-3 text-3xl font-bold leading-tight">Secret Nairobi Models - Home Of The Most Alluring Talent</h2>
        <p className="mb-3 text-[15px] leading-7">Entertainment, events, fashion, and lifestyle productions across Nairobi need dependable talent with polished presentation and professional communication. Secret Nairobi Models gives clients a simple way to browse verified profiles, compare styles, review availability, and connect with models suited for campaigns, hospitality, launches, brand shoots, and private creative bookings.</p>
        <p className="mb-3 text-[15px] leading-7">Our directory focuses on elegant presentation, quick discovery, and transparent profile signals. You can explore independent models, VIP profiles, new listings, and verified members from one place. Nairobi offers a deep pool of creative talent ready to bring your concept to life.</p>
        <h3 className="mb-2 text-2xl font-bold">We Serve The Best Model Directory Experience In Kenya</h3>
        <p className="text-[15px] leading-7">At Secret Nairobi, our listed models are presented with clear photos, verification labels, review flows, and profile details so clients can make informed decisions. Whether you prefer studio talent, event hosts, commercial faces, runway profiles, or lifestyle creators, our goal is to make discovery fast, attractive, and easy to navigate.</p>
      </section>
      <footer className="bg-[#2b0a3d] px-5 py-5 text-center text-sm text-white">
        <div className="mb-2 font-serif text-3xl font-bold italic">Secret Nairobi</div>
        <div className="flex flex-wrap justify-center gap-4 font-bold text-[#ffb7df]"><a href="/">All Nairobi Models</a><a href="/admin/verification-review">Agencies</a><a href="/reviews/ratings">Reviews</a><a href="/verification/step-1">Advertise for free</a></div>
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
      ctaHref: '/verification/step-1',
      features: ['Add a single profile', 'Add portfolio pictures', 'Add contact information', 'Upgrade to VIP visibility', 'Manage blocked clients', 'Profile analytics and messages'],
      highlight: 'Ksh 1,000 for 1 month',
    },
    {
      title: 'Register as Agency',
      price: 'Ksh 5,000 for 1 month',
      cta: 'Register here',
      ctaHref: '/admin/verification-review',
      features: ['Add multiple profiles', 'Add profile pictures', 'Add contact information', 'Upgrade agency listings to VIP', 'Add internal notes', 'Manage verification workflow'],
      highlight: 'Ksh 1,000 for 1 month',
    },
    {
      title: 'Register as Normal User',
      price: 'Free',
      cta: 'Register here',
      ctaHref: '/discover',
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
        <div className="grid gap-8 py-10 md:grid-cols-3">
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
        <div className="-mx-4 bg-[#101010] py-2 text-white md:-mx-5">© 2026 SecretNairobi.com - Models in Nairobi</div>
      </footer>
    </>
  );
}

function ProfileScreen() {
  const model = models[0];
  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-[#2a2a2a]">
            <img src={model.gallery[0]} alt="Utamu profile hero" className="h-[520px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute bottom-0 p-6">
              <div className="flex flex-wrap gap-2"><StatusBadge><ShieldCheck className="h-4 w-4" />Verified</StatusBadge><StatusBadge tone="green">Online now</StatusBadge><StatusBadge>Elite</StatusBadge></div>
              <h1 className="mt-4 font-display text-5xl font-extrabold text-white">{model.name}</h1>
              <p className="mt-2 text-[#d0c6ab]">{model.age} - {model.height} - {model.city}, {model.county}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">{model.gallery.slice(1, 4).map((image) => <img key={image} src={image} alt="Portfolio" className="h-64 rounded-xl object-cover" />)}</div>
          <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-6"><h2 className="font-display text-2xl font-bold text-[#fff6df]">About</h2><p className="mt-3 leading-7 text-[#d0c6ab]">{model.bio}</p><div className="mt-5 flex flex-wrap gap-2">{model.specialties.map((item) => <StatusBadge key={item} tone="muted">{item}</StatusBadge>)}</div></div>
        </div>
        <aside className="h-fit rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e]/90 p-5 backdrop-blur-xl lg:sticky lg:top-24">
          <div className="flex items-center justify-between"><span className="font-display text-3xl font-bold text-[#ffd700]">{kes(model.priceFrom)}+</span><span className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-[#ffd700] text-[#ffd700]" />{model.rating} ({model.reviews})</span></div>
          <p className="mt-3 text-sm text-[#d0c6ab]">{model.responseTime}. Direct contact unlocks only after verified M-Pesa deposit.</p>
          <div className="mt-5 grid gap-3">{model.rates.map((rate) => <div key={rate.label} className="rounded-xl border border-[#353534] bg-[#201f1f] p-4"><div className="flex justify-between gap-4"><div><p className="font-semibold text-[#fff6df]">{rate.label}</p><p className="text-xs text-[#999077]">{rate.duration}</p></div><span className="font-display font-bold text-[#ffd700]">{kes(rate.price)}</span></div></div>)}</div>
          <a href="/checkout/mpesa" className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-[#25d366] px-5 py-3 font-bold text-white"><MessageCircle className="h-5 w-5" />Pay deposit via M-Pesa</a>
          <a href="/reviews/ratings" className="mt-3 flex items-center justify-center rounded-lg border border-[#4d4732] px-5 py-3 font-semibold text-[#fff6df]">Leave verified review</a>
        </aside>
      </div>
    </section>
  );
}

function DashboardScreen() {
  const model = models[0];
  const stats = [
    ['Bookings', model.stats.bookings],
    ['Profile views', model.stats.profileViews.toLocaleString('en-KE')],
    ['Completion', `${model.stats.completion}%`],
    ['Earnings', kes(model.stats.earnings)],
  ];
  return <section className="mx-auto max-w-7xl px-5 py-8"><h1 className="font-display text-4xl font-bold text-[#fff6df]">Model dashboard</h1><p className="mt-2 text-[#d0c6ab]">Verification Pending - Nairobi, KE</p><div className="mt-6 grid gap-4 md:grid-cols-4">{stats.map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-5"><p className="text-xs uppercase tracking-widest text-[#999077]">{String(label)}</p><strong className="mt-3 block font-display text-2xl text-[#fff6df]">{String(value)}</strong></div>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]"><Panel title="Identity Verification: Pending" icon={FileCheck2} items={['Selfie match in progress', 'ID document uploaded', 'M-Pesa owner check pending', 'Admin review queue position 04']} /><Panel title="Rate cards" icon={Wallet} items={model.rates.map((rate) => `${rate.label} - ${kes(rate.price)}`)} /></div><div className="mt-6 grid gap-4 md:grid-cols-3">{model.gallery.slice(0, 3).map((image) => <img key={image} src={image} alt="Dashboard gallery" className="h-72 rounded-xl object-cover" />)}</div></section>;
}

function VerificationScreen({ path }: { path: string }) {
  const rejected = path.includes('rejected');
  const resubmitted = path.includes('resubmission');
  const submitted = path.includes('submitted') || resubmitted;
  return <section className="mx-auto max-w-3xl px-5 py-10"><div className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-6"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#ffd700]/10 text-[#ffd700]">{rejected ? <X className="h-8 w-8" /> : submitted ? <Check className="h-8 w-8" /> : <Upload className="h-8 w-8" />}</div><h1 className="mt-5 text-center font-display text-3xl font-bold text-[#fff6df]">{rejected ? 'Verification rejected' : submitted ? 'Application submitted' : 'Verification step 1'}</h1><p className="mx-auto mt-3 max-w-xl text-center text-[#d0c6ab]">{rejected ? 'Your documents need a clearer upload before your Utamu profile can go live.' : submitted ? 'Your identity verification is in the admin queue. You will receive a notification after review.' : 'Upload ID, selfie proof, service categories, rate card, and M-Pesa payout number for review.'}</p><div className="mt-6 grid gap-3">{['Legal name', 'National ID or passport', 'Live selfie', 'Portfolio images', 'M-Pesa payout phone'].map((field) => <input key={field} placeholder={field} className="rounded-lg border border-[#353534] bg-[#201f1f] p-4 text-[#fff6df] placeholder:text-[#999077]" />)}</div><a href="/verification/submitted" className="mt-5 flex items-center justify-center rounded-lg bg-[#ffd700] px-5 py-3 font-bold text-[#221b00]">Submit for review</a>{rejected && <a href="/verification/re-apply" className="mt-3 flex items-center justify-center rounded-lg border border-[#4d4732] px-5 py-3 font-semibold text-[#fff6df]">Re-apply</a>}</div></section>;
}

function CheckoutScreen() {
  const [phone, setPhone] = useState('2547');
  const [sent, setSent] = useState(false);
  async function pay() {
    await utamuApi.createMpesaPayment({ phone, amount: 500, modelId: 'm-001' });
    setSent(true);
  }
  return <section className="mx-auto grid max-w-5xl gap-6 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr]"><div className="overflow-hidden rounded-2xl border border-[#2a2a2a]"><img src={models[0].image} alt="Checkout model" className="h-full min-h-[440px] w-full object-cover" /></div><div className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-6"><StatusBadge tone="green">M-Pesa Express</StatusBadge><h1 className="mt-4 font-display text-4xl font-bold text-[#fff6df]">Pay with M-Pesa</h1><p className="mt-3 text-[#d0c6ab]">A Ksh 500 verified deposit unlocks secure direct coordination and confirms your account intent.</p><div className="mt-6 rounded-xl border border-[#353534] bg-[#201f1f] p-4"><div className="flex justify-between"><span>Portfolio access deposit</span><strong className="text-[#ffd700]">Ksh 500</strong></div><div className="mt-3 flex justify-between text-sm text-[#999077]"><span>Platform safety fee</span><span>Included</span></div></div><label className="mt-5 block text-sm font-semibold text-[#d0c6ab]">M-Pesa phone number</label><input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-lg border border-[#353534] bg-[#201f1f] p-4 text-[#fff6df]" /><button onClick={pay} className="mt-5 w-full rounded-lg bg-[#25d366] px-5 py-4 font-bold text-white">Send STK push</button>{sent && <p className="mt-4 rounded-lg border border-[#61f595]/30 bg-[#61f595]/10 p-4 text-sm text-[#6bfe9c]">STK push sent. Enter your PIN on your phone and keep this page open.</p>}</div></section>;
}

function ReviewScreen() {
  return <section className="mx-auto max-w-2xl px-5 py-10"><div className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-6"><h1 className="font-display text-3xl font-bold text-[#fff6df]">Submit verified review</h1><div className="mt-5 flex gap-2">{[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-8 w-8 fill-[#ffd700] text-[#ffd700]" />)}</div><textarea placeholder="Describe professionalism, punctuality, communication, and accuracy." className="mt-5 min-h-40 w-full rounded-lg border border-[#353534] bg-[#201f1f] p-4 text-[#fff6df] placeholder:text-[#999077]" /><label className="mt-4 flex items-center gap-2 text-sm text-[#d0c6ab]"><input type="checkbox" />Post anonymously</label><button className="mt-5 rounded-lg bg-[#ffd700] px-6 py-3 font-bold text-[#221b00]">Submit review</button><p className="mt-4 text-sm text-[#999077]">Verified reviews are weighted heavily in Utamu ranking and compliance checks.</p></div></section>;
}

function AdminScreen({ path }: { path: string }) {
  const { verificationCases, analytics } = useUtamuDirectory();
  if (path.includes('analytics')) {
    return <section className="mx-auto max-w-7xl px-5 py-8"><h1 className="font-display text-4xl font-bold text-[#fff6df]">Admin analytics</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{[['Revenue', kes(analytics.revenue)], ['Bookings', analytics.bookings], ['Approval rate', `${analytics.approvalRate}%`], ['Active models', analytics.activeModels]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-5"><p className="text-xs uppercase tracking-widest text-[#999077]">{String(label)}</p><strong className="mt-3 block font-display text-2xl text-[#fff6df]">{String(value)}</strong></div>)}</div><div className="mt-6 grid h-72 grid-cols-8 items-end gap-3 rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-6">{analytics.chart.map((height, index) => <div key={index} className="rounded-t-lg bg-[#ffd700]" style={{ height: `${height}%` }} />)}</div></section>;
  }
  return <section className="mx-auto max-w-7xl px-5 py-8"><h1 className="font-display text-4xl font-bold text-[#fff6df]">Verification review</h1><div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]"><aside className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-4">{verificationCases.map((item) => <div key={item.id} className="mb-3 rounded-xl border border-[#353534] bg-[#201f1f] p-4"><p className="font-semibold text-[#fff6df]">{item.modelName}</p><p className="text-xs text-[#999077]">{item.id} - {item.submittedAt}</p><StatusBadge tone={item.status === 'rejected' ? 'red' : item.status === 'pending' ? 'gold' : 'green'}>{item.status}</StatusBadge></div>)}</aside><div className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-6"><h2 className="font-display text-2xl font-bold text-[#fff6df]">Amina W. compliance packet</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{['ID document', 'Selfie match', 'M-Pesa owner'].map((item) => <div key={item} className="rounded-xl border border-[#353534] bg-[#201f1f] p-4"><FileCheck2 className="mb-8 h-6 w-6 text-[#ffd700]" /><p className="font-semibold">{item}</p><p className="text-xs text-[#999077]">Ready for review</p></div>)}</div><div className="mt-6 flex flex-wrap gap-3"><button className="rounded-lg bg-[#61f595] px-5 py-3 font-bold text-[#00210c]">Approve</button><button className="rounded-lg bg-[#93000a] px-5 py-3 font-bold text-[#ffdad6]">Reject</button><button className="rounded-lg border border-[#4d4732] px-5 py-3 font-semibold text-[#fff6df]">Request changes</button></div></div></div></section>;
}

function NotificationScreen() {
  return <section className="grid min-h-[calc(100vh-80px)] place-items-center bg-[#0e0e0e] px-5 py-10"><div className="w-full max-w-sm rounded-[2rem] border border-[#353534] bg-black p-4 shadow-2xl"><div className="rounded-[1.5rem] bg-[#131313] p-5"><p className="text-center text-xs text-[#999077]">Monday, 29 June</p><div className="mt-8 rounded-2xl border border-[#4d4732] bg-[#201f1f]/90 p-4 backdrop-blur"><div className="flex items-center gap-3"><Bell className="h-6 w-6 text-[#ffd700]" /><div><p className="font-semibold text-[#fff6df]">Utamu Verification</p><p className="text-xs text-[#999077]">Now</p></div></div><p className="mt-3 text-sm text-[#d0c6ab]">Your application needs clearer documents. Tap to review and re-submit.</p></div><a href="/verification/rejected" className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-[#ffd700] px-5 py-3 font-bold text-[#221b00]"><Lock className="h-4 w-4" />Open Utamu</a></div></div></section>;
}

function Panel({ title, icon: Icon, items }: { title: string; icon: typeof Gauge; items: string[] }) {
  return <div className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-6"><Icon className="mb-6 h-7 w-7 text-[#ffd700]" /><h2 className="font-display text-2xl font-bold text-[#fff6df]">{title}</h2><div className="mt-4 grid gap-3">{items.map((item) => <div key={item} className="flex items-center justify-between rounded-xl border border-[#353534] bg-[#201f1f] p-3 text-sm text-[#d0c6ab]"><span>{item}</span><ChevronRight className="h-4 w-4" /></div>)}</div></div>;
}

function RouteIndex() {
  return <section className="mx-auto max-w-7xl px-5 py-10 pb-28"><h2 className="font-display text-2xl font-bold text-[#fff6df]">Connected Utamu routes</h2><div className="mt-4 flex flex-wrap gap-2">{routeLinks.map((route) => <a key={route} href={route} className="rounded-full border border-[#4d4732] bg-[#1e1e1e] px-4 py-2 text-sm text-[#d0c6ab] hover:border-[#ffd700]">{route}</a>)}</div></section>;
}

export default function UtamuApp({ slug }: UtamuAppProps) {
  const path = useMemo(() => slug?.join('/') || '', [slug]);
  const view = viewFor(slug);
  return <Shell>{view === 'home' && <DiscoveryHome />}{view === 'register' && <RegisterScreen />}{view === 'profile' && <ProfileScreen />}{view === 'dashboard' && <DashboardScreen />}{view === 'verification' && <VerificationScreen path={path} />}{view === 'checkout' && <CheckoutScreen />}{view === 'review' && <ReviewScreen />}{view === 'admin' && <AdminScreen path={path} />}{view === 'notification' && <NotificationScreen />}{view !== 'home' && view !== 'register' && <RouteIndex />}</Shell>;
}
