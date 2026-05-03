-- Seed 5 jerseys for SUKAN UITM TERENGGANU 2026
-- Each team gets a Home (white) and Away (black) variant.

insert into public.products (slug, name, team_id, color, price, stock, image_url, description, sizes) values
  (
    'dungun-home',
    'UITM Dungun — Home Kit',
    'dungun',
    'white',
    79.00,
    50,
    '/jerseys/jersey_white.png',
    'Official home jersey for UiTM Kampus Terengganu (Dungun). Breathable mesh, sublimation print, athletic fit.',
    array['S','M','L','XL','XXL']
  ),
  (
    'dungun-away',
    'UITM Dungun — Away Kit',
    'dungun',
    'black',
    79.00,
    50,
    '/jerseys/jersey_black.png',
    'Official away jersey for UiTM Kampus Terengganu (Dungun). Stealth black with metallic detailing.',
    array['S','M','L','XL','XXL']
  ),
  (
    'kuala-terengganu-home',
    'UITM Kuala Terengganu — Home Kit',
    'kuala_terengganu',
    'white',
    79.00,
    50,
    '/jerseys/jersey_white.png',
    'Official home jersey for UiTM Kuala Terengganu. Lightweight technical fabric.',
    array['S','M','L','XL','XXL']
  ),
  (
    'bukit-besi-home',
    'UITM Bukit Besi — Home Kit',
    'bukit_besi',
    'white',
    79.00,
    50,
    '/jerseys/jersey_white.png',
    'Official home jersey for UiTM Bukit Besi. Tailored for performance.',
    array['S','M','L','XL','XXL']
  ),
  (
    'official-suite-games',
    'Suite Games 2026 — Limited Edition',
    'official',
    'black',
    99.00,
    30,
    '/jerseys/jersey_black.png',
    'Limited-edition collector kit celebrating the 5th Suite Games. Numbered hem, premium cotton blend.',
    array['S','M','L','XL','XXL']
  )
on conflict (slug) do nothing;
