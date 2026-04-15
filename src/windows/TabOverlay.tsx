import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useGameState } from "../hooks/useGameState";
import { useSettings } from "../hooks/useSettings";
import { OverlayPanel } from "../components/OverlayPanel";
import { WinMeter } from "../components/WinMeter";
import { Badge } from "../components/Badge";
import { computeWinProb } from "../utils/winProb";

export default function TabOverlay() {
  const game = useGameState();
  const { settings, saveSettings } = useSettings();
  const [winProb, setWinProb] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Panel position in % (controlled locally while dragging, persisted on drop)
  const [pos, setPos] = useState({ left: settings.tabOverlayLeft, top: settings.tabOverlayTop });
  const dragState = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);

  // Sync position when settings load
  useEffect(() => {
    setPos({ left: settings.tabOverlayLeft, top: settings.tabOverlayTop });
  }, [settings.tabOverlayLeft, settings.tabOverlayTop]);

  // Listen for edit-mode events from the dashboard
  useEffect(() => {
    const unlisten = listen<boolean>("overlay_edit_mode", (e) => {
      setIsEditing(e.payload);
    });
    return () => { unlisten.then((f) => f()); };
  }, []);

  // Win probability — recompute when game state changes
  useEffect(() => {
    if (!settings.showWinPrediction) { setWinProb(null); return; }
    computeWinProb(game).then(setWinProb);
  }, [game, settings.showWinPrediction]);

  // ── Drag logic ─────────────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startLeft: pos.left,
      startTop:  pos.top,
    };
  }, [isEditing, pos]);

  useEffect(() => {
    if (!isEditing) return;
    const onMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      const dx = ((e.clientX - dragState.current.startX) / window.innerWidth)  * 100;
      const dy = ((e.clientY - dragState.current.startY) / window.innerHeight) * 100;
      setPos({
        left: Math.max(0, Math.min(90, dragState.current.startLeft + dx)),
        top:  Math.max(0, Math.min(85, dragState.current.startTop  + dy)),
      });
    };
    const onUp = () => {
      if (!dragState.current) return;
      dragState.current = null;
      // Persist position and re-enable click-through
      saveSettings({ tabOverlayLeft: pos.left, tabOverlayTop: pos.top });
      invoke("set_overlay_clickthrough", { windowLabel: "tab-overlay", enabled: true });
      setIsEditing(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isEditing, pos, saveSettings]);

  // ── Derived display values ─────────────────────────────────────────────────
  const mins = Math.floor(game.gameTime / 60);
  const secs = Math.floor(game.gameTime % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  const allies  = game.players.filter((p) => p.team === game.myTeam);
  const enemies = game.players.filter((p) => p.team !== game.myTeam);

  const isOrder   = game.myTeam === "ORDER";
  const blueTeam  = isOrder ? allies : enemies;
  const redTeam   = isOrder ? enemies : allies;
  const blueKills = isOrder ? game.allyKills : game.enemyKills;
  const redKills  = isOrder ? game.enemyKills : game.allyKills;

  // All diffs are ORDER (blue) perspective
  const dragonLead = Math.round(game.dragonDiff);
  const towerLead  = Math.round(game.towerDiff);

  if (!game.isGameActive && !isEditing) return null;

  return (
    /* Full-screen transparent container; pointer-events only on the panel itself */
    <div className="fixed inset-0" style={{ pointerEvents: "none" }}>
      <div
        className="absolute"
        style={{
          left:          `${pos.left}%`,
          top:           `${pos.top}%`,
          pointerEvents: isEditing ? "auto" : "none",
        }}
      >
        <OverlayPanel className="w-72">
          {/* Drag handle — only visible in edit mode */}
          {isEditing && (
            <div
              onMouseDown={onDragStart}
              className="flex items-center justify-center gap-1 -mt-1 mb-2 cursor-grab active:cursor-grabbing
                         text-text-muted hover:text-accent transition-colors select-none"
              title="Drag to reposition"
            >
              <span className="text-xs">⠿ drag to move</span>
            </div>
          )}

          {/* Header: time + score */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-text-secondary">{timeStr}</span>
            <div className="flex items-center gap-1.5">
              <Badge variant={isOrder ? "win" : "accent"}>ORDER {blueKills}</Badge>
              <span className="text-text-muted text-2xs">vs</span>
              <Badge variant={isOrder ? "loss" : "win"}>CHAOS {redKills}</Badge>
            </div>
          </div>

          {/* Win probability */}
          {winProb !== null && settings.showWinPrediction && (
            <div className="mb-3">
              <WinMeter prob={winProb} />
            </div>
          )}

          {/* Objective pills */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {dragonLead !== 0 && (
              <span className={`text-2xs px-1.5 py-0.5 rounded font-mono ${dragonLead > 0 ? "bg-win/20 text-win" : "bg-loss/20 text-loss"}`}>
                🐉 {dragonLead > 0 ? "+" : ""}{dragonLead}
              </span>
            )}
            {towerLead !== 0 && (
              <span className={`text-2xs px-1.5 py-0.5 rounded font-mono ${towerLead > 0 ? "bg-win/20 text-win" : "bg-loss/20 text-loss"}`}>
                🏰 {towerLead > 0 ? "+" : ""}{towerLead.toFixed(0)}
              </span>
            )}
            {game.blueBaronActive && (
              <span className="text-2xs px-1.5 py-0.5 rounded bg-accent/20 text-accent font-mono">
                {isOrder ? "☠ Baron" : "⚠ Enemy Baron"}
              </span>
            )}
            {game.redBaronActive && (
              <span className="text-2xs px-1.5 py-0.5 rounded bg-loss/20 text-loss font-mono">
                {isOrder ? "⚠ Enemy Baron" : "☠ Baron"}
              </span>
            )}
            {(game.blueElderActive || game.redElderActive) && (
              <span className={`text-2xs px-1.5 py-0.5 rounded font-mono ${
                (isOrder ? game.blueElderActive : game.redElderActive)
                  ? "bg-win/20 text-win" : "bg-loss/20 text-loss"}`}>
                🔥 Elder
              </span>
            )}
            {(game.blueHasSoul || game.redHasSoul) && (
              <span className={`text-2xs px-1.5 py-0.5 rounded font-mono ${
                (isOrder ? game.blueHasSoul : game.redHasSoul)
                  ? "bg-win/20 text-win" : "bg-loss/20 text-loss"}`}>
                ✨ Soul
              </span>
            )}
          </div>

          {/* Scoreboard */}
          <PlayerList players={blueTeam} label="ORDER" isAlly={isOrder} />
          <div className="border-t border-surface-border my-2" />
          <PlayerList players={redTeam} label="CHAOS" isAlly={!isOrder} />
        </OverlayPanel>
      </div>
    </div>
  );
}

// ── PlayerList sub-component ────────────────────────────────────────────────

interface Player {
  summonerName: string;
  championName: string;
  level: number;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  isDead: boolean;
  respawnTimer: number;
}

function PlayerList({ players, label, isAlly }: { players: Player[]; label: string; isAlly: boolean }) {
  return (
    <div>
      <div className="text-2xs font-medium uppercase tracking-widest mb-1 px-0.5"
           style={{ color: isAlly ? "var(--color-win)" : "var(--color-loss)" }}>
        {label}
      </div>
      {players.map((p) => (
        <div key={p.summonerName}
             className="flex items-center gap-2 py-0.5 text-2xs border-b border-surface-border/50 last:border-0">
          {/* Dead indicator */}
          <span className="w-3 text-center">
            {p.isDead
              ? <span className="text-loss">💀</span>
              : <span className="text-text-muted opacity-0">·</span>}
          </span>
          {/* Champion + level */}
          <span className="w-24 truncate font-medium text-text-primary">{p.championName}</span>
          <span className="w-4 text-center font-mono text-text-muted">{p.level}</span>
          {/* KDA */}
          <span className="font-mono text-text-secondary flex-1 text-right">
            {p.kills}/{p.deaths}/{p.assists}
          </span>
          {/* CS */}
          <span className="w-8 font-mono text-text-muted text-right">{p.cs}</span>
          {/* Respawn timer */}
          {p.isDead && (
            <span className="w-8 font-mono text-loss text-right">{Math.ceil(p.respawnTimer)}s</span>
          )}
        </div>
      ))}
    </div>
  );
}
