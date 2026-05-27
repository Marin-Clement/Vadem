import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Icon } from "./Icon";
import { useGameState } from "../hooks/useGameState";
import { useAuthStore } from "../store/authStore";
import { useDDragon } from "../utils/ddragon";

type Screen = "dashboard" | "profile" | "matchDetail" | "draft" | "builds" | "macro" | "overlay" | "settings";

const NAV = [
  { id: "dashboard" as Screen, icon: "home",     label: "Dashboard" },
  { id: "profile"   as Screen, icon: "user",     label: "Profile & history" },
  { id: "draft"     as Screen, icon: "draft",    label: "Draft assistant" },
  { id: "builds"    as Screen, icon: "build",    label: "Build recommender" },
  { id: "macro"     as Screen, icon: "macro",    label: "Macro & objectives" },
  { id: "overlay"   as Screen, icon: "overlay",  label: "Overlay preview" },
  { id: "settings"  as Screen, icon: "settings", label: "Settings" },
];

const SCREEN_LABEL: Record<string, [string, string]> = {
  dashboard:  ["BRIEFING", "Dashboard"],
  profile:    ["PROFILE", "Match history & stats"],
  draft:      ["DRAFT", "Champion select assistant"],
  matchDetail:["MATCH", "Detailed analysis"],
  builds:     ["BUILDS", "Items & runes"],
  macro:      ["MACRO", "Objectives & live game"],
  overlay:    ["OVERLAY", "In-game widget preview"],
  settings:   ["CONFIG", "Settings"],
};

interface SearchResult {
  type: "champion" | "screen";
  id: string;
  label: string;
  sub?: string;
}

interface AppShellProps {
  children: React.ReactNode;
  screen: Screen;
  onNavigate: (s: Screen, extra?: { championId?: string }) => void;
}

