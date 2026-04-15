import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { useGameState } from "../hooks/useGameState";
import { useSettings } from "../hooks/useSettings";
import { Badge } from "../components/Badge";

export default function Dashboard() {
  const game = useGameState();
  const { settings, saveSettings } = useSettings();
  const [editingLayout, setEditingLayout] = useState(false);

  const gameTimeStr = () => {
    const mins = Math.floor(game.gameTime / 60);
    const secs = Math.floor(game.gameTime % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleEditLayout = async () => {
    const next = !editingLayout;
    setEditingLayout(next);
    // Disable click-through on tab-overlay so the panel becomes draggable
    await invoke("set_overlay_clickthrough", {
      windowLabel: "tab-overlay",
      enabled: !next,
    });
    // Tell the tab overlay window to show its drag handle
    await emit("overlay_edit_mode", next);
    // Show/hide the overlay so the user can see it while repositioning
    const w = await import("@tauri-apps/api/webviewWindow");
    const overlay = await w.WebviewWindow.getByLabel("tab-overlay");
    if (overlay) {
      if (next) await overlay.show();
      else await overlay.hide();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface text-text-primary p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold tracking-tight">YuumiPal</h1>
        <Badge variant={game.isGameActive ? "win" : "muted"}>
          {game.isGameActive ? "Live" : "Waiting"}
        </Badge>
      </div>

      {/* Game status */}
      {game.isGameActive ? (
        <div className="bg-surface-raised rounded-lg border border-surface-border p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-text-secondary">{gameTimeStr()}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-primary font-medium">{game.mySummoner}</span>
            <span className="text-text-muted">·</span>
            <Badge variant={game.myTeam === "ORDER" ? "accent" : "loss"}>
              {game.myTeam}
            </Badge>
          </div>
          <div className="flex gap-3 text-2xs text-text-secondary">
            <span>Kills <span className="font-mono text-win">{game.allyKills}</span>/<span className="font-mono text-loss">{game.enemyKills}</span></span>
            <span>·</span>
            <span>Dragons <span className="font-mono">{game.dragonDiff > 0 ? `+${Math.round(game.dragonDiff)}` : Math.round(game.dragonDiff)}</span></span>
            <span>·</span>
            <span>Towers <span className="font-mono">{game.towerDiff > 0 ? `+${Math.round(game.towerDiff)}` : Math.round(game.towerDiff)}</span></span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted">
          <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
          <span className="text-sm">Waiting for a game to start…</span>
          <span className="text-2xs">Hold TAB in-game for the overlay</span>
        </div>
      )}

      {/* Settings */}
      <div className="mt-auto space-y-3 border-t border-surface-border pt-3">
        {/* Win prediction toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-primary">Win prediction</div>
            <div className="text-2xs text-text-muted">Shows on TAB overlay</div>
          </div>
          <button
            onClick={() => saveSettings({ showWinPrediction: !settings.showWinPrediction })}
            className={[
              "w-10 h-5 rounded-pill border transition-colors duration-200 relative",
              settings.showWinPrediction
                ? "bg-accent border-accent"
                : "bg-surface-border border-surface-border",
            ].join(" ")}
            aria-label="Toggle win prediction"
          >
            <span
              className={[
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                settings.showWinPrediction ? "left-5" : "left-0.5",
              ].join(" ")}
            />
          </button>
        </div>

        {/* Edit overlay layout */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-text-primary">Edit overlay layout</div>
            <div className="text-2xs text-text-muted">
              {editingLayout ? "Drag the panel, then click Done" : "Reposition the TAB overlay panel"}
            </div>
          </div>
          <button
            onClick={toggleEditLayout}
            className={[
              "px-3 py-1 rounded text-xs font-medium border transition-colors duration-150",
              editingLayout
                ? "bg-accent text-white border-accent"
                : "bg-surface-raised text-text-secondary border-surface-border hover:border-accent/50",
            ].join(" ")}
          >
            {editingLayout ? "Done" : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
}
