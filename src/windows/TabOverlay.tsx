import { useState, useEffect } from "react";
import { useGameState } from "../hooks/useGameState";
import { useSettings } from "../hooks/useSettings";
import { computeWinProb } from "../utils/winProb";

export default function TabOverlay() {
  const game = useGameState();
  const { settings } = useSettings();
  const [winProb, setWinProb] = useState<number | null>(null);

  useEffect(() => {
    document.body.style.background = 'transparent';
    return () => {
      document.body.style.background = '';
    };
  }, []);

  useEffect(() => {
    if (!settings.showWinPrediction) { setWinProb(null); return; }
    computeWinProb(game).then(setWinProb);
  }, [game, settings.showWinPrediction]);

  const mins = Math.floor(game.gameTime / 60);
  const secs = Math.floor(game.gameTime % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  const isOrder  = game.myTeam === "ORDER";
  const allies   = game.players.filter(p => p.team === game.myTeam);
  const enemies  = game.players.filter(p => p.team !== game.myTeam);
  const blueTeam = isOrder ? allies : enemies;
  const redTeam  = isOrder ? enemies : allies;
  const blueKills = isOrder ? game.allyKills : game.enemyKills;
  const redKills  = isOrder ? game.enemyKills : game.allyKills;

  const myWinProb = winProb !== null ? Math.round(winProb * 100) : null;

  const dragonLead = Math.round(game.dragonDiff);
  const towerLead  = Math.round(game.towerDiff);

  const myBaronActive    = isOrder ? game.blueBaronActive : game.redBaronActive;
  const enemyBaronActive = isOrder ? game.redBaronActive  : game.blueBaronActive;
  const myElderActive    = isOrder ? game.blueElderActive : game.redElderActive;
  const enemyElderActive = isOrder ? game.redElderActive  : game.blueElderActive;
  const myHasSoul        = isOrder ? game.blueHasSoul : game.redHasSoul;
  const enemyHasSoul     = isOrder ? game.redHasSoul  : game.blueHasSoul;

  const hasStatusPills = dragonLead !== 0 || towerLead !== 0
    || myBaronActive || enemyBaronActive
    || myElderActive || enemyElderActive
    || myHasSoul || enemyHasSoul;

  if (!game.isGameActive) return null;
                
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
      <div style={{
        position: "absolute",
        left: `${settings.tabOverlayLeft}%`,
        top:  `${settings.tabOverlayTop}%`,
        width: 290,
        pointerEvents: "none",
      }}>
        {/* Widget shell — same visual style as OverlayPreviewScreen widget */}
        <div style={{
          background: "transparent",
          backdropFilter: "blur(20px)",
          border: "1px solid oklch(0.68 0.20 295 / 0.4)",
          borderRadius: 10,
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          overflow: "hidden",
          color: "white",
          fontFamily: "var(--ff-sans)",
        }}>

          {/* ── Header ────────────────────────────────────────────── */}
          <div className="overlay-header">
            <div className="overlay-title">
              <span style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: "var(--green)", boxShadow: "0 0 6px var(--green)",
              }} />
              YuumiPal · Live
            </div>
            <span className="overlay-time">{timeStr}</span>
          </div>

          {/* ── Body ──────────────────────────────────────────────── */}
          <div className="overlay-body">

            {/* Kill score */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: "var(--ff-mono)", fontSize: 12,
            }}>
              <span style={{ color: "var(--cyan)", fontWeight: 700 }}>ORDER {blueKills}</span>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>vs</span>
              <span style={{ color: "var(--red)", fontWeight: 700 }}>CHAOS {redKills}</span>
            </div>

            {/* Win probability bar */}
            {myWinProb !== null && settings.showWinPrediction && (
              <div>
                <div style={{
                  display: "flex", justifyContent: "space-between", marginBottom: 4,
                  fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.10em",
                  color: "rgba(255,255,255,0.55)",
                }}>
                  <span>WIN PROBABILITY</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700 }}>ONNX LIVE</span>
                </div>
                <div className="overlay-winrate-bar">
                  <div className="overlay-winrate-blue" style={{ width: `${myWinProb}%` }}>{myWinProb}%</div>
                  <div className="overlay-winrate-red">{100 - myWinProb}%</div>
                </div>
              </div>
            )}

            {/* Status pills */}
            {hasStatusPills && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {dragonLead !== 0 && (
                  <Pill color={dragonLead > 0 ? "var(--green)" : "var(--red)"}
                        bg={dragonLead > 0 ? "oklch(0.78 0.16 150 / 0.18)" : "oklch(0.68 0.22 25 / 0.18)"}>
                    🐉 {dragonLead > 0 ? "+" : ""}{dragonLead}
                  </Pill>
                )}
                {towerLead !== 0 && (
                  <Pill color={towerLead > 0 ? "var(--green)" : "var(--red)"}
                        bg={towerLead > 0 ? "oklch(0.78 0.16 150 / 0.18)" : "oklch(0.68 0.22 25 / 0.18)"}>
                    🏰 {towerLead > 0 ? "+" : ""}{towerLead}
                  </Pill>
                )}
                {myBaronActive && (
                  <Pill color="var(--amber)" bg="oklch(0.80 0.15 75 / 0.18)">☠ Baron</Pill>
                )}
                {enemyBaronActive && (
                  <Pill color="var(--red)" bg="oklch(0.68 0.22 25 / 0.18)">⚠ Enemy Baron</Pill>
                )}
                {myElderActive && (
                  <Pill color="var(--amber)" bg="oklch(0.80 0.15 75 / 0.18)">🔥 Elder</Pill>
                )}
                {enemyElderActive && (
                  <Pill color="var(--red)" bg="oklch(0.68 0.22 25 / 0.18)">🔥 Enemy Elder</Pill>
                )}
                {myHasSoul && (
                  <Pill color="var(--green)" bg="oklch(0.78 0.16 150 / 0.18)">✨ Soul</Pill>
                )}
                {enemyHasSoul && (
                  <Pill color="var(--red)" bg="oklch(0.68 0.22 25 / 0.18)">✨ Enemy Soul</Pill>
                )}
              </div>
            )}

            {/* Scoreboard */}
            <PlayerList players={blueTeam} label="ORDER" isAlly={isOrder} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 -10px" }} />
            <PlayerList players={redTeam} label="CHAOS" isAlly={!isOrder} />

          </div>

          {/* ── Footer ────────────────────────────────────────────── */}
          <div className="overlay-footer">
            <button className="overlay-footer-btn" style={{ pointerEvents: "auto" }}>BUILD</button>
            <button className="overlay-footer-btn" style={{ pointerEvents: "auto" }}>MAP</button>
            <button
              className="overlay-footer-btn"
              style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)", pointerEvents: "auto" }}
            >
              OPEN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Pill({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{
      padding: "2px 6px", borderRadius: 3, fontFamily: "var(--ff-mono)",
      fontSize: 10, fontWeight: 600, color, background: bg,
    }}>
      {children}
    </span>
  );
}