export function AppShell({ children, screen, onNavigate }: AppShellProps) {
  const game = useGameState();
  const profile = useAuthStore(s => s.profile);
  const ddr = useDDragon();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const handle = profile?.game_name ?? '—';
  const tag    = profile?.tag_line ?? '—';
  const initials = handle.slice(0, 2).toUpperCase();
  const [eyebrow, title] = SCREEN_LABEL[screen] || ["", ""];

  const profileIconUrl = profile?.profile_icon_id && ddr
    ? `https://ddragon.leagueoflegends.com/cdn/${ddr.version}/img/profileicon/${profile.profile_icon_id}.png`
    : null;

  useEffect(() => {
    if (!searchQuery.trim() || !ddr) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const champResults: SearchResult[] = Object.keys(ddr.champByName)
      .filter(k => k.length > 3 && ddr.champByName[k] === ddr.champByName[k])
      .reduce<string[]>((acc, k) => {
        const id = ddr.champByName[k];
        if (!acc.includes(id) && id.toLowerCase().includes(q)) acc.push(id);
        return acc;
      }, [])
      .slice(0, 5)
      .map(id => ({ type: "champion" as const, id, label: id, sub: "Champion" }));

    const screenResults: SearchResult[] = NAV
      .filter(n => n.label.toLowerCase().includes(q))
      .map(n => ({ type: "screen" as const, id: n.id, label: n.label, sub: "Screen" }));

    setSearchResults([...champResults, ...screenResults].slice(0, 6));
  }, [searchQuery, ddr]);

  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === "champion") {
      onNavigate("builds", { championId: result.id });
    } else {
      onNavigate(result.id as Screen);
    }
    setSearchQuery("");
    setSearchFocused(false);
  };

  const gameTimeStr = () => {
    if (!game.isGameActive) return "—";
    const mins = Math.floor(game.gameTime / 60);
    const secs = Math.floor(game.gameTime % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose    = () => getCurrentWindow().close();

  return (
    <div className="tauri-window">
      {/* Titlebar */}
      <div className="titlebar">
        <div className="titlebar-left">
          <div className="titlebar-brand">
            <div className="titlebar-brand-mark" />
            VADEM
          </div>
          <div className="titlebar-status">
            <span className="titlebar-status-item">
              <span className="titlebar-dot" />
              Client connected
            </span>
            <span className="titlebar-status-item" style={{ color: "var(--fg-3)" }}>
              Region · {profile?.region ?? 'EUW'}
            </span>
            <span className="titlebar-status-item" style={{ color: "var(--fg-3)" }}>
              Model v2.4
            </span>
          </div>
        </div>
        <div className="titlebar-controls">
          <button className="tw-btn" onClick={handleMinimize}>
            <Icon name="minus" size={12} />
          </button>
          <button className="tw-btn" onClick={handleMaximize}>
            <Icon name="square" size={10} />
          </button>
          <button className="tw-btn tw-btn-close" onClick={handleClose}>
            <Icon name="x" size={12} />
          </button>
        </div>
      </div>

      {/* App shell body */}
      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">Y</div>
          {NAV.map(n => (
            <div
              key={n.id}
              className={`nav-item ${screen === n.id || (n.id === "profile" && screen === "matchDetail") ? "active" : ""}`}
              onClick={() => onNavigate(n.id)}
            >
              <Icon name={n.icon} size={18} />
              <span className="nav-tooltip">{n.label}</span>
            </div>
          ))}
          <div className="sidebar-spacer" />
          <div
            className="nav-item"
            title="Toggle overlay"
            onClick={() => onNavigate("overlay")}
          >
            <Icon name="shield" size={18} />
            <span className="nav-tooltip">Overlay preview</span>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          {/* Topbar */}
          <div className="topbar">
            <div className="topbar-screen-title">
              <span className="topbar-breadcrumb">{eyebrow}</span>
              <h1>{title}</h1>
            </div>
            <div className="topbar-search" ref={searchRef} style={{ position: "relative" }}>
              <Icon name="search" size={14} />
              <input
                value={searchQuery}
                placeholder="Search champions, screens…"
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onKeyDown={e => {
                  if (e.key === "Escape") { setSearchQuery(""); setSearchFocused(false); }
                  if (e.key === "Enter" && searchResults.length > 0) handleSearchSelect(searchResults[0]);
                }}
              />
              {!searchFocused && !searchQuery && <kbd>⌘K</kbd>}
              {searchFocused && searchResults.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                  background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 8,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden",
                }}>
                  {searchResults.map(r => (
                    <div
                      key={r.id}
                      style={{
                        padding: "8px 12px", cursor: "pointer", display: "flex", gap: 8,
                        alignItems: "center", borderBottom: "1px solid var(--line-1)",
                      }}
                      onMouseDown={() => handleSearchSelect(r)}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-3)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}
                    >
                      <span style={{ fontFamily: "var(--ff-mono)", fontSize: 9, color: "var(--fg-3)", width: 60 }}>
                        {r.sub}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{r.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="topbar-right">
              {game.isGameActive ? (
                <span className="live-pill" onClick={() => onNavigate("macro")} style={{ cursor: "pointer" }}>
                  <span className="pulse" />
                  IN GAME · {gameTimeStr()}
                </span>
              ) : (
                <span className="idle-pill">
                  <span className="dot" />
                  WAITING FOR GAME
                </span>
              )}
              <div
                className="user-chip"
                onClick={() => onNavigate("profile")}
                style={{ cursor: "pointer" }}
                title="Go to profile"
              >
                <div className="user-chip-avatar" style={{ overflow: "hidden", padding: 0 }}>
                  {profileIconUrl ? (
                    <img
                      src={profileIconUrl}
                      alt={handle}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.removeProperty("display");
                      }}
                    />
                  ) : null}
                  <span style={{ display: profileIconUrl ? "none" : undefined }}>{initials}</span>
                </div>
                <div>
                  <div className="user-chip-name">{handle}</div>
                  <div className="user-chip-tag">#{tag}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="scroll-area">
            {children}
          </div>

          {/* Statusbar */}
          <div className="statusbar">
            <span className="statusbar-item">
              <span className="titlebar-dot" /> Connected
            </span>
            <span className="statusbar-item">FPS · 60</span>
            <span className="statusbar-item">CPU · 2.1%</span>
            <span className="statusbar-item">MEM · 184 MB</span>
            <div className="statusbar-spacer" />
            <span className="statusbar-item">Patch 14.9</span>
            <span className="statusbar-item">YuumiNet v2.4</span>
            <span className="statusbar-item" style={{ color: "var(--accent)" }}>
              ● Tauri · Rust
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
