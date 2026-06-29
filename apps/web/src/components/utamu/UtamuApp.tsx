'use client';

import { Bell, Check, ChevronRight, CreditCard, Crown, FileCheck2, Gauge, Heart, Home, LayoutDashboard, Lock, MapPin, MessageCircle, Search, ShieldCheck, Sparkles, Star, Upload, Wallet, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { UtamuModel } from '../../data/utamu';
import { models } from '../../data/utamu';
import { utamuApi } from '../../lib/utamuApi';
import { useUtamuDirectory } from '../../hooks/useUtamuDirectory';

type UtamuAppProps = { slug?: string[] };

type View = 'home' | 'profile' | 'dashboard' | 'verification' | 'checkout' | 'review' | 'admin' | 'notification';

const nav = [
  { href: '/', label: 'Discover' },
  { href: '/model/amina-w', label: 'Profiles' },
  { href: '/model/dashboard', label: 'Dashboard' },
  { href: '/admin/verification-review', label: 'Admin' },
];

const routeLinks = [
  '/',
  '/discover',
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
    <main className="min-h-screen bg-[#131313] text-[#e5e2e1] selection:bg-[#ffd700] selection:text-[#221b00]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#4d4732]/40 bg-[#131313]/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <a href="/" className="font-display text-xl font-bold tracking-tight text-[#ffd700]">UTAMU</a>
          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => <a key={item.href} href={item.href} className="text-sm font-semibold uppercase tracking-wide text-[#d0c6ab] hover:text-[#fff6df]">{item.label}</a>)}
          </nav>
          <a href="/verification/step-1" className="rounded-lg bg-[#ffd700] px-4 py-2 text-sm font-bold text-[#221b00]">Get verified</a>
        </div>
      </header>
      <div className="pt-20">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#4d4732]/50 bg-[#131313]/85 px-2 py-2 text-[11px] text-[#d0c6ab] backdrop-blur-2xl md:hidden">
        {[
          { href: '/', icon: Home, label: 'Home' },
          { href: '/discover', icon: Search, label: 'Search' },
          { href: '/model/amina-w', icon: Star, label: 'Profile' },
          { href: '/checkout/mpesa', icon: Wallet, label: 'Pay' },
          { href: '/model/dashboard', icon: LayoutDashboard, label: 'Studio' },
        ].map((item) => {
          const Icon = item.icon;
          return <a key={item.href} href={item.href} className="grid justify-items-center gap-1"><Icon className="h-5 w-5" />{item.label}</a>;
        })}
      </nav>
    </main>
  );
}

function SearchControls() {
  const { filters, actions, options } = useUtamuDirectory();
  return (
    <div className="grid gap-3 rounded-xl border border-[#4d4732]/70 bg-[#1c1b1b]/90 p-3 backdrop-blur-xl md:grid-cols-[1.5fr_1fr_1fr_auto]">
      <label className="flex items-center gap-3 rounded-lg border border-[#353534] bg-[#201f1f] px-4 py-3 focus-within:border-[#ffd700]">
        <Search className="h-5 w-5 text-[#ffd700]" />
        <input value={filters.query} onChange={(event) => actions.setQuery(event.target.value)} placeholder="Search talent, city, style" className="w-full bg-transparent text-sm text-[#fff6df] outline-none placeholder:text-[#999077]" />
      </label>
      <select value={filters.city} onChange={(event) => actions.setCity(event.target.value)} className="rounded-lg border border-[#353534] bg-[#201f1f] px-4 py-3 text-sm text-[#e5e2e1]">
        {options.cities.map((city) => <option key={city}>{city}</option>)}
      </select>
      <select value={filters.category} onChange={(event) => actions.setCategory(event.target.value)} className="rounded-lg border border-[#353534] bg-[#201f1f] px-4 py-3 text-sm text-[#e5e2e1]">
        {options.categories.map((category) => <option key={category}>{category}</option>)}
      </select>
      <a href="/discover" className="inline-flex items-center justify-center rounded-lg bg-[#ffd700] px-5 py-3 text-sm font-bold text-[#221b00]">Explore</a>
    </div>
  );
}

