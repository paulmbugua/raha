export const providers = [
  {
    id: 'p-001', name: 'Amani Spa Collective', slug: 'amani-spa-collective', location: 'Westlands, Nairobi', serviceArea: 'Westlands, Parklands, Gigiri', specialty: 'Deep Tissue and Aromatherapy', rating: 4.96, reviewCount: 248, startingPrice: 4500, distanceKm: 2.4, verified: true, premium: true, topRated: true, mostBooked: true, responseRate: '98% within 10 minutes', experience: '9 years', languages: ['English', 'Kiswahili'], image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80', gallery: ['https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80'], bio: 'A verified collective of licensed wellness therapists offering hotel-quality recovery and relaxation treatments.', qualifications: ['Kenya Wellness Guild verified', 'First Aid certified'], services: [{ name: 'Signature Deep Tissue', duration: '75 min', price: 6500, description: 'Focused pressure for shoulders, back, hips, and athletic recovery.' }, { name: 'Aromatherapy Reset', duration: '60 min', price: 5000, description: 'Gentle full-body massage with essential oils and warm towels.' }], availability: ['Today 2:00 PM', 'Today 5:30 PM', 'Tomorrow 10:00 AM'], hours: 'Mon-Sat, 8:00 AM - 8:00 PM', whatsapp: '+254700111222'
  },
  {
    id: 'p-002', name: 'Serene Hands by Nia', slug: 'serene-hands-by-nia', location: 'Kilimani, Nairobi', serviceArea: 'Kilimani, Lavington, Kileleshwa', specialty: 'Prenatal and Swedish Massage', rating: 4.89, reviewCount: 174, startingPrice: 3800, distanceKm: 4.1, verified: true, premium: false, topRated: true, mostBooked: false, responseRate: '93% within 20 minutes', experience: '6 years', languages: ['English', 'Kiswahili'], image: 'https://images.unsplash.com/photo-1591343395902-1adcb454c4e2?auto=format&fit=crop&w=900&q=80', gallery: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80'], bio: 'Independent licensed therapist known for calm bedside manner and personalized pressure preferences.', qualifications: ['Prenatal massage certificate', 'Licensed independent therapist'], services: [{ name: 'Swedish Flow', duration: '60 min', price: 3800, description: 'Light to medium pressure for relaxation and circulation.' }, { name: 'Prenatal Comfort', duration: '70 min', price: 5200, description: 'Safe pressure and lower-back relief.' }], availability: ['Tomorrow 9:00 AM', 'Tomorrow 3:30 PM'], hours: 'Tue-Sun, 9:00 AM - 6:00 PM', whatsapp: '+254711333444'
  },
  {
    id: 'p-003', name: 'Coastline Recovery Spa', slug: 'coastline-recovery-spa', location: 'Nyali, Mombasa', serviceArea: 'Nyali, Bamburi, Mombasa CBD', specialty: 'Sports Recovery and Reflexology', rating: 4.82, reviewCount: 121, startingPrice: 4200, distanceKm: 8.7, verified: true, premium: true, topRated: false, mostBooked: true, responseRate: '96% within 15 minutes', experience: '7 years', languages: ['English', 'Kiswahili'], image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80', gallery: ['https://images.unsplash.com/photo-1531299244174-d247dd4e5a66?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1620733723572-11c53f73a416?auto=format&fit=crop&w=900&q=80'], bio: 'Premium coastal spa team serving hotel guests, residents, and athletes.', qualifications: ['Sports massage diploma', 'Hotel spa operations certified'], services: [{ name: 'Sports Recovery', duration: '75 min', price: 6200, description: 'Mobility-led bodywork for active clients.' }, { name: 'Reflexology', duration: '45 min', price: 4200, description: 'Targeted foot therapy for fatigue.' }], availability: ['Today 6:00 PM', 'Tomorrow 12:00 PM'], hours: 'Daily, 8:00 AM - 9:00 PM', whatsapp: '+254722555666'
  }
];

export const bookings = [
  { id: 'b-1001', providerId: 'p-001', providerName: 'Amani Spa Collective', service: 'Signature Deep Tissue', date: '2026-07-02', time: '5:30 PM', status: 'upcoming', amount: 6500, reference: 'RAHA-8K41' },
  { id: 'b-1002', providerId: 'p-002', providerName: 'Serene Hands by Nia', service: 'Swedish Flow', date: '2026-06-14', time: '10:00 AM', status: 'completed', amount: 3800, reference: 'RAHA-6N18' }
];

export const reviews = [
  { id: 'r-001', providerId: 'p-001', author: 'Wanjiku M.', rating: 5, body: 'Professional, punctual, and the best shoulder relief I have had in Nairobi.', createdAt: '2026-06-18', status: 'approved' },
  { id: 'r-002', providerId: 'p-002', author: 'Mariam A.', rating: 5, body: 'Nia made the prenatal session feel safe and luxurious.', createdAt: '2026-06-12', status: 'approved' }
];

export const subscriptionPlans = [
  { name: 'Free Trial', price: 0, period: '14 days', benefits: ['Basic listing', '3 gallery images', 'Booking requests', 'Review collection'] },
  { name: 'Standard', price: 2500, period: 'month', benefits: ['Verified profile', 'Online payments', 'Calendar tools', 'Invoices'] },
  { name: 'Premium', price: 6500, period: 'month', benefits: ['Featured placement', 'Premium badge', 'Priority search', 'Analytics'] }
];

export const adminStats = [
  { label: 'Total users', value: 18420, trend: 12 },
  { label: 'Providers', value: 842, trend: 8 },
  { label: 'Bookings', value: 31906, trend: 19 },
  { label: 'Revenue', value: 14800000, trend: 23 }
];