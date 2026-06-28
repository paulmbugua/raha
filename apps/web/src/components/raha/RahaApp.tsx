'use client';

import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  Filter,
  Heart,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { adminStats, locations, providers, rankingFactors, services } from '../../data/raha';
import { useRahaMarketplace } from '../../hooks/useRahaMarketplace';

type RahaAppProps = { slug?: string[] };

const routes = [
  ['/', 'Home'],
  ['/search', 'Search'],
  ['/provider/amani-spa-collective', 'Provider'],
  ['/booking', 'Booking'],
  ['/checkout', 'Checkout'],
  ['/dashboard', 'Dashboard'],
  ['/provider/register', 'Provider'],
  ['/provider/dashboard', 'Studio'],
  ['/admin', 'Admin'],
];

const routeCards = [
  'customer/register',
  'login',
  'dashboard',
  'search',
  'provider/amani-spa-collective',
  'booking',
  'checkout',
  'booking/success',
  'bookings',
  'review',
  'provider/register',
  'provider/onboarding',
  'provider/dashboard',
  'provider/profile',
  'provider/services',
  'provider/calendar',
  'provider/subscription',
  'provider/analytics',
  'notifications',
  'wallet',
  'referrals',
  'admin',
  'admin/providers',
  'admin/subscriptions',
  'admin/bookings',
  'admin/reviews',
  'admin/users',
  'admin/featured',
  'admin/analytics',
  'admin/settings',
  'ranking',
];

function formatKes(value: number) {
  return `KES ${value.toLocaleString('en-KE')}`;
}

function routeKind(slug?: string[]) {
  if (!slug || slug.length === 0) return 'home';
  const path = slug.join('/');
  if (path.startsWith('admin')) return 'admin';
  if (path.startsWith('provider/') && path !== 'provider/amani-spa-collective') return 'provider-console';
  if (path.startsWith('provider/')) return 'profile';
  if (path.includes('checkout')) return 'checkout';
  if (path.includes('booking')) return 'booking';
  if (path.includes('dashboard') || path === 'bookings' || path === 'wallet' || path === 'notifications' || path === 'referrals') return 'dashboard';
  if (path === 'search') return 'search';
  if (path === 'login' || path === 'customer/register' || path === 'review') return 'forms';
  if (path === 'ranking') return 'ranking';
  return 'home';
}

function Badge({ children, tone = 'emerald' }: { children: React.ReactNode; tone?: 'emerald' | 'gold' | 'charcoal' }) {
  const styles = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    gold: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    charcoal: 'border-stone-200 bg-stone-100 text-stone-800',
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#202321]">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-wide text-[#12382d]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#12382d] text-sm text-[#d7b46a]">R</span>
            Raha
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {routes.map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">{label}</a>
            ))}
          </nav>
          <a href="/provider/register" className="rounded-full bg-[#12382d] px-4 py-2 text-sm font-semibold text-white">List your service</a>
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-black/10 bg-white/95 px-2 py-2 text-[11px] font-medium text-stone-600 backdrop-blur md:hidden">
        {[
          ['/', Search, 'Home'],
          ['/search', Filter, 'Search'],
          ['/booking', CalendarDays, 'Book'],
          ['/dashboard', LayoutDashboard, 'Trips'],
          ['/wallet', Wallet, 'Wallet'],
        ].map(([href, Icon, label]) => {
          const I = Icon as typeof Search;
          return <a key={String(href)} href={String(href)} className="grid justify-items-center gap-1"><I className="h-5 w-5" />{String(label)}</a>;
        })}
      </nav>
    </main>
  );
}

function SearchPanel() {
  const { filters, actions } = useRahaMarketplace();
  return (
    <div className="grid gap-3 rounded-[28px] bg-white p-3 shadow-2xl shadow-black/15 ring-1 ring-black/10 md:grid-cols-[1.3fr_1fr_1fr_auto]">
      <label className="flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3">
        <Search className="h-5 w-5 text-[#16724f]" />
        <input value={filters.query} onChange={(event) => actions.setQuery(event.target.value)} placeholder="Search massage, spa or therapist" className="w-full bg-transparent text-sm outline-none" />
      </label>
      <select value={filters.location} onChange={(event) => actions.setLocation(event.target.value)} className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
        <option>All</option>{locations.map((item) => <option key={item}>{item}</option>)}
      </select>
      <select value={filters.service} onChange={(event) => actions.setService(event.target.value)} className="rounded-2xl bg-stone-50 px-4 py-3 text-sm">
        <option>All</option>{services.map((item) => <option key={item}>{item}</option>)}
      </select>
      <a href="/search" className="inline-flex items-center justify-center rounded-2xl bg-[#12382d] px-6 py-3 text-sm font-semibold text-white">Search</a>
    </div>
  );
}

