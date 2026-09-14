insert into utamu_monetization_products (
  id,
  category,
  name,
  description,
  amount_kes,
  token_amount,
  duration_days,
  sort_order,
  active
) values
  (
    'agency-vip-weekly',
    'agency_listing',
    'Agency VIP subscription - weekly',
    '7 days of priority agency placement, managed-profile visibility, and VIP agency branding.',
    2000,
    0,
    7,
    52,
    true
  ),
  (
    'agency-vip-monthly',
    'agency_listing',
    'Agency VIP subscription - monthly',
    '30 days of priority agency placement, managed-profile visibility, and VIP agency branding.',
    7000,
    0,
    30,
    53,
    true
  )
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  amount_kes = excluded.amount_kes,
  token_amount = excluded.token_amount,
  duration_days = excluded.duration_days,
  sort_order = excluded.sort_order,
  active = true;
