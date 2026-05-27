import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Icon } from "./Icon";
import { PLAYER } from "../data/mockData";
import { useGameState } from "../hooks/useGameState";

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

interface AppShellProps {
  children: React.ReactNode;
  screen: Screen;
  onNavigate: (s: Screen) => void;
}

export function AppShell({ children, screen, onNavigate }: AppShellProps) {
  const game = useGameState();
  const [searchFocused, setSearchFocused] = useState(false);
  const [eyebrow, title] = SCREEN_LABEL[screen] || ["", ""];

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
              Region · EUW
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
            <div className="topbar-search">
              <Icon name="search" size={14} />
              <input
                placeholder="Search champions, matchups, players…"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {!searchFocused && <kbd>⌘K</kbd>}
            </div>
            <div className="topbar-right">
              {game.isGameActive ? (
                <span className="live-pill" onClick={() => onNavigate("macro")}>
                  <span className="pulse" />
                  IN GAME · {gameTimeStr()}
                </span>
              ) : (
                <span className="idle-pill">
                  <span className="dot" />
                  WAITING FOR GAME
                </span>
              )}
              <div className="user-chip">
                <div className="user-chip-avatar">WC</div>
                <div>
                  <div className="user-chip-name">{PLAYER.handle}</div>
                  <div className="user-chip-tag">#{PLAYER.tag}</div>
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
