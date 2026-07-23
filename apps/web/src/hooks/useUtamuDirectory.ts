'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UtamuModel } from '../data/utamu';
import { analytics as fallbackAnalytics, categories, cities } from '../data/utamu';
import { utamuApi } from '../lib/utamuApi';

type UtamuDirectoryState = {
  models: UtamuModel[];
  bookings: any[];
  reviews: any[];
  verificationCases: any[];
  analytics: typeof fallbackAnalytics;
};

export function useUtamuDirectory() {
  const [data, setData] = useState<UtamuDirectoryState>({ models: [], bookings: [], reviews: [], verificationCases: [], analytics: fallbackAnalytics });
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All');
  const [category, setCategory] = useState('All');
  const [gender, setGender] = useState('All');
  const [listingType, setListingType] = useState('All');
  const [service, setService] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [eliteOnly, setEliteOnly] = useState(false);

  useEffect(() => {
    let mounted = true;
    utamuApi.getDirectory().then((next) => {
      if (mounted) setData(next);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredModels = useMemo(() => {
    const text = query.trim().toLowerCase();
    const minimum = Number(minPrice || 0);
    const maximum = Number(maxPrice || 0);
    return data.models
      .filter((model) => {
        const extended = model as typeof model & { gender?: string; listingTier?: string; trustedBadge?: boolean };
        const searchable = [model.name, model.city, model.county, model.category, model.specialties.join(' '), extended.gender, extended.listingTier].join(' ').toLowerCase();
        return !text || searchable.includes(text);
      })
      .filter((model) => city === 'All' || model.county === city || model.city === city)
      .filter((model) => category === 'All' || model.category === category)
      .filter((model) => gender === 'All' || String((model as typeof model & { gender?: string }).gender || 'Female').toLowerCase() === gender.toLowerCase())
      .filter((model) => service === 'All' || model.specialties.some((item) => item.toLowerCase().includes(service.toLowerCase())) || model.category.toLowerCase().includes(service.toLowerCase()))
      .filter((model) => !minimum || Number(model.priceFrom || 0) >= minimum)
      .filter((model) => !maximum || Number(model.priceFrom || 0) <= maximum)
      .filter((model) => {
        const extended = model as typeof model & { listingTier?: string; trustedBadge?: boolean };
        if (listingType === 'VIP') return model.elite || extended.listingTier === 'vip';
        if (listingType === 'Independent') return [model.category, model.specialties.join(' '), extended.listingTier].join(' ').toLowerCase().includes('independent');
        if (listingType === 'Trusted') return model.verified || Boolean(extended.trustedBadge);
        return true;
      })
      .filter((model) => !verifiedOnly || model.verified)
      .filter((model) => !eliteOnly || model.elite)
      .sort((a, b) => Number(b.elite) - Number(a.elite) || b.rating - a.rating || b.reviews - a.reviews);
  }, [category, city, data.models, eliteOnly, gender, listingType, maxPrice, minPrice, query, service, verifiedOnly]);

  function applySearchParams(params: URLSearchParams) {
    setQuery(params.get('query') || '');
    setCity(params.get('city') || 'All');
    setCategory(params.get('category') || 'All');
    setGender(params.get('gender') || 'All');
    const nextListingType = params.get('listing') || (params.get('vip') === 'true' ? 'VIP' : params.get('verified') === 'true' ? 'Trusted' : 'All');
    setListingType(nextListingType);
    setService(params.get('service') || 'All');
    setMinPrice(params.get('minPrice') || '');
    setMaxPrice(params.get('maxPrice') || '');
    setVerifiedOnly(params.get('verified') === 'true' && nextListingType !== 'Trusted');
    setEliteOnly(params.get('vip') === 'true' && nextListingType !== 'VIP');
  }

  return {
    ...data,
    filteredModels,
    options: { cities, categories },
    filters: { query, city, category, gender, listingType, service, minPrice, maxPrice, verifiedOnly, eliteOnly },
    actions: { setQuery, setCity, setCategory, setGender, setListingType, setService, setMinPrice, setMaxPrice, setVerifiedOnly, setEliteOnly, applySearchParams },
  };
}