function ModelCard({ model }: { model: UtamuModel }) {
  return (
    <a href={`/model/${model.slug}`} className="group relative block overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e]">
      <div className="aspect-[3/4] overflow-hidden">
        <img src={model.image} alt={`${model.name} portfolio`} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4">
        <div className="mb-2 flex items-center gap-2">
          {model.online && <span className="h-2 w-2 rounded-full bg-[#61f595] shadow-[0_0_10px_rgba(97,245,149,0.9)]" />}
          <span className="rounded-full bg-black/50 px-2 py-1 text-[11px] uppercase tracking-wide text-[#d0c6ab] backdrop-blur">{model.city}</span>
          {model.elite && <span className="rounded-full bg-[#ffd700] px-2 py-1 text-[11px] font-bold text-[#221b00]">Elite</span>}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-white">{model.name}</h3>
            <p className="text-xs text-[#d0c6ab]">{model.category} - {model.county}</p>
          </div>
          <div className="text-right font-display text-sm font-semibold text-[#ffd700]">{kes(model.priceFrom)}+</div>
        </div>
      </div>
    </a>
  );
}

function DiscoveryHome() {
  const { filteredModels, filters, actions } = useUtamuDirectory();
  return (
    <>
      <section className="relative overflow-hidden px-5 py-10 md:py-16">
        <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_20%_10%,#ffd700_0,transparent_30%),radial-gradient(circle_at_90%_0%,#61f595_0,transparent_24%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <StatusBadge><Sparkles className="h-4 w-4" />Dark elegance directory</StatusBadge>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-tight text-[#fff6df] md:text-7xl">Discover verified Kenyan talent.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#d0c6ab]">Utamu is a premium model and wellness talent directory with curated profiles, identity verification, verified reviews, M-Pesa deposits, and admin-grade compliance workflows.</p>
            <div className="mt-8"><SearchControls /></div>
            <div className="mt-5 flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-full border border-[#4d4732] px-4 py-2 text-sm text-[#d0c6ab]"><input type="checkbox" checked={filters.verifiedOnly} onChange={(event) => actions.setVerifiedOnly(event.target.checked)} />Verified only</label>
              <label className="flex items-center gap-2 rounded-full border border-[#4d4732] px-4 py-2 text-sm text-[#d0c6ab]"><input type="checkbox" checked={filters.eliteOnly} onChange={(event) => actions.setEliteOnly(event.target.checked)} />Elite only</label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {filteredModels.slice(0, 6).map((model) => <ModelCard key={model.id} model={model} />)}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-3">
        {[['Verified identity', ShieldCheck], ['M-Pesa deposits', CreditCard], ['Weighted reviews', Star]].map(([label, Icon]) => {
          const I = Icon as typeof ShieldCheck;
          return <div key={String(label)} className="rounded-2xl border border-[#2a2a2a] bg-[#1e1e1e] p-6"><I className="mb-8 h-7 w-7 text-[#ffd700]" /><h3 className="font-display text-xl font-bold text-[#fff6df]">{String(label)}</h3><p className="mt-2 text-sm text-[#d0c6ab]">Built from the attached Utamu screen flow with dark surfaces, gold accents, and compliance-first booking.</p></div>;
        })}
      </section>
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
  return <Shell>{view === 'home' && <DiscoveryHome />}{view === 'profile' && <ProfileScreen />}{view === 'dashboard' && <DashboardScreen />}{view === 'verification' && <VerificationScreen path={path} />}{view === 'checkout' && <CheckoutScreen />}{view === 'review' && <ReviewScreen />}{view === 'admin' && <AdminScreen path={path} />}{view === 'notification' && <NotificationScreen />}<RouteIndex /></Shell>;
}
