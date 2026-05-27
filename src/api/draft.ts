import { apiFetch } from './client';

export interface DraftAnalysisRequest {
  blue_team: string[];
  red_team: string[];
  patch?: string;
}

export interface DraftAnalysisResponse {
  blue_win_rate: number;
  red_win_rate: number;
  confidence: number;
  pairwise: Array<{ a: string; b: string; a_win_rate: number; games: number }>;
}

export function analyzeDraft(body: DraftAnalysisRequest): Promise<DraftAnalysisResponse> {
  return apiFetch('/draft/analyze', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getSynergies(championIds: string[], patch?: string): Promise<unknown> {
  const qs = new URLSearchParams();
  championIds.forEach(id => qs.append('champs', id));
  if (patch) qs.set('patch', patch);
  return apiFetch(`/draft/synergies?${qs.toString()}`);
}
