-- Volleyball UiTM Kuala Terengganu official drop
-- Jersey: custom name and number per line. 3XL-6XL +RM5, 7XL-8XL +RM10.
-- Jacket: no personalisation. Plus sizes (3XL and up) flat +RM15.
-- Four jersey variants (white/black × short/long) plus the white track jacket.
-- Run with `on conflict (slug)` so it is idempotent.

insert into public.products (slug, name, category, sleeve_type, color, price, stock, image_url, description, sizes) values
  (
    'jersey-vb-uitmkt-white-short',
    'VB UiTM KT Short Sleeve Jersey',
    'jersey',
    'short',
    'white',
    28.00,
    100,
    '/jerseys/jersey_white.png',
    'Official volleyball jersey for UiTM Kuala Terengganu. Short sleeve, sublimation print, breathable mesh. Custom name and number for every order.',
    array['S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL','8XL']
  ),
  (
    'jersey-vb-uitmkt-white-long',
    'VB UiTM KT Long Sleeve Jersey',
    'jersey',
    'long',
    'white',
    33.00,
    100,
    '/jerseys/jersey_white_long_sleeve.png',
    'Official volleyball jersey for UiTM Kuala Terengganu. Long sleeve, perfect for warm-ups and match day. Custom name and number for every order.',
    array['S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL','8XL']
  ),
  (
    'jersey-vb-uitmkt-black-short',
    'VB UiTM KT Short Sleeve Jersey',
    'jersey',
    'short',
    'black',
    28.00,
    100,
    '/jerseys/jersey_black.png',
    'Official volleyball jersey for UiTM Kuala Terengganu. Short sleeve, sublimation print, breathable mesh. Custom name and number for every order.',
    array['S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL','8XL']
  ),
  (
    'jersey-vb-uitmkt-black-long',
    'VB UiTM KT Long Sleeve Jersey',
    'jersey',
    'long',
    'black',
    33.00,
    100,
    '/jerseys/jersey_black_long_sleeve.png',
    'Official volleyball jersey for UiTM Kuala Terengganu. Long sleeve, perfect for warm-ups and match day. Custom name and number for every order.',
    array['S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL','8XL']
  ),
  (
    'jacket-vb-uitmkt-white',
    'VB UiTM KT Track Jacket',
    'jacket',
    null,
    'white',
    80.00,
    50,
    '/jerseys/jacket_white.png',
    'Official UiTM Kuala Terengganu track jacket. Full zip, suitable for all athletes — warm-ups, podium, post-match. No custom name and number.',
    array['S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL','8XL']
  )
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  sleeve_type = excluded.sleeve_type,
  color = excluded.color,
  price = excluded.price,
  image_url = excluded.image_url,
  description = excluded.description,
  sizes = excluded.sizes,
  active = true;

-- Retire legacy slugs from earlier seeds (white-short / black-long aliases) so the catalog only renders the four canonical variants.
update public.products set active = false where slug in ('jersey-vb-uitmkt-short', 'jersey-vb-uitmkt-long');