function ProviderCard({ provider }: { provider: (typeof providers)[number] }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/10 transition hover:-translate-y-1 hover:shadow-xl">
      <a href={`/provider/${provider.slug}`}>
        <img src={provider.image} alt={provider.name} className="h-56 w-full object-cover" />
      </a>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#17211d]">{provider.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-stone-600"><MapPin className="h-4 w-4" />{provider.location} · {provider.distanceKm} km</p>
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold"><Star className="h-4 w-4 fill-[#d7b46a] text-[#d7b46a]" />{provider.rating}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {provider.verified && <Badge><ShieldCheck className="h-3.5 w-3.5" />Verified</Badge>}
          {provider.premium && <Badge tone="gold"><Crown className="h-3.5 w-3.5" />Premium</Badge>}
          {provider.topRated && <Badge tone="charcoal">Top Rated</Badge>}
        </div>
        <p className="text-sm text-stone-600">{provider.specialty}</p>
        <div className="flex items-center justify-between border-t border-stone-100 pt-4">
          <span className="text-sm text-stone-500">From <strong className="text-[#17211d]">{formatKes(provider.startingPrice)}</strong></span>
          <a href="/booking" className="rounded-full bg-[#16724f] px-4 py-2 text-sm font-semibold text-white">Book</a>
        </div>
      </div>
    </article>
  );
}