interface PlayerEntry {
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

function PlayerList({ players, label, isAlly }: { players: PlayerEntry[]; label: string; isAlly: boolean }) {
  return (
    <div>
      <div style={{
        fontFamily: "var(--ff-mono)", fontSize: 9, fontWeight: 600,
        letterSpacing: "0.12em", textTransform: "uppercase" as const,
        color: isAlly ? "var(--cyan)" : "var(--red)",
        marginBottom: 4,
      }}>
        {label}
      </div>
      {players.map(p => (
        <div key={p.summonerName} style={{
          display: "grid", gridTemplateColumns: "12px 1fr auto auto",
          gap: 6, alignItems: "center", padding: "3px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {/* Dead indicator */}
          <span style={{ fontSize: 10, textAlign: "center" }}>
            {p.isDead ? "💀" : ""}
          </span>
          {/* Champion + level */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <span style={{
              fontFamily: "var(--ff-sans)", fontSize: 11, fontWeight: 500,
              color: p.isDead ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.9)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {p.championName}
            </span>
            <span style={{
              fontFamily: "var(--ff-mono)", fontSize: 9,
              color: "rgba(255,255,255,0.35)",
            }}>
              {p.level}
            </span>
          </div>
          {/* KDA */}
          <span style={{
            fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
          }}>
            {p.kills}/{p.deaths}/{p.assists}
          </span>
          {/* CS or respawn timer */}
          <span style={{
            fontFamily: "var(--ff-mono)", fontSize: 10,
            color: p.isDead ? "var(--red)" : "rgba(255,255,255,0.35)",
            textAlign: "right" as const,
            minWidth: 28,
          }}>
            {p.isDead ? `${Math.ceil(p.respawnTimer)}s` : `${p.cs}`}
          </span>
        </div>
      ))}
    </div>
  );
}
