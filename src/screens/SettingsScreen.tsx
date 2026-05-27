import { PLAYER } from "../data/mockData";
import { useSettings } from "../hooks/useSettings";


export function SettingsScreen() {
  const { settings, saveSettings } = useSettings();

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
              <div className="settings-row-desc">{PLAYER.handle}#{PLAYER.tag} · {PLAYER.region}</div>
            </div>
            <button className="btn btn-sm">DISCONNECT</button>
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
              <button className="seg-item on">DARK</button>
              <button className="seg-item">LIGHT</button>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Compact mode</div>
              <div className="settings-row-desc">Denser layouts, smaller padding</div>
            </div>
            <div className="toggle" />
          </div>
        </div>
      </div>

      {/* AI Coach */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> AI Coach</div>
        </div>
        <div className="panel-body" style={{ padding: "0 16px" }}>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Voice & tone</div>
              <div className="settings-row-desc">How the assistant speaks to you</div>
            </div>
            <div className="seg">
              <button className="seg-item on">COACH</button>
              <button className="seg-item">DATA</button>
              <button className="seg-item">HYBRID</button>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Voice callouts (TTS)</div>
              <div className="settings-row-desc">Speak objective timers and warnings aloud</div>
            </div>
            <div className="toggle" />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Confidence threshold</div>
              <div className="settings-row-desc">Hide suggestions below this confidence</div>
            </div>
            <div className="t-mono" style={{ fontSize: 13, color: "var(--accent)" }}>72%</div>
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
              <div className="settings-row-desc">Live AI estimate during the match</div>
            </div>
            <div
              className={`toggle ${settings.showWinPrediction ? "on" : ""}`}
              onClick={() => saveSettings({ showWinPrediction: !settings.showWinPrediction })}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-name">Show objective timers</div>
              <div className="settings-row-desc">Drake, Herald, Baron countdowns</div>
            </div>
            <div className="toggle on" />
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
            <div className="t-mono" style={{ fontSize: 13, color: "var(--fg-1)" }}>{settings.pollIntervalMs}ms</div>
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
            <div><div className="t-eyebrow">MODEL</div><div className="t-mono" style={{ fontSize: 13, marginTop: 2 }}>YuumiNet v2.4</div></div>
            <div><div className="t-eyebrow">RUNTIME</div><div className="t-mono" style={{ fontSize: 13, marginTop: 2 }}>Tauri · Rust</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
