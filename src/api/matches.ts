import { apiFetch } from './client';

export interface MatchListItem {
  id: string;
  match_id: string;
  result: boolean;
  queue_id: number;
  queue_name: string;
  duration_secs: number;
  played_at: string;
  champion_id: string;
  role: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  cs_per_min: number;
  gold_earned: number;
  damage_dealt: number;
  vision_score: number;
  items: number[];
}

export interface MatchDetail extends MatchListItem {
  ally_champions: string[];
  enemy_champions: string[];
}

export function listMatches(params?: { champion?: string; queue?: number; limit?: number }): Promise<MatchListItem[]> {
  const qs = new URLSearchParams();
  if (params?.champion) qs.set('champion', params.champion);
  if (params?.queue != null) qs.set('queue', String(params.queue));
  if (params?.limit != null) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return apiFetch(`/matches${query ? '?' + query : ''}`);
}

export function getMatch(matchId: string): Promise<MatchDetail> {
  return apiFetch(`/matches/${matchId}`);
}

/** Format duration_secs → "MM:SS" */
export function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Format played_at ISO string → relative label */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
