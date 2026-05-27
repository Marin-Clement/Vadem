import { useEffect, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { useAuthStore } from "../store/authStore";
import { getSettings, updateSettings, type UserSettings } from "../api/settings";

export function SettingsScreen() {
  const { settings, saveSettings } = useSettings();
  const profile = useAuthStore(s => s.profile);
  const logout = useAuthStore(s => s.logout);
  const [remoteSettings, setRemoteSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    getSettings().then(setRemoteSettings).catch(() => {});
  }, []);

  const handleRemoteToggle = async (key: keyof Omit<UserSettings, 'user_id'>, value: boolean) => {
    try {
      const updated = await updateSettings({ [key]: value });
      setRemoteSettings(updated);
    } catch {
      // ignore
    }
  };

  return (
    <div className="content fade-up" style={{ maxWidth: 880 }}>
      <div className="t-eyebrow" style={{ marginBottom: 16 }}>PREFERENCES // CONFIGURATION</div>

      {/* Account */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Account</div>
        </div>
        <div className="panel-body" style={{ padding: "0 16px" }}>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Connected account</div>
              <div className="settings-row-desc">
                {profile ? `${profile.game_name}#${profile.tag_line} · ${profile.region}` : '—'}
              </div>
            </div>
            <button className="btn btn-sm" onClick={() => logout()}>DISCONNECT</button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Auto-detect game client</div>
              <div className="settings-row-desc">Launches overlay automatically when client is open</div>
            </div>
            <div className="toggle on" />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Sync across devices</div>
              <div className="settings-row-desc">Encrypted preferences sync via account</div>
            </div>
            <div className="toggle on" />
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Appearance</div>
        </div>
        <div className="panel-body" style={{ padding: "0 16px" }}>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Theme</div>
              <div className="settings-row-desc">Dark recommended for long sessions</div>
            </div>
            <div className="seg">
              <button
                className={`seg-item ${(remoteSettings?.theme ?? 'dark') === 'dark' ? 'on' : ''}`}
                onClick={() => handleRemoteToggle('theme' as never, 'dark' as never)}
              >DARK</button>
              <button
                className={`seg-item ${(remoteSettings?.theme ?? 'dark') === 'light' ? 'on' : ''}`}
                onClick={() => handleRemoteToggle('theme' as never, 'light' as never)}
              >LIGHT</button>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Compact mode</div>
              <div className="settings-row-desc">Denser layouts, smaller padding</div>
            </div>
            <div
              className={`toggle ${remoteSettings?.compact_mode ? 'on' : ''}`}
              onClick={() => remoteSettings && handleRemoteToggle('compact_mode', !remoteSettings.compact_mode)}
            />
          </div>
        </div>
      </div>

      {/* In-game overlay */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> In-game overlay</div>
        </div>
        <div className="panel-body" style={{ padding: "0 16px" }}>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Show win probability</div>
              <div className="settings-row-desc">Live estimate during the match</div>
            </div>
            <div
              className={`toggle ${settings.showWinPrediction ? "on" : ""}`}
              onClick={() => {
                saveSettings({ showWinPrediction: !settings.showWinPrediction });
                if (remoteSettings) handleRemoteToggle('show_win_prediction', !remoteSettings.show_win_prediction);
              }}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Show objective timers</div>
              <div className="settings-row-desc">Drake, Herald, Baron countdowns</div>
            </div>
            <div
              className={`toggle ${remoteSettings?.show_objective_timers ? 'on' : 'on'}`}
              onClick={() => remoteSettings && handleRemoteToggle('show_objective_timers', !remoteSettings.show_objective_timers)}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Click-through</div>
              <div className="settings-row-desc">Mouse passes through unless modifier held</div>
            </div>
            <div className="toggle on" />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Poll interval</div>
              <div className="settings-row-desc">How often to fetch game state (ms)</div>
            </div>
            <div className="t-mono" style={{ fontSize: 13, color: "var(--fg-1)" }}>
              {remoteSettings?.poll_interval_ms ?? settings.pollIntervalMs}ms
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> About</div>
        </div>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div><div className="t-eyebrow">VERSION</div><div className="t-mono" style={{ fontSize: 13, marginTop: 2 }}>2.0.0 · alpha</div></div>
            <div><div className="t-eyebrow">BACKEND</div><div className="t-mono" style={{ fontSize: 13, marginTop: 2 }}>Rust · Axum · PostgreSQL</div></div>
            <div><div className="t-eyebrow">RUNTIME</div><div className="t-mono" style={{ fontSize: 13, marginTop: 2 }}>Tauri · Rust</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
