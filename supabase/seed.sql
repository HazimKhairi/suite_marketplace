-- Volleyball UiTM Kuala Terengganu official drop
-- Jersey only for the current drop. Custom name and number per line.
-- Sizes 3XL through 6XL carry a +RM5 surcharge; 7XL and 8XL carry +RM10.
-- Four variants: white/black × short/long. Run with `on conflict (slug)` so it is idempotent.

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
