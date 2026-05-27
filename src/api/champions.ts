import { apiFetch } from './client';

export interface ChampionStats {
  champion_id: string;
  patch: string;
  rank_bucket: string;
  role: string;
  games: number;
  wins: number;
  picks: number;
  bans: number;
  avg_kda: number | null;
  avg_cs_min: number | null;
}

export interface PatchDelta {
  champion_id: string;
  wr_delta: number;
  notes: string;
}

export function getChampionStats(championId: string, patch?: string): Promise<ChampionStats> {
  const qs = patch ? `?patch=${patch}` : '';
  return apiFetch(`/champions/${championId}${qs}`);
}

export function getCurrentPatch(): Promise<{ version: string }> {
  return apiFetch('/patch/current');
}

export async function getPatchDeltas(patch?: string): Promise<PatchDelta[]> {
  const qs = patch ? `?patch=${patch}` : '';
  const res = await apiFetch<{ deltas: Array<{ champion_id: string; wr_delta: number; current_patch: string; prev_patch: string }> }>(`/patch/deltas${qs}`);
  return res.deltas.map(d => ({
    champion_id: d.champion_id,
    wr_delta: d.wr_delta,
    notes: `${d.prev_patch} → ${d.current_patch}`,
  }));
}