function Home() {
  const { filteredProviders } = useRahaMarketplace();
  return (
    <>
      <section className="relative overflow-hidden bg-[#10251f] text-white">
        <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1800&q=80" alt="Luxury wellness massage room" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_0.78fr] md:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d7b46a]">Elite Wellness Kenya</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.04] md:text-7xl">Raha</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/85">Kenya's premium marketplace for verified massage therapists, spas, and wellness professionals. Compare ratings, book securely, pay online, then unlock WhatsApp coordination after confirmation.</p>
            <div className="mt-8"><SearchPanel /></div>
          </div>
          <div className="grid content-end gap-4">
            {['Verified professionals', 'M-Pesa, card and wallet checkout', 'Provider subscriptions and premium placement'].map((item) => <div key={item} className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"><Check className="mb-3 h-5 w-5 text-[#d7b46a]" />{item}</div>)}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#16724f]">Featured</p><h2 className="text-3xl font-semibold">Book top wellness providers</h2></div><a href="/search" className="hidden items-center gap-1 font-semibold text-[#16724f] sm:flex">View all <ChevronRight className="h-4 w-4" /></a></div>
        <div className="grid gap-5 md:grid-cols-3">{filteredProviders.slice(0, 3).map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div>
      </section>
      <section className="bg-white py-12"><div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-4">{['Search verified pros', 'Compare ratings and prices', 'Pay securely online', 'WhatsApp after booking'].map((item, index) => <div key={item} className="rounded-3xl border border-stone-200 p-6"><span className="text-sm font-semibold text-[#d7b46a]">0{index + 1}</span><h3 className="mt-3 font-semibold">{item}</h3><p className="mt-2 text-sm text-stone-600">Designed for fewer clicks, clear expectations, and premium customer trust.</p></div>)}</div></section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3">{['Nairobi', 'Mombasa', 'Diani', 'Karen', 'Westlands', 'Kilimani'].map((item) => <a key={item} href="/search" className="rounded-3xl bg-[#12382d] p-6 text-white"><MapPin className="mb-8 h-6 w-6 text-[#d7b46a]" /><span className="text-2xl font-semibold">{item}</span></a>)}</section>
      <Footer />
    </>
  );
}

function SearchScreen() {
  const { filteredProviders, filters, actions } = useRahaMarketplace();
  return <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr]"><aside className="h-fit rounded-3xl bg-white p-5 ring-1 ring-black/10"><h2 className="flex items-center gap-2 font-semibold"><Filter className="h-5 w-5" />Filters</h2>{['Premium only', 'Verified only'].map((label) => <label key={label} className="mt-5 flex items-center justify-between text-sm"><span>{label}</span><input type="checkbox" checked={label.startsWith('Premium') ? filters.premiumOnly : filters.verifiedOnly} onChange={(e) => label.startsWith('Premium') ? actions.setPremiumOnly(e.target.checked) : actions.setVerifiedOnly(e.target.checked)} /></label>)}<label className="mt-5 block text-sm font-medium">Sort</label><select value={filters.sort} onChange={(e) => actions.setSort(e.target.value)} className="mt-2 w-full rounded-2xl bg-stone-50 p-3 text-sm"><option>Rating</option><option>Distance</option><option>Newest</option><option>Price</option></select><div className="mt-5"><SearchPanel /></div></aside><div><h1 className="text-3xl font-semibold">{filteredProviders.length} verified providers available</h1><div className="mt-5 grid gap-5 md:grid-cols-2">{filteredProviders.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div></div></section>;
}

function Profile() {
  const provider = providers[0];
  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]"><img src={provider.gallery[0]} alt="Spa gallery" className="h-96 w-full rounded-3xl object-cover" /><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">{provider.gallery.slice(1).map((image) => <img key={image} src={image} alt="Treatment room" className="h-44 w-full rounded-3xl object-cover" />)}</div></div><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"><div><div className="flex flex-wrap gap-2"><Badge><ShieldCheck className="h-4 w-4" />Verified</Badge><Badge tone="gold"><Crown className="h-4 w-4" />Premium</Badge><Badge tone="charcoal">Highly Recommended</Badge></div><h1 className="mt-4 text-4xl font-semibold">{provider.name}</h1><p className="mt-3 text-stone-600">{provider.bio}</p><div className="mt-6 grid gap-4 sm:grid-cols-3">{['Qualifications', 'Working hours', 'Languages'].map((title) => <div key={title} className="rounded-3xl bg-white p-5 ring-1 ring-black/10"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-stone-600">{title === 'Qualifications' ? provider.qualifications.join(', ') : title === 'Working hours' ? provider.hours : provider.languages.join(', ')}</p></div>)}</div><h2 className="mt-8 text-2xl font-semibold">Services and pricing</h2><div className="mt-4 grid gap-4">{provider.services.map((service) => <div key={service.name} className="rounded-3xl bg-white p-5 ring-1 ring-black/10"><div className="flex justify-between gap-4"><div><h3 className="font-semibold">{service.name}</h3><p className="text-sm text-stone-600">{service.duration} · {service.description}</p></div><strong>{formatKes(service.price)}</strong></div></div>)}</div></div><aside className="h-fit rounded-3xl bg-white p-5 shadow-xl ring-1 ring-black/10"><div className="flex items-center justify-between"><span className="text-2xl font-semibold">{formatKes(provider.startingPrice)}</span><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-[#d7b46a] text-[#d7b46a]" />{provider.rating}</span></div><p className="mt-3 text-sm text-stone-600">Response rate: {provider.responseRate}. WhatsApp unlocks after confirmed payment.</p><div className="mt-5 grid gap-2">{provider.availability.map((slot) => <button key={slot} className="rounded-2xl bg-stone-50 p-3 text-left text-sm font-medium">{slot}</button>)}</div><a href="/booking" className="mt-5 flex w-full items-center justify-center rounded-full bg-[#12382d] px-5 py-3 font-semibold text-white">Book now</a></aside></div></section>;
}

function BookingCheckout({ success = false }: { success?: boolean }) {
  const [method, setMethod] = useState('M-Pesa');
  return <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px]"><div className="rounded-3xl bg-white p-6 ring-1 ring-black/10"><h1 className="text-3xl font-semibold">{success ? 'Booking confirmed' : 'Complete your booking'}</h1>{success ? <div className="mt-6 rounded-3xl bg-emerald-50 p-5 text-emerald-900"><Check className="mb-3 h-6 w-6" />Receipt RAHA-8K41 is ready. WhatsApp and directions are now unlocked.</div> : <div className="mt-6 grid gap-5">{['Select service', 'Choose date', 'Choose time', 'Summary', 'Payment', 'Confirmation'].map((step, index) => <div key={step} className="flex items-center gap-4 rounded-3xl bg-stone-50 p-4"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#12382d] text-sm text-white">{index + 1}</span><span className="font-medium">{step}</span></div>)}<div className="grid gap-3 sm:grid-cols-3">{['M-Pesa', 'Card', 'Wallet'].map((item) => <button key={item} onClick={() => setMethod(item)} className={`rounded-2xl border p-4 text-left font-semibold ${method === item ? 'border-[#16724f] bg-emerald-50' : 'border-stone-200'}`}>{item}</button>)}</div></div>}</div><aside className="h-fit rounded-3xl bg-[#12382d] p-6 text-white"><h2 className="font-semibold">Order summary</h2><div className="mt-5 space-y-3 text-sm text-white/80"><p>Amani Spa Collective</p><p>Signature Deep Tissue · 75 min</p><p>Promo code: RAHA10 applied</p><p className="border-t border-white/15 pt-4 text-xl font-semibold text-white">KES 5,850</p></div><a href="/booking/success" className="mt-5 flex items-center justify-center gap-2 rounded-full bg-[#d7b46a] px-5 py-3 font-semibold text-[#12382d]"><CreditCard className="h-5 w-5" />Confirm payment</a>{success && <a href="https://wa.me/254700111222" className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 font-semibold"><MessageCircle className="h-5 w-5" />WhatsApp provider</a>}</aside></section>;
}

