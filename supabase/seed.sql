-- Volleyball UiTM Kuala Terengganu official drop
-- Jersey only for the current drop. Custom name and number per line.
-- Sizes 3XL through 6XL carry a +RM5 surcharge; 7XL and 8XL carry +RM10.

insert into public.products (slug, name, category, sleeve_type, color, price, stock, image_url, description, sizes) values
  (
    'jersey-vb-uitmkt-short',
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
    'jersey-vb-uitmkt-long',
    'VB UiTM KT Long Sleeve Jersey',
    'jersey',
    'long',
    'black',
    33.00,
    100,
    '/jerseys/jersey_black.png',
    'Official volleyball jersey for UiTM Kuala Terengganu. Long sleeve, perfect for warm-ups and match day. Custom name and number for every order.',
    array['S','M','L','XL','XXL','3XL','4XL','5XL','6XL','7XL','8XL']
  )
on conflict (slug) do nothing;
