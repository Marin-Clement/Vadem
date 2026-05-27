import { apiFetch } from './client';

export interface UserSettings {
  user_id: string;
  show_win_prediction: boolean;
  show_objective_timers: boolean;
  overlay_opacity: number;
  poll_interval_ms: number;
  theme: string;
  compact_mode: boolean;
}

export function getSettings(): Promise<UserSettings> {
  return apiFetch('/settings');
}

export function updateSettings(patch: Partial<Omit<UserSettings, 'user_id'>>): Promise<UserSettings> {
  return apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}
