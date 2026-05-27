import { apiFetch } from './client';

export interface RankInfo {
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
}

export interface PlayerProfile {
  user_id?: string;
  id?: string;
  game_name: string;
  tag_line: string;
  region: string;
  summoner_level: number;
  profile_icon_id: number;
  rank: RankInfo | null;
}

export interface PlayerSummary {
  games: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  avg_cs_per_min: number;
  avg_vision_score: number;
  streak: number;
}

export interface ChampionPoolEntry {
  champion_id: string;
  games: number;
  wins: number;
  win_rate: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  avg_cs_per_min: number;
}

export interface RoleDist {
  role: string;
  games: number;
  wins: number;
  win_rate: number;
}

export function getProfile(): Promise<PlayerProfile> {
  return apiFetch('/players/me');
}

export function getSummary(): Promise<PlayerSummary> {
  return apiFetch('/players/me/summary');
}

export function getChampionPool(): Promise<ChampionPoolEntry[]> {
  return apiFetch('/players/me/champion-pool');
}

export function getRoleDist(): Promise<RoleDist[]> {
  return apiFetch('/players/me/role-dist');
}

export function syncMatches(): Promise<{ synced: number }> {
  return apiFetch('/players/me/sync', { method: 'POST' });
}

export function triggerGlobalCrawl(): Promise<{ status: string }> {
  return apiFetch('/players/me/crawl-global', { method: 'POST' });
}

export function getPublicProfile(puuid: string, gameName: string, tagLine: string): Promise<PlayerProfile> {
  const qs = new URLSearchParams({ game_name: gameName, tag_line: tagLine });
  return apiFetch(`/players/${puuid}/profile?${qs}`);
}

export interface PublicMatchItem {
  match_id: string;
  champion_id: string;
  role: string;
  result: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  duration_secs: number;
  played_at: number; // ms timestamp
  queue_name: string;
  ally_champions: string[];
  ally_names: string[];
  ally_puuids: string[];
  enemy_champions: string[];
  enemy_names: string[];
  enemy_puuids: string[];
}

export interface FullPublicProfile {
  profile: PlayerProfile;
  summary: PlayerSummary;
  champ_pool: ChampionPoolEntry[];
  role_dist: RoleDist[];
  matches: PublicMatchItem[];
}

export function getFullPublicProfile(puuid: string, gameName: string, tagLine: string): Promise<FullPublicProfile> {
  const qs = new URLSearchParams({ game_name: gameName, tag_line: tagLine });
  return apiFetch(`/players/${puuid}/full-profile?${qs}`);
}
