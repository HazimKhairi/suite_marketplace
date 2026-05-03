export const TEAMS = {
  dungun: {
    id: 'dungun',
    name: 'UiTM Dungun',
    fullName: 'UiTM Kampus Terengganu — Dungun',
    short: 'DGN',
    accent: '#0a2540',
  },
  kuala_terengganu: {
    id: 'kuala_terengganu',
    name: 'UiTM Kuala Terengganu',
    fullName: 'UiTM Kuala Terengganu',
    short: 'KTG',
    accent: '#7c1d3f',
  },
  bukit_besi: {
    id: 'bukit_besi',
    name: 'UiTM Bukit Besi',
    fullName: 'UiTM Bukit Besi',
    short: 'BB',
    accent: '#1f4d2e',
  },
  official: {
    id: 'official',
    name: 'Suite Games 2026',
    fullName: 'Official Suite Games 2026 Limited',
    short: 'SG26',
    accent: '#111111',
  },
} as const;

export type TeamId = keyof typeof TEAMS;
