import { apiFetch } from './client';

export interface UserSettings {
  user_id: string;
  theme: string;
  ai_voice: string;
  overlay_pos: string;
  show_win_prob: boolean;
  show_timers: boolean;
  tts_enabled: boolean;
  confidence_min: number;
}

export type UpdateSettings = Partial<Omit<UserSettings, 'user_id'>>;

export function getSettings(): Promise<UserSettings> {
  return apiFetch('/settings');
}

export function updateSettings(patch: UpdateSettings): Promise<UserSettings> {
  return apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}
