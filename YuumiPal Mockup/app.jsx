/* global React, ReactDOM */
const { useState, useEffect } = React;

const NAV = [
  { id: "dashboard", icon: "home",     label: "Dashboard" },
  { id: "profile",   icon: "user",     label: "Profile & history" },
  { id: "draft",     icon: "draft",    label: "Draft assistant" },
  { id: "builds",    icon: "build",    label: "Build recommender" },
  { id: "macro",     icon: "macro",    label: "Macro & objectives" },
  { id: "overlay",   icon: "overlay",  label: "Overlay preview" },
  { id: "settings",  icon: "settings", label: "Settings" },
];

const SCREEN_LABEL = {
  dashboard: ["BRIEFING", "Dashboard"],
  profile:   ["PROFILE", "Match history & stats"],
  draft:     ["DRAFT", "Champion select assistant"],
  matchDetail: ["MATCH", "Detailed analysis"],
  builds:    ["BUILDS", "Items & runes"],
  macro:     ["MACRO", "Objectives & live game"],
  overlay:   ["OVERLAY", "In-game widget preview"],
  settings:  ["CONFIG", "Settings"],
};

const TWEAK_DEFAULTS = JSON.parse(
  document.getElementById("yuumi-tweaks-defaults").textContent
    .replace(/\/\*EDITMODE-BEGIN\*\//, "")
    .replace(/\/\*EDITMODE-END\*\//, "")
);

const App = () => {
  const [screen, setScreen] = useState("dashboard");
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tweaks.theme);
  }, [tweaks.theme]);

  const [eyebrow, title] = SCREEN_LABEL[screen] || ["", ""];

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return <window.DashboardScreen
                 onNavigate={setScreen}
                 onSelectMatch={(id) => setSelectedMatchId(id)}/>;
      case "profile":
        return <window.ProfileScreen
                 selectedMatchId={selectedMatchId}
                 onSelectMatch={setSelectedMatchId}
                 onOpenMatchDetail={(id) => { setSelectedMatchId(id); setScreen("matchDetail"); }}/>;
      case "matchDetail":
        return <window.MatchDetailScreen matchId={selectedMatchId} onBack={() => setScreen("profile")}/>;
      case "draft":    return <window.DraftScreen/>;
      case "builds":   return <window.BuildsScreen/>;
      case "macro":    return <window.MacroScreen/>;
      case "overlay":
        return (
          <div className="content fade-up">
            <div className="t-eyebrow" style={{marginBottom: 12}}>OVERLAY PREVIEW · POSITION: {tweaks.overlayPosition.toUpperCase()}</div>
            <div className="panel" style={{padding: 0, overflow: "hidden"}}>
              <div style={{
                position: "relative",
                aspectRatio: "16 / 9",
                background: "oklch(0.10 0.02 280)",
                overflow: "hidden",
              }}>
                <div style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "rgba(255,255,255,0.08)", fontFamily: "var(--ff-display)", fontSize: 80, fontWeight: 700, letterSpacing: "-0.04em"}}>RIFTLINE</div>
                <div style={{position: "absolute", top: 16, left: 16, right: 16, display:"flex", justifyContent:"space-between", color:"rgba(255,255,255,0.5)", fontFamily:"var(--ff-mono)", fontSize: 11}}>
                  <span>[ Game in progress · placeholder ]</span>
                  <span>18:24</span>
                </div>
                <window.Overlay position={tweaks.overlayPosition}/>
              </div>
            </div>
            <div style={{display:"flex", gap: 8, marginTop: 14}}>
              {[["top-left","Top left"],["top-right","Top right"],["bottom-left","Bottom left"],["bottom-right","Bottom right"]].map(([k,l]) => (
                <button key={k} className={`btn btn-sm ${tweaks.overlayPosition === k ? "btn-primary" : ""}`} onClick={() => setTweak("overlayPosition", k)}>{l}</button>
              ))}
            </div>
          </div>
        );
      case "settings": return <window.SettingsScreen tweaks={tweaks} setTweak={setTweak}/>;
      default: return null;
    }
  };

  return (
    <div className="tauri-window">
      <div className="titlebar">
        <div className="titlebar-left">
          <div className="titlebar-brand">
            <div className="titlebar-brand-mark"/>
            YUUMIPAL
          </div>
          <div className="titlebar-status">
            <span className="titlebar-status-item"><span className="titlebar-dot"/> Client connected</span>
            <span className="titlebar-status-item" style={{color:"var(--fg-3)"}}>Region · EUW</span>
            <span className="titlebar-status-item" style={{color:"var(--fg-3)"}}>Model v2.4</span>
          </div>
        </div>
        <div className="titlebar-controls">
          <button className="tw-btn"><window.Icon name="minus" size={12}/></button>
          <button className="tw-btn"><window.Icon name="square" size={10}/></button>
          <button className="tw-btn tw-btn-close"><window.Icon name="x" size={12}/></button>
        </div>
      </div>

      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-logo">Y</div>
          {NAV.map(n => (
            <div key={n.id}
                 className={`nav-item ${screen === n.id || (n.id === "profile" && screen === "matchDetail") ? "active" : ""}`}
                 onClick={() => setScreen(n.id)}>
              <window.Icon name={n.icon} size={18}/>
              <span className="nav-tooltip">{n.label}</span>
            </div>
          ))}
          <div className="sidebar-spacer"/>
          <div className="nav-item" title="Toggle overlay" onClick={() => setShowOverlay(!showOverlay)}>
            <window.Icon name={showOverlay ? "shield" : "crosshair"} size={18}/>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-screen-title">
              <span className="topbar-breadcrumb">{eyebrow}</span>
              <h1>{title}</h1>
            </div>
            <div className="topbar-search">
              <window.Icon name="search" size={14}/>
              <input placeholder="Search champions, matchups, players…"/>
              <kbd>⌘K</kbd>
            </div>
            <div className="topbar-right">
              <span className="live-pill" onClick={() => setScreen("macro")}>
                <span className="pulse"/> IN GAME · 18:24
              </span>
              <div className="user-chip">
                <div className="user-chip-avatar">WC</div>
                <div>
                  <div className="user-chip-name">{window.PLAYER.handle}</div>
                  <div className="user-chip-tag">#{window.PLAYER.tag}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="scroll-area">
            {renderScreen()}
          </div>

          <div className="statusbar">
            <span className="statusbar-item"><span className="titlebar-dot"/> Connected</span>
            <span className="statusbar-item">FPS · 60</span>
            <span className="statusbar-item">CPU · 2.1%</span>
            <span className="statusbar-item">MEM · 184 MB</span>
            <div className="statusbar-spacer"/>
            <span className="statusbar-item">Patch 14.9</span>
            <span className="statusbar-item">YuumiNet v2.4</span>
            <span className="statusbar-item" style={{color:"var(--accent)"}}>● Tauri 1.6 · Rust</span>
          </div>
        </main>
      </div>

      {/* Floating overlay preview when not on overlay screen */}
      {showOverlay && screen !== "overlay" && screen !== "settings" && (
        <div style={{
          position: "absolute",
          top: 38, right: 12,
          width: 220, padding: "6px 10px",
          background: "var(--bg-3)", border: "1px solid var(--accent-soft)",
          borderRadius: 6, zIndex: 40,
          fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.08em",
          color: "var(--accent)", display: "flex", alignItems: "center", gap: 8
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "var(--accent)"
          }}/>
          OVERLAY PINNED · {tweaks.overlayPosition.toUpperCase()}
        </div>
      )}

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Appearance"/>
        <window.TweakRadio
          label="Theme"
          value={tweaks.theme}
          options={["dark", "light"]}
          onChange={(v) => setTweak("theme", v)}
        />
        <window.TweakSection label="AI Coach"/>
        <window.TweakRadio
          label="Voice"
          value={tweaks.aiVoice}
          options={["coach", "data", "hybrid"]}
          onChange={(v) => setTweak("aiVoice", v)}
        />
        <window.TweakSection label="Overlay"/>
        <window.TweakSelect
          label="Position"
          value={tweaks.overlayPosition}
          options={["top-left", "top-right", "bottom-left", "bottom-right"]}
          onChange={(v) => setTweak("overlayPosition", v)}
        />
        <window.TweakButton label="Open overlay preview" onClick={() => setScreen("overlay")}/>
      </window.TweaksPanel>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