function Dashboard() {
  const { bookings, reviews } = useRahaMarketplace();
  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><h1 className="text-3xl font-semibold">Customer dashboard</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{['Upcoming bookings', 'Completed bookings', 'Favourite providers', 'Wallet'].map((item, index) => <div key={item} className="rounded-3xl bg-white p-5 ring-1 ring-black/10"><p className="text-sm text-stone-500">{item}</p><strong className="mt-2 block text-2xl">{index === 3 ? 'KES 12,400' : index + 2}</strong></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl bg-white p-5 ring-1 ring-black/10"><h2 className="font-semibold">Bookings</h2>{bookings.map((booking) => <div key={booking.id} className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4"><div><p className="font-medium">{booking.providerName}</p><p className="text-sm text-stone-500">{booking.service} · {booking.status}</p></div><a href="/booking" className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold">Rebook</a></div>)}</div><div className="rounded-3xl bg-white p-5 ring-1 ring-black/10"><h2 className="font-semibold">Recent reviews and notifications</h2>{reviews.map((review) => <p key={review.id} className="mt-4 border-t border-stone-100 pt-4 text-sm text-stone-600">{review.body}</p>)}</div></div></section>;
}

function ProviderConsole() {
  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><h1 className="text-3xl font-semibold">Provider studio</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{['Bookings', 'Revenue', 'Visitors', 'Subscription status'].map((item, index) => <div key={item} className="rounded-3xl bg-white p-5 ring-1 ring-black/10"><p className="text-sm text-stone-500">{item}</p><strong className="mt-2 block text-2xl">{index === 1 ? 'KES 284K' : index === 3 ? 'Premium' : 42 + index}</strong></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-3"><Panel title="Onboarding wizard" items={['Personal details', 'Services', 'Pricing', 'Gallery', 'Availability', 'Subscription', 'Verification']} /><Panel title="Manage profile" items={['Biography', 'Services', 'Pricing', 'Hours', 'Location', 'WhatsApp number', 'Social links']} /><Panel title="Premium features" items={['Featured placement', 'Priority search', 'More gallery images', 'Analytics', 'Priority support']} /></div></section>;
}

function Admin() {
  return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><h1 className="text-3xl font-semibold">Admin command center</h1><div className="mt-6 grid gap-4 md:grid-cols-4">{adminStats.map((stat) => <div key={stat.label} className="rounded-3xl bg-white p-5 ring-1 ring-black/10"><p className="text-sm text-stone-500">{stat.label}</p><strong className="mt-2 block text-2xl">{stat.value}</strong><span className="text-sm font-semibold text-emerald-700">{stat.trend}</span></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-3"><Panel title="Provider approval" items={['Pending providers', 'Verification documents', 'Approve', 'Reject', 'Request changes']} /><Panel title="Subscription management" items={['Plans', 'Revenue', 'Renewals', 'Expired', 'Payments']} /><Panel title="Moderation and users" items={['Bookings', 'Refunds', 'Disputes', 'Reviews', 'Suspend or activate']} /></div><div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-black/10"><h2 className="flex items-center gap-2 font-semibold"><BarChart3 className="h-5 w-5" />Analytics</h2><div className="mt-5 grid h-56 grid-cols-7 items-end gap-3">{[45, 68, 52, 88, 74, 96, 82].map((height, index) => <div key={index} className="rounded-t-2xl bg-[#16724f]" style={{ height: `${height}%` }} />)}</div></div></section>;
}

function Forms() {
  return <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2"><div className="rounded-3xl bg-white p-6 ring-1 ring-black/10"><h1 className="text-3xl font-semibold">Create your Raha account</h1><div className="mt-6 grid gap-3">{['Email', 'Phone', 'Password', 'OTP verification'].map((field) => <input key={field} placeholder={field} className="rounded-2xl bg-stone-50 p-4" />)}<button className="rounded-full bg-[#12382d] p-4 font-semibold text-white">Continue</button><button className="rounded-full border border-stone-200 p-4 font-semibold">Continue with Google</button></div></div><div className="rounded-3xl bg-white p-6 ring-1 ring-black/10"><h2 className="text-2xl font-semibold">Leave a review</h2><div className="mt-6 flex gap-1">{[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-7 w-7 fill-[#d7b46a] text-[#d7b46a]" />)}</div><textarea placeholder="Written review" className="mt-4 min-h-36 w-full rounded-2xl bg-stone-50 p-4" /><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" />Post anonymously</label><button className="mt-4 rounded-full bg-[#16724f] px-6 py-3 font-semibold text-white">Submit review</button></div></section>;
}

function Ranking() {
  return <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><h1 className="text-3xl font-semibold">Ranking algorithm</h1><div className="mt-6 grid gap-4 sm:grid-cols-2">{rankingFactors.map((factor, index) => <div key={factor} className="rounded-3xl bg-white p-5 ring-1 ring-black/10"><div className="flex items-center justify-between"><span className="font-semibold">{factor}</span><span className="text-[#16724f]">{15 - index}%</span></div><div className="mt-4 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-[#16724f]" style={{ width: `${95 - index * 8}%` }} /></div></div>)}</div></section>;
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-3xl bg-white p-5 ring-1 ring-black/10"><h2 className="font-semibold">{title}</h2><div className="mt-4 grid gap-3">{items.map((item) => <div key={item} className="flex items-center gap-2 rounded-2xl bg-stone-50 p-3 text-sm"><Check className="h-4 w-4 text-[#16724f]" />{item}</div>)}</div></div>;
}

function Footer() {
  return <footer className="border-t border-black/10 bg-[#10251f] px-4 py-10 text-white sm:px-6"><div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4"><div><h2 className="text-2xl font-semibold">Raha</h2><p className="mt-3 text-sm text-white/70">Premium wellness booking across Kenya.</p></div>{['Customers', 'Providers', 'Company'].map((group) => <div key={group}><h3 className="font-semibold">{group}</h3><div className="mt-3 grid gap-2 text-sm text-white/70"><a href="/search">Search</a><a href="/provider/register">Register</a><a href="/help">Support</a></div></div>)}</div></footer>;
}

export default function RahaApp({ slug }: RahaAppProps) {
  const kind = routeKind(slug);
  const title = useMemo(() => slug?.join('/') || 'home', [slug]);
  return <Shell>{kind === 'home' && <Home />}{kind === 'search' && <SearchScreen />}{kind === 'profile' && <Profile />}{kind === 'booking' && <BookingCheckout success={title.includes('success')} />}{kind === 'checkout' && <BookingCheckout />}{kind === 'dashboard' && <Dashboard />}{kind === 'provider-console' && <ProviderConsole />}{kind === 'admin' && <Admin />}{kind === 'forms' && <Forms />}{kind === 'ranking' && <Ranking />}<section className="mx-auto max-w-7xl px-4 py-10 pb-24 sm:px-6"><h2 className="text-2xl font-semibold">Connected routes</h2><div className="mt-4 flex flex-wrap gap-2">{routeCards.map((route) => <a key={route} href={`/${route}`} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:border-[#16724f]">/{route}</a>)}</div></section></Shell>;
}
