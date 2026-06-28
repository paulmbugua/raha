export type Provider = {
  id: string;
  name: string;
  slug: string;
  location: string;
  serviceArea: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  startingPrice: number;
  distanceKm: number;
  verified: boolean;
  premium: boolean;
  topRated?: boolean;
  mostBooked?: boolean;
  responseRate: string;
  experience: string;
  languages: string[];
  image: string;
  gallery: string[];
  bio: string;
  qualifications: string[];
  services: Array<{ name: string; duration: string; price: number; description: string }>;
  availability: string[];
  hours: string;
  whatsapp: string;
};

export type Booking = {
  id: string;
  providerId: string;
  providerName: string;
  service: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  amount: number;
  reference: string;
};

export type Review = {
  id: string;
  providerId: string;
  author: string;
  rating: number;
  body: string;
  createdAt: string;
  status: 'approved' | 'pending' | 'reported';
};

export const locations = ['Nairobi', 'Westlands', 'Kilimani', 'Karen', 'Mombasa', 'Diani', 'Naivasha', 'Nakuru'];
export const services = ['Deep Tissue', 'Swedish Massage', 'Aromatherapy', 'Sports Recovery', 'Couples Spa', 'Reflexology', 'Prenatal Massage'];

export const providers: Provider[] = [
  {
    id: 'p-001',
    name: 'Amani Spa Collective',
    slug: 'amani-spa-collective',
    location: 'Westlands, Nairobi',
    serviceArea: 'Westlands, Parklands, Gigiri',
    specialty: 'Deep Tissue and Aromatherapy',
    rating: 4.96,
    reviewCount: 248,
    startingPrice: 4500,
    distanceKm: 2.4,
    verified: true,
    premium: true,
    topRated: true,
    mostBooked: true,
    responseRate: '98% within 10 minutes',
    experience: '9 years',
    languages: ['English', 'Kiswahili'],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1611073615830-3f7520e30e89?auto=format&fit=crop&w=900&q=80',
    ],
    bio: 'A verified collective of licensed wellness therapists offering hotel-quality recovery and relaxation treatments at home, office, and partner spa suites.',
    qualifications: ['Kenya Wellness Guild verified', 'First Aid certified', 'Anatomy and massage therapy diploma'],
    services: [
      { name: 'Signature Deep Tissue', duration: '75 min', price: 6500, description: 'Focused pressure for shoulders, back, hips, and athletic recovery.' },
      { name: 'Aromatherapy Reset', duration: '60 min', price: 5000, description: 'Gentle full-body massage with essential oils and warm towels.' },
      { name: 'Couples Wellness', duration: '90 min', price: 11800, description: 'Two therapists, synchronized flow, and premium oils.' },
    ],
    availability: ['Today 2:00 PM', 'Today 5:30 PM', 'Tomorrow 10:00 AM'],
    hours: 'Mon-Sat, 8:00 AM - 8:00 PM',
    whatsapp: '+254700111222',
  },
  {
    id: 'p-002',
    name: 'Serene Hands by Nia',
    slug: 'serene-hands-by-nia',
    location: 'Kilimani, Nairobi',
    serviceArea: 'Kilimani, Lavington, Kileleshwa',
    specialty: 'Prenatal and Swedish Massage',
    rating: 4.89,
    reviewCount: 174,
    startingPrice: 3800,
    distanceKm: 4.1,
    verified: true,
    premium: false,
    topRated: true,
    responseRate: '93% within 20 minutes',
    experience: '6 years',
    languages: ['English', 'Kiswahili', 'Kikuyu'],
    image: 'https://images.unsplash.com/photo-1591343395902-1adcb454c4e2?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=900&q=80',
    ],
    bio: 'Independent licensed therapist known for calm bedside manner, prenatal positioning, and personalized pressure preferences.',
    qualifications: ['Prenatal massage certificate', 'Licensed independent therapist', 'Hygiene and safety audited'],
    services: [
      { name: 'Swedish Flow', duration: '60 min', price: 3800, description: 'Light to medium pressure for relaxation and circulation.' },
      { name: 'Prenatal Comfort', duration: '70 min', price: 5200, description: 'Side-lying support, safe pressure, and lower-back relief.' },
    ],
    availability: ['Tomorrow 9:00 AM', 'Tomorrow 3:30 PM', 'Fri 11:00 AM'],
    hours: 'Tue-Sun, 9:00 AM - 6:00 PM',
    whatsapp: '+254711333444',
  },
  {
    id: 'p-003',
    name: 'Coastline Recovery Spa',
    slug: 'coastline-recovery-spa',
    location: 'Nyali, Mombasa',
    serviceArea: 'Nyali, Bamburi, Mombasa CBD',
    specialty: 'Sports Recovery and Reflexology',
    rating: 4.82,
    reviewCount: 121,
    startingPrice: 4200,
    distanceKm: 8.7,
    verified: true,
    premium: true,
    mostBooked: true,
    responseRate: '96% within 15 minutes',
    experience: '7 years',
    languages: ['English', 'Kiswahili'],
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1531299244174-d247dd4e5a66?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1620733723572-11c53f73a416?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=900&q=80',
    ],
    bio: 'Premium coastal spa team serving hotel guests, residents, and athletes with strong recovery protocols and polished hospitality.',
    qualifications: ['Sports massage diploma', 'Hotel spa operations certified', 'Provider identity verified'],
    services: [
      { name: 'Sports Recovery', duration: '75 min', price: 6200, description: 'Mobility-led bodywork for active clients and travelers.' },
      { name: 'Reflexology', duration: '45 min', price: 4200, description: 'Targeted foot therapy for fatigue and circulation.' },
    ],
    availability: ['Today 6:00 PM', 'Tomorrow 12:00 PM', 'Sat 4:00 PM'],
    hours: 'Daily, 8:00 AM - 9:00 PM',
    whatsapp: '+254722555666',
  },
];

