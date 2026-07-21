export type UtamuModel = {
  id: string;
  name: string;
  slug: string;
  city: string;
  county: string;
  category: string;
  gender?: 'Female' | 'Male' | string;
  listingTier?: string;
  trustedBadge?: boolean;
  galleryLimit?: number;
  sidebarAd?: boolean;
  age: number;
  height: string;
  rating: number;
  reviews: number;
  priceFrom: number;
  online: boolean;
  verified: boolean;
  elite: boolean;
  responseTime: string;
  image: string;
  gallery: string[];
  bio: string;
  specialties: string[];
  stats: { bookings: number; profileViews: number; completion: number; earnings: number };
  rates: Array<{ label: string; price: number; duration: string }>;
};

export type VerificationCase = {
  id: string;
  modelName: string;
  status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
  submittedAt: string;
  risk: 'low' | 'medium' | 'high';
  notes: string;
};

export const modelImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA2UuopRE8nQbfoBT-HNXErANCNPCm3E51Z_ehgoz0nnL9MeS9DmlfYNpB0zR17-ocxMtqk6xIXu6w_fbLgIJ1yipxmaXqsQefY3ZOHM9cW02761G2z40fe6LMIxR7W8tp9akviWF2YXMuYgudl6lJr9z-gQdU2IKRit3rihwX5nTIZLKzGqWJB_pASJBAiq3_m2SlwjXmqGwL6KGcuDDeraLqLcua-zDyc_kk5f-yOeC5wJzkNlg-MdLSw_Oy6VjZWOSkzlGslaNo',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDJr1NWDr55ZMkfBE7IEgEix7wKA_cKg2lKjK9JSbhXB2T0LTzPllquSJElNOyZ2cTRVr1j5IokDhxvq9BMhx9qIBBT4rdhzAHuU0RwQKtdmhCewrUszE2PIgq5HHm-Sy9ZFJHuCYrO5l7KyA0AUphdNMMJDq_Ib-YIdP4Y4bNF_fyqyo_aAMfaLhSCN0_DoxoVzlV6VVLA6oXzuf-XtzwubSmYA-KM88RLOo_ckktbet0mb5-c6JGo5Ql2mHbgoztgalYdAwBq-7o',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDGWWevFgbcNE15Tpn1z-WzDpmsl2TbPgm0m4_YTLPm4l28RGST21BV79NsjEXhuY2ZT4TDw1MiM7BpfYQ63ydjvcggt15FDrnZMpbuA9Fgz_UYg6NRYvj17iZlEnk_KPl6XD4ajrI3Suhgte5Gdy4ZvGEe7Rc_3mriowrNphbLysWqEEgRlocwMRv3Spid3bswfSQ3ImBhdLtrfLdtiTh0yumVsZkLK5V_vEb7tvO_PXdym8Rn7_Q1J56N1OjfKgfUlQdUkX-M8bk',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC6701z7UmZ-3KMPtZP6MMkbz_qPRdw1za8s8G34Y73dZYLxSH4bRVqjbiVQvyJ0yA-lb3nAGwW_Ipo8VHkdb0zc3sLf1WY5L-n_G-vlOSRms2nQNEGpafjwUSB7dUB0HOK99L_UXB7yPfP7iwqKaY-U3AEzojf2S8v9JWbaXFLHJb4iIwp35AqhOrxoiw5u_aIZN0OfP-gacm8gobSwPeZfpIXaA_PRUDdNH5IyyULm1YPzfAlTAxgyAs-Bhbg3ZmLdqgN3aftrLo',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTj0jo9QmqEt9GAJSQ3qnhd3TOiI5dOKX2EcUQyadZCbqwM5hvL76dPjjnir5w49n9qiel29qV03elcCFwqCwkTH1_vmefSCT3XjFd3RxuToDkos8pydESvwepN-yLnD2sFLt5XE4Qs3LhiX4NY_5Ol58F2pE5vz0ILpIKiIpyj2RTiP2t7EX1u9vd3X6jhKqbHpblBT4zWOoQ-yYLLQF-UEN8NlNyNvCABMhPKssbVGTKhK4CGYoikSc_B-eaiElA9euSJxeCQq8',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuADyhJd9sYsioNFe7dJ3o2xd1bqDRK3pYety8Ikw6p7xJdRAyFUaUSzG2N-G-VEAsFjq78piP0ICT0RMHFvy_6sJ9qrjdOqXaVSPyEnMf-0ftfBu9hjxbrUoqePz8jKzqkD7x9dmoXxLirU6GRBhpZoAxSf25cUemrzdXuF13TtiHgoRgSDWokf7lP3_DyePIWofrSumGq4qCrNW1sW2EUe2rnzYQIpVtUGwSfMvJrk9TCNB8z1Sc0ggyenkSnG5PrK9Xr13BIe49E',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB9Ymnng8ZfoGsORKtWPNQ8uEZ1nCSjZ9lM0cTv5kb1fXKb-4hMI2USod_Za_I726-T4-hCGYuCQonrhdPK2aM0tqtVQC8HlN3khrRDHm6YSgBC2xfGgwHKnZQWKAEvv6jbt8hjr3T_jKo3damUAUpXQwSz0pRU-hlgYzYrzq_HLEFXVjTOgtPugxkf9BHCCYgMZXr66O5iVt6c3t5L2hJttr7nEyKWOpJhwZQK_i8mS_xEjuBSb-oFqHqniT-7AJTsWo6qsgcNo6A',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBFAzVfvKTUPGW7awdZDNYpcaaVFcc3FLBC0racphm1O0KmmYhjKAL1hC1rYFSu1nAT9V1cAFr-Ule7z5l-7nUWAQSR4wVY-ZBl3mi7b7vULkKheIN82jUqNFfXYKNzZk9h3DyPwG_obhY1AXvE2gMfV9TlnxlcINfZ039THVbpGP-sbY5A7jmQfU4XYy5xrHIyrnlUWs2k7Amda4zs99O6rIO-_-U_gd8ztHJCW8mhLOu_MigkfIL6STZPzT-0EyUWloJTDXV3GIU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQq9aDhX7DwTvhja0D5xIqdi28-YwIE3rSKTBEj0DyNZA1N1u77-3tejRR20QQRsIDdPX-mYmLj68Oc38V5W22r3Na2PvnK_kifvPT4CjbyRPan0ciBheHfCVZbcCRMnpqct89B3cF4kuUSQPDViA_dfgkjogPywsWwVREBsBQxoSrt69Ju5aTg0BJlOgiSofPNWlkY10FfLkAWlFfmrZzBE87ubQB9eRYLnqRYLp9PzhmS-8msnV9UYVAAD6hC2_qDsPylRlhKQo',
];

