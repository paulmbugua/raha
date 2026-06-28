'use client';

import { useEffect, useMemo, useState } from 'react';
import { bookings as fallbackBookings, providers as fallbackProviders, reviews as fallbackReviews, subscriptionPlans as fallbackPlans } from '../data/raha';
import { rahaApi } from '../lib/rahaApi';

export function useRahaMarketplace() {
  const [data, setData] = useState({
    providers: fallbackProviders,
    bookings: fallbackBookings,
    reviews: fallbackReviews,
    subscriptionPlans: fallbackPlans,
  });
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('All');
  const [service, setService] = useState('All');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [sort, setSort] = useState('Rating');

  useEffect(() => {
    let mounted = true;
    rahaApi.getMarketplace().then((next) => {
      if (mounted) setData(next);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProviders = useMemo(() => {
    const text = query.trim().toLowerCase();
    return [...data.providers]
      .filter((provider) => !text || [provider.name, provider.location, provider.specialty].join(' ').toLowerCase().includes(text))
      .filter((provider) => location === 'All' || provider.location.toLowerCase().includes(location.toLowerCase()))
      .filter((provider) => service === 'All' || provider.specialty.toLowerCase().includes(service.toLowerCase()) || provider.services.some((item) => item.name.toLowerCase().includes(service.toLowerCase())))
      .filter((provider) => !premiumOnly || provider.premium)
      .filter((provider) => !verifiedOnly || provider.verified)
      .sort((a, b) => {
        if (sort === 'Distance') return a.distanceKm - b.distanceKm;
        if (sort === 'Newest') return b.reviewCount - a.reviewCount;
        if (sort === 'Price') return a.startingPrice - b.startingPrice;
        return b.rating - a.rating;
      });
  }, [data.providers, location, premiumOnly, query, service, sort, verifiedOnly]);

  return {
    ...data,
    filteredProviders,
    filters: { query, location, service, premiumOnly, verifiedOnly, sort },
    actions: { setQuery, setLocation, setService, setPremiumOnly, setVerifiedOnly, setSort },
  };
}
