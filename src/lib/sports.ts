// Suite Games 2026 — official sport categories. Used to gate jacket purchases
// (athletes pick their sport before unlocking the jacket).
export const SUITE_SPORTS = [
  { id: 'bola_sepak_11s', label: 'Bola Sepak 11s', kind: 'team' as const },
  { id: 'futsal', label: 'Futsal', kind: 'team' as const },
  { id: 'bola_tampar', label: 'Bola Tampar', kind: 'team' as const },
  { id: 'bola_baling', label: 'Bola Baling', kind: 'team' as const },
  { id: 'bola_jaring', label: 'Bola Jaring', kind: 'team' as const },
  { id: 'e_sport', label: 'E-Sport', kind: 'team_mixed' as const },
  { id: 'badminton', label: 'Badminton', kind: 'individual' as const },
  { id: 'sepak_takraw', label: 'Sepak Takraw', kind: 'individual' as const },
  { id: 'ping_pong', label: 'Ping Pong', kind: 'individual' as const },
  { id: 'petanque', label: 'Petanque', kind: 'individual' as const },
  { id: 'larian_suite', label: 'Larian SUiTE', kind: 'individual' as const },
] as const;

export type SuiteSportId = (typeof SUITE_SPORTS)[number]['id'];

export function isValidSport(id: string): id is SuiteSportId {
  return SUITE_SPORTS.some((s) => s.id === id);
}

export function sportLabel(id: string): string | null {
  return SUITE_SPORTS.find((s) => s.id === id)?.label ?? null;
}
