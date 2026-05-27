import { apiFetch } from './client';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  game_name: string;
  tag_line: string;
  region: string;
}

export function connect(game_name: string, tag_line: string, region: string): Promise<AuthResponse> {
  return apiFetch('/auth/connect', {
    method: 'POST',
    body: JSON.stringify({ game_name, tag_line, region }),
  });
}

export function refresh(refresh_token: string): Promise<{ access_token: string; refresh_token: string }> {
  return apiFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token }),
  });
}

export function logout(): Promise<void> {
  return apiFetch('/auth/session', { method: 'DELETE' });
}