export const models: UtamuModel[] = [
  {
    id: 'm-001', name: 'Amina W.', slug: 'amina-w', city: 'Westlands', county: 'Nairobi', category: 'Premium Escort', gender: 'Female', age: 24, height: '5ft 8in', rating: 4.96, reviews: 128, priceFrom: 8500, online: true, verified: true, elite: true, responseTime: 'Usually replies in 7 minutes', image: modelImages[0], gallery: [modelImages[6], modelImages[7], modelImages[8], modelImages[1], modelImages[2]], bio: 'Premium Nairobi escort with polished presentation, discreet communication, and availability for private bookings, hospitality, and curated social time.', specialties: ['Editorial', 'Luxury events', 'Beauty campaigns', 'Lifestyle content'], stats: { bookings: 84, profileViews: 18400, completion: 96, earnings: 482000 }, rates: [{ label: 'Portfolio access deposit', price: 500, duration: 'Instant unlock' }, { label: 'Brand shoot booking', price: 18500, duration: 'Half day' }, { label: 'Event appearance', price: 32000, duration: 'Evening' }]
  },
  {
    id: 'm-002', name: 'Nia K.', slug: 'nia-k', city: 'Kilimani', county: 'Nairobi', category: 'VIP Companion', gender: 'Female', age: 22, height: '5ft 6in', rating: 4.91, reviews: 94, priceFrom: 6500, online: false, verified: true, elite: false, responseTime: 'Usually replies in 18 minutes', image: modelImages[1], gallery: [modelImages[1], modelImages[3], modelImages[4]], bio: 'VIP companion based around Kilimani with clear availability, verified profile details, and discreet booking communication.', specialties: ['Commercial shoots', 'Hospitality', 'Wellness', 'UGC'], stats: { bookings: 61, profileViews: 12100, completion: 91, earnings: 318000 }, rates: [{ label: 'Portfolio access deposit', price: 500, duration: 'Instant unlock' }, { label: 'Commercial shoot', price: 14500, duration: 'Half day' }]
  },
  {
    id: 'm-003', name: 'Talia M.', slug: 'talia-m', city: 'Nyali', county: 'Mombasa', category: 'Elite Escort', gender: 'Female', age: 25, height: '5ft 10in', rating: 4.88, reviews: 76, priceFrom: 7200, online: true, verified: true, elite: true, responseTime: 'Usually replies in 12 minutes', image: modelImages[2], gallery: [modelImages[2], modelImages[5], modelImages[8]], bio: 'Elite coastal escort with luxury hospitality experience, travel-ready availability, and polished presentation.', specialties: ['Runway', 'Resort campaigns', 'Luxury hosting', 'Swimwear'], stats: { bookings: 48, profileViews: 9900, completion: 89, earnings: 276000 }, rates: [{ label: 'Portfolio access deposit', price: 500, duration: 'Instant unlock' }, { label: 'Runway booking', price: 22000, duration: 'Event' }]
  },
  {
    id: 'm-004', name: 'Zuri A.', slug: 'zuri-a', city: 'Milimani', county: 'Kisumu', category: 'Verified Escort', gender: 'Female', age: 23, height: '5ft 7in', rating: 4.84, reviews: 58, priceFrom: 5900, online: false, verified: false, elite: false, responseTime: 'Usually replies in 30 minutes', image: modelImages[4], gallery: [modelImages[4], modelImages[7]], bio: 'Verified escort with a polished look, friendly communication, and flexible private booking availability.', specialties: ['Beauty', 'Skincare', 'Content shoots'], stats: { bookings: 31, profileViews: 7600, completion: 74, earnings: 146000 }, rates: [{ label: 'Portfolio access deposit', price: 500, duration: 'Instant unlock' }, { label: 'Beauty campaign', price: 12000, duration: 'Half day' }]
  },
];

