import { apiFetch } from './client';

export interface RankInfo {
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
}

export interface PlayerProfile {
  user_id: string;
  game_name: string;
  tag_line: string;
  region: string;
  summoner_level: number;
  profile_icon_id: number;
  rank: RankInfo | null;
}

export function getProfile(): Promise<PlayerProfile> {
  return apiFetch('/players/me');
}

export function syncMatches(): Promise<{ synced: number }> {
  return apiFetch('/players/me/sync', { method: 'POST' });
}
