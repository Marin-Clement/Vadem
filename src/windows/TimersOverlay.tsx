import { useState, useEffect } from "react";
import { useGameState } from "../hooks/useGameState";
import { useSettings } from "../hooks/useSettings";
import { OverlayPanel } from "../components/OverlayPanel";

interface ObjectiveTimer {
  name:      string;
  killedAt:  number; // game time in seconds when objective was killed
  respawnIn: number; // seconds until next spawn
}

// Objective respawn times (seconds)
const RESPAWN: Record<string, number> = {
  Baron:      420,
  Dragon:     300,
  RiftHerald: 360,
};

export default function TimersOverlay() {
  const game = useGameState();
  const { settings } = useSettings();
  const [timers, setTimers] = useState<ObjectiveTimer[]>([]);

  // Listen for objective kill events
  useEffect(() => {
    if (!game.isGameActive) {
      setTimers([]);
      return;
    }
    // In production this would watch game.events for kill events.
    // For now the component renders whatever timers exist.
  }, [game.isGameActive]);

  const addTimer = (name: string) => {
    setTimers((prev) => [
      ...prev.filter((t) => t.name !== name),
      { name, killedAt: game.gameTime, respawnIn: RESPAWN[name] ?? 300 },
    ]);
  };

  const getRemaining = (t: ObjectiveTimer) => {
    const elapsed = game.gameTime - t.killedAt;
    return Math.max(0, t.respawnIn - elapsed);
  };

  const fmt = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!game.isGameActive) return null;

  return (
    <div
      className="fixed"
      style={{ left: `${settings.timersOverlayLeft}%`, top: `${settings.timersOverlayTop}%` }}
    >
      <OverlayPanel className="w-52">
        <div className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
          Objective Timers
        </div>

        {/* Quick-add buttons */}
        <div className="flex gap-1 mb-3">
          {Object.keys(RESPAWN).map((name) => (
            <button
              key={name}
              onClick={() => addTimer(name)}
              className="flex-1 text-2xs px-1.5 py-1 rounded border border-surface-border
                         bg-surface-raised text-text-secondary hover:border-accent/40
                         hover:text-text-primary transition-colors"
            >
              {name === "RiftHerald" ? "Herald" : name}
            </button>
          ))}
        </div>

        {/* Active timers */}
        {timers.length === 0 ? (
          <p className="text-2xs text-text-muted italic text-center py-2">
            Click above to start a timer
          </p>
        ) : (
          <div className="space-y-1.5">
            {timers.map((t) => {
              const remaining = getRemaining(t);
              const done = remaining === 0;
              return (
                <div
                  key={t.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-2xs text-text-secondary">{t.name}</span>
                  <span
                    className={[
                      "text-xs font-mono font-semibold",
                      done ? "text-win animate-pulse-slow" : "text-text-primary",
                    ].join(" ")}
                  >
                    {done ? "SPAWN" : fmt(remaining)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </OverlayPanel>
    </div>
  );
}