export const verificationCases: VerificationCase[] = [
  { id: 'v-1001', modelName: 'Amina W.', status: 'pending', submittedAt: '2026-06-29 09:12', risk: 'low', notes: 'ID, selfie match, and M-Pesa owner name require final admin review.' },
  { id: 'v-1002', modelName: 'Zuri A.', status: 'rejected', submittedAt: '2026-06-28 16:42', risk: 'medium', notes: 'Certificate photo was blurred. Applicant can resubmit clearer documents.' },
  { id: 'v-1003', modelName: 'Talia M.', status: 'resubmitted', submittedAt: '2026-06-29 11:05', risk: 'low', notes: 'Updated ID image received. Awaiting approval.' },
];

export const bookings = [
  { id: 'b-001', modelName: 'Amina W.', service: 'Portfolio access deposit', date: '2026-07-01', amount: 500, status: 'paid', reference: 'UTAMU-84QK' },
  { id: 'b-002', modelName: 'Nia K.', service: 'Commercial shoot', date: '2026-07-04', amount: 14500, status: 'pending', reference: 'UTAMU-19TA' },
];

export const reviews = [
  { id: 'r-001', modelName: 'Amina W.', author: 'Verified client', rating: 5, body: 'Professional, punctual, and excellent on set. The profile matched the booking details.', createdAt: '2026-06-21' },
  { id: 'r-002', modelName: 'Talia M.', author: 'Creative director', rating: 5, body: 'Strong runway presence and quick communication through the platform.', createdAt: '2026-06-18' },
];

export const analytics = { revenue: 1840000, bookings: 964, approvalRate: 82, activeModels: 418, chart: [45, 62, 58, 74, 88, 71, 96, 84] };
export const cities = ['All', 'Nairobi', 'Westlands', 'Kilimani', 'Kileleshwa', 'Lavington', 'Karen', 'Runda', 'Gigiri', 'Parklands', 'South B', 'South C', 'Eastleigh', 'Embakasi', 'Kasarani', 'Rongai', 'Thika', 'Kiambu', 'Ruaka', 'Athi River', 'Machakos', 'Mombasa', 'Nyali', 'Diani', 'Malindi', 'Kisumu', 'Nakuru', 'Naivasha', 'Eldoret', 'Kericho', 'Kakamega', 'Kisii', 'Meru', 'Nanyuki', 'Nyeri', 'Embu', 'Garissa'];
export const categories = ['All', 'Premium Escort', 'VIP Companion', 'Elite Escort', 'Verified Escort'];
