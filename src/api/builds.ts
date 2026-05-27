import { apiFetch } from './client';

export interface BuildEntry {
  name: string;
  win_rate: number;
  pick_pct: number;
  item_path: number[];
  rune_primary: string;
  runes: string[];
  games: number;
  recommended: boolean;
}

export interface BuildResponse {
  champion_id: string;
  patch: string;
  vs_champion: string | null;
  builds: BuildEntry[];
}

export interface MatchupEntry {
  champion_id: string;
  win_rate: number;
  games: number;
}

export interface SkillOrderResponse {
  champion_id: string;
  skill_order: string[];
  priority: string;
}

export function getBuilds(championId: string, params?: { vs?: string; patch?: string; rank?: string }): Promise<BuildResponse> {
  const qs = new URLSearchParams();
  if (params?.vs) qs.set('vs', params.vs);
  if (params?.patch) qs.set('patch', params.patch);
  if (params?.rank) qs.set('rank', params.rank);
  const query = qs.toString();
  return apiFetch(`/builds/${championId}${query ? '?' + query : ''}`);
}

export function getSkillOrder(championId: string): Promise<SkillOrderResponse> {
  return apiFetch(`/builds/${championId}/skill-order`);
}

export function getCounters(championId: string, patch?: string): Promise<{ champion_id: string; patch: string; strong_vs: MatchupEntry[]; weak_vs: MatchupEntry[] }> {
  const qs = patch ? `?patch=${patch}` : '';
  return apiFetch(`/builds/${championId}/counters${qs}`);
}
