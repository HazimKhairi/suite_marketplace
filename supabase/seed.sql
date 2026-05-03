-- Volleyball UiTM Kuala Terengganu — current drop
-- Jersey only (jacket excluded for now). Custom name + number per order line.

insert into public.products (slug, name, category, sleeve_type, color, price, stock, image_url, description, sizes) values
  (
    'jersey-vb-uitmkt-short',
    'VB UiTM KT — Jersey Lengan Pendek',
    'jersey',
    'short',
    'white',
    28.00,
    100,
    '/jerseys/jersey_white.png',
    'Official volleyball jersey for UiTM Kuala Terengganu. Lengan pendek, sublimation print, breathable mesh. Custom nama + nombor untuk setiap baju.',
    array['S','M','L','XL','XXL']
  ),
  (
    'jersey-vb-uitmkt-long',
    'VB UiTM KT — Jersey Lengan Panjang',
    'jersey',
    'long',
    'black',
    33.00,
    100,
    '/jerseys/jersey_black.png',
    'Official volleyball jersey for UiTM Kuala Terengganu. Lengan panjang, perfect for warm-ups & match day. Custom nama + nombor untuk setiap baju.',
    array['S','M','L','XL','XXL']
  )
on conflict (slug) do nothing;