export const bookings: Booking[] = [
  { id: 'b-1001', providerId: 'p-001', providerName: 'Amani Spa Collective', service: 'Signature Deep Tissue', date: '2026-07-02', time: '5:30 PM', status: 'upcoming', amount: 6500, reference: 'RAHA-8K41' },
  { id: 'b-1002', providerId: 'p-002', providerName: 'Serene Hands by Nia', service: 'Swedish Flow', date: '2026-06-14', time: '10:00 AM', status: 'completed', amount: 3800, reference: 'RAHA-6N18' },
  { id: 'b-1003', providerId: 'p-003', providerName: 'Coastline Recovery Spa', service: 'Sports Recovery', date: '2026-06-09', time: '2:00 PM', status: 'cancelled', amount: 6200, reference: 'RAHA-5C77' },
];

export const reviews: Review[] = [
  { id: 'r-001', providerId: 'p-001', author: 'Wanjiku M.', rating: 5, body: 'Professional, punctual, and the best shoulder relief I have had in Nairobi.', createdAt: '2026-06-18', status: 'approved' },
  { id: 'r-002', providerId: 'p-002', author: 'Mariam A.', rating: 5, body: 'Nia listened carefully and made the prenatal session feel safe and luxurious.', createdAt: '2026-06-12', status: 'approved' },
  { id: 'r-003', providerId: 'p-003', author: 'Brian K.', rating: 4, body: 'Strong recovery massage after a race weekend. Booking was simple.', createdAt: '2026-06-07', status: 'reported' },
];

export const subscriptionPlans = [
  { name: 'Free Trial', price: 0, period: '14 days', benefits: ['Basic listing', '3 gallery images', 'Booking requests', 'Review collection'] },
  { name: 'Standard', price: 2500, period: 'month', benefits: ['Verified profile', 'Online payments', 'Calendar tools', 'Invoices', 'Referral earnings'] },
  { name: 'Premium', price: 6500, period: 'month', benefits: ['Featured placement', 'Premium badge', 'Priority search', 'Analytics', 'Priority support'] },
];

export const adminStats = [
  { label: 'Total users', value: '18,420', trend: '+12%' },
  { label: 'Providers', value: '842', trend: '+8%' },
  { label: 'Bookings', value: '31,906', trend: '+19%' },
  { label: 'Revenue', value: 'KES 14.8M', trend: '+23%' },
];

export const rankingFactors = ['Average rating', 'Review count', 'Booking completion', 'Response speed', 'Subscription tier', 'Profile completeness', 'Recent activity'];
