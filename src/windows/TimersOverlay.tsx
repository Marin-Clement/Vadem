import { useGameState } from "../hooks/useGameState";
import { useSettings } from "../hooks/useSettings";
import { OverlayPanel } from "../components/OverlayPanel";

// 2026 season respawn timers (seconds)
const BARON_RESPAWN   = 360; // 6 min
const DRAGON_RESPAWN  = 300; // 5 min
const ELDER_RESPAWN   = 360; // 6 min
const HERALD_RESPAWN  = 0;   // doesn't respawn — show "gone" once killed
const BARON_SPAWN_AT  = 1200; // 20:00
const DRAGON_SPAWN_AT = 300;  //  5:00
const HERALD_SPAWN_AT = 900;  // 15:00

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function drakeLabel(type: string) {
  const map: Record<string, string> = {
    Infernal: "Infernal",
    Mountain: "Mountain",
    Cloud:    "Cloud",
    Ocean:    "Ocean",
    Hextech:  "Hextech",
    Chemtech: "Chemtech",
  };
  return map[type] ?? "Drake";
}

interface TimerRowProps {
  icon:      string;
  iconBg:    string;
  label:     string;
  sub?:      string;
  status:    "up" | "spawning" | "dead" | "waiting";
  remaining: number; // seconds, 0 when up/gone
}

function TimerRow({ icon, iconBg, label, sub, status, remaining }: TimerRowProps) {
  const isUp   = status === "up";
  const isWait = status === "waiting";
  const isGone = status === "dead";

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded flex items-center justify-center text-[9px] font-mono font-bold text-white shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xs font-semibold text-text-primary leading-none">{label}</div>
        {sub && <div className="text-[9px] text-text-muted mt-0.5">{sub}</div>}
      </div>
      <span className={[
        "text-xs font-mono font-bold shrink-0",
        isUp   ? "text-win animate-pulse-slow" :
        isGone ? "text-text-muted" :
        isWait ? "text-text-secondary" :
                 "text-text-primary",
      ].join(" ")}>
        {isUp ? "SPAWN" : isGone ? "GONE" : isWait ? fmt(remaining) : fmt(remaining)}
      </span>
    </div>
  );
}

export default function TimersOverlay() {
  const game = useGameState();
  const { settings } = useSettings();

  if (!game.isGameActive) return null;

  const t = game.gameTime;

  // ── Baron ──────────────────────────────────────────────────────────────────
  const baronStatus = (): TimerRowProps => {
    if (t < BARON_SPAWN_AT) {
      return { icon: "BN", iconBg: "oklch(0.45 0.14 75)", label: "Baron Nashor",
        status: "waiting", remaining: BARON_SPAWN_AT - t };
    }
    if (game.lastBaronKillTime === null) {
      return { icon: "BN", iconBg: "oklch(0.45 0.14 75)", label: "Baron Nashor",
        status: "up", remaining: 0 };
    }
    const respawnAt = game.lastBaronKillTime + BARON_RESPAWN;
    const rem = respawnAt - t;
    return {
      icon: "BN", iconBg: "oklch(0.45 0.14 75)", label: "Baron Nashor",
      status: rem <= 0 ? "up" : "spawning", remaining: Math.max(0, rem),
    };
  };

  // ── Drake ──────────────────────────────────────────────────────────────────
  const drakeStatus = (): TimerRowProps => {
    const label = drakeLabel(game.nextDrakeType);
    const soulClaimed = game.blueHasSoul || game.redHasSoul;

    if (soulClaimed && game.lastElderKillTime === null) {
      // Soul secured, elder not yet alive — elder is "up"
      return { icon: "EL", iconBg: "oklch(0.50 0.20 295)", label: "Elder Dragon",
        sub: "Soul secured", status: "up", remaining: 0 };
    }
    if (soulClaimed && game.lastElderKillTime !== null) {
      const respawnAt = game.lastElderKillTime + ELDER_RESPAWN;
      const rem = respawnAt - t;
      return { icon: "EL", iconBg: "oklch(0.50 0.20 295)", label: "Elder Dragon",
        sub: "Soul secured", status: rem <= 0 ? "up" : "spawning", remaining: Math.max(0, rem) };
    }
    if (t < DRAGON_SPAWN_AT) {
      return { icon: "DR", iconBg: "oklch(0.45 0.18 25)", label: label,
        status: "waiting", remaining: DRAGON_SPAWN_AT - t };
    }
    if (game.lastDragonKillTime === null) {
      return { icon: "DR", iconBg: "oklch(0.45 0.18 25)", label: label,
        status: "up", remaining: 0 };
    }
    const respawnAt = game.lastDragonKillTime + DRAGON_RESPAWN;
    const rem = respawnAt - t;
    return {
      icon: "DR", iconBg: "oklch(0.45 0.18 25)", label: label,
      status: rem <= 0 ? "up" : "spawning", remaining: Math.max(0, rem),
    };
  };

  // ── Rift Herald ────────────────────────────────────────────────────────────
  const heraldStatus = (): TimerRowProps => {
    if (t >= BARON_SPAWN_AT) {
      return { icon: "RH", iconBg: "oklch(0.40 0.15 270)", label: "Rift Herald",
        sub: "Replaced by Baron", status: "dead", remaining: 0 };
    }
    if (t < HERALD_SPAWN_AT) {
      return { icon: "RH", iconBg: "oklch(0.40 0.15 270)", label: "Rift Herald",
        status: "waiting", remaining: HERALD_SPAWN_AT - t };
    }
    if (game.lastHeraldKillTime === null) {
      return { icon: "RH", iconBg: "oklch(0.40 0.15 270)", label: "Rift Herald",
        status: "up", remaining: 0 };
    }
    // Herald was killed — it doesn't respawn, just gone
    return { icon: "RH", iconBg: "oklch(0.40 0.15 270)", label: "Rift Herald",
      status: "dead", remaining: 0 };
  };

  const baron  = baronStatus();
  const drake  = drakeStatus();
  const herald = heraldStatus();

  return (
    <div
      className="fixed"
      style={{ left: `${settings.timersOverlayLeft}%`, top: `${settings.timersOverlayTop}%` }}
    >
      <OverlayPanel className="w-52">
        <div className="text-2xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
          Objective Timers
        </div>
        <div className="space-y-2">
          <TimerRow {...baron} />
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
          <TimerRow {...drake} />
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
          <TimerRow {...herald} />
        </div>
      </OverlayPanel>
    </div>
  );
}
