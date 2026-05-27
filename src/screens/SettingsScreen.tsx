import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { getSettings, updateSettings, type UserSettings } from "../api/settings";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      className={`toggle ${on ? "on" : ""}`}
      onClick={onToggle}
      style={{ cursor: "pointer" }}
    />
  );
}

function SegControl({ value, options, onChange }: {
  value: string;
  options: { val: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="seg">
      {options.map(o => (
        <button
          key={o.val}
          className={`seg-item ${value === o.val ? "on" : ""}`}
          onClick={() => onChange(o.val)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsScreen() {
  const profile = useAuthStore(s => s.profile);
  const logout = useAuthStore(s => s.logout);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Apply persisted theme immediately (before API load)
    const saved = localStorage.getItem("vadem_theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);

    getSettings().then(s => { setSettings(s); applySettings(s); }).catch(() => setError("Could not load settings"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applySettings = (s: UserSettings) => {
    // Theme
    document.documentElement.setAttribute("data-theme", s.theme);
    localStorage.setItem("vadem_theme", s.theme);
  };

  const update = async (patch: Partial<Omit<UserSettings, 'user_id'>>) => {
    if (!settings) return;
    const optimistic = { ...settings, ...patch };
    setSettings(optimistic);
    applySettings(optimistic);
    setSaving(true);
    try {
      const updated = await updateSettings(patch);
      setSettings(updated);
      applySettings(updated);
    } catch {
      setSettings(settings);
      applySettings(settings); // rollback
      setError("Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content fade-up" style={{ maxWidth: 880 }}>
      <div className="t-eyebrow" style={{ marginBottom: 16 }}>
        PREFERENCES // CONFIGURATION
        {saving && <span style={{ marginLeft: 12, color: "var(--fg-3)", fontWeight: 400 }}>Saving…</span>}
        {error && <span style={{ marginLeft: 12, color: "var(--red)", fontWeight: 400 }}>{error}</span>}
      </div>

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
            {settings ? (
              <SegControl
                value={settings.theme}
                options={[{ val: "dark", label: "DARK" }, { val: "light", label: "LIGHT" }]}
                onChange={v => update({ theme: v })}
              />
            ) : <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>…</div>}
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
            {settings ? (
              <Toggle on={settings.show_win_prob} onToggle={() => update({ show_win_prob: !settings.show_win_prob })} />
            ) : <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>…</div>}
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Show objective timers</div>
              <div className="settings-row-desc">Drake, Herald, Baron countdowns</div>
            </div>
            {settings ? (
              <Toggle on={settings.show_timers} onToggle={() => update({ show_timers: !settings.show_timers })} />
            ) : <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>…</div>}
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Voice coaching</div>
              <div className="settings-row-desc">Audio cues and TTS alerts during game</div>
            </div>
            {settings ? (
              <Toggle on={settings.tts_enabled} onToggle={() => update({ tts_enabled: !settings.tts_enabled })} />
            ) : <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>…</div>}
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Overlay position</div>
              <div className="settings-row-desc">Where the HUD anchor appears on screen</div>
            </div>
            {settings ? (
              <SegControl
                value={settings.overlay_pos}
                options={[
                  { val: "top-left", label: "↖" },
                  { val: "top-right", label: "↗" },
                  { val: "bottom-left", label: "↙" },
                  { val: "bottom-right", label: "↘" },
                ]}
                onChange={v => update({ overlay_pos: v })}
              />
            ) : <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>…</div>}
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">AI voice style</div>
              <div className="settings-row-desc">Tone of voice coaching cues</div>
            </div>
            {settings ? (
              <SegControl
                value={settings.ai_voice}
                options={[
                  { val: "coach", label: "COACH" },
                  { val: "analyst", label: "ANALYST" },
                  { val: "hype", label: "HYPE" },
                ]}
                onChange={v => update({ ai_voice: v })}
              />
            ) : <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>…</div>}
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Min confidence threshold</div>
              <div className="settings-row-desc">Only show alerts above this confidence %</div>
            </div>
            {settings ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={settings.confidence_min}
                  onChange={e => update({ confidence_min: parseInt(e.target.value) })}
                  style={{ width: 100 }}
                />
                <span className="t-mono" style={{ fontSize: 12, minWidth: 32 }}>{settings.confidence_min}%</span>
              </div>
            ) : <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>…</div>}
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
