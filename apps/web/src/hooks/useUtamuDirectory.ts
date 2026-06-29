'use client';

import { useEffect, useMemo, useState } from 'react';
import { analytics as fallbackAnalytics, bookings as fallbackBookings, categories, cities, models as fallbackModels, reviews as fallbackReviews, verificationCases as fallbackCases } from '../data/utamu';
import { utamuApi } from '../lib/utamuApi';

export function useUtamuDirectory() {
  const [data, setData] = useState({ models: fallbackModels, bookings: fallbackBookings, reviews: fallbackReviews, verificationCases: fallbackCases, analytics: fallbackAnalytics });
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All');
  const [category, setCategory] = useState('All');
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
    return data.models
      .filter((model) => !text || [model.name, model.city, model.county, model.category, model.specialties.join(' ')].join(' ').toLowerCase().includes(text))
      .filter((model) => city === 'All' || model.county === city || model.city === city)
      .filter((model) => category === 'All' || model.category === category)
      .filter((model) => !verifiedOnly || model.verified)
      .filter((model) => !eliteOnly || model.elite)
      .sort((a, b) => Number(b.elite) - Number(a.elite) || b.rating - a.rating || b.reviews - a.reviews);
  }, [category, city, data.models, eliteOnly, query, verifiedOnly]);

  return {
    ...data,
    filteredModels,
    options: { cities, categories },
    filters: { query, city, category, verifiedOnly, eliteOnly },
    actions: { setQuery, setCity, setCategory, setVerifiedOnly, setEliteOnly },
  };
}
