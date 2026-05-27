import { useState, useEffect } from "react";
import { Champ } from "../components/Champ";
import { Donut } from "../components/Primitives";
import { LIVE_OBJECTIVES, champById } from "../data/mockData";

export function MacroScreen() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const prob = 62 + Math.sin(tick / 4) * 3;
  const probInt = Math.round(prob);

  return (
    <div className="content fade-up">
      <div className="grid-2" style={{ marginBottom: 14 }}>
        {/* Live game win probability */}
        <div className="panel tactical">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" /> Live game · 18:24</div>
            <span className="tag accent">CONNECTED</span>
          </div>
          <div className="panel-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div className="t-eyebrow">CURRENT WIN PROBABILITY</div>
                <div className="t-display" style={{ fontSize: 48, fontWeight: 700, color: "var(--accent)", lineHeight: 1, marginTop: 4 }}>
                  {probInt}<span style={{ fontSize: 22, color: "var(--fg-3)" }}>%</span>
                </div>
                <div className="t-mono green" style={{ fontSize: 11, marginTop: 4 }}>↑ +4% last 60s</div>
              </div>
              <Donut value={62} size={100} stroke={10} label="MOMENTUM" />
            </div>
            <div className="overlay-winrate-bar" style={{ height: 28 }}>
              <div className="overlay-winrate-blue" style={{ width: `${probInt}%` }}>{probInt}%</div>
              <div className="overlay-winrate-red">{100 - probInt}%</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--fg-3)" }}>
              <span>YOUR TEAM · 24K GOLD</span>
              <span>14K GOLD · ENEMY</span>
            </div>
          </div>
        </div>

        {/* Next play */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" style={{ background: "var(--amber)" }} /> Next play · AI suggests</div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 12, padding: 14, background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: "var(--accent)", display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 700, color: "#0a0613", flexShrink: 0 }}>
                1
              </div>
              <div>
                <div className="t-display" style={{ fontSize: 16, fontWeight: 600 }}>Set up Rift Herald</div>
                <div style={{ fontSize: 12, color: "var(--fg-1)", marginTop: 4, lineHeight: 1.5 }}>
                  Vex (lvl 8) is closer to Herald with smite up. Push mid wave first, then converge top-side at <strong className="accent">19:30</strong>. <strong className="green">+8% win rate</strong> if secured.
                </div>
              </div>
            </div>
            {[
              "Place deep ward at enemy red buff before contesting",
              "Trade 2nd Drake for Herald — your team has +500 gold lead",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: 10, background: "var(--bg-3)", borderRadius: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, background: "var(--bg-4)", display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontWeight: 700, fontSize: 12, color: "var(--fg-2)" }}>
                  {i + 2}
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-1)", lineHeight: 1.5 }}>{tip}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Objectives queue */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" style={{ background: "var(--amber)" }} /> Objective queue</div>
          <span className="t-mono fg-3" style={{ fontSize: 10 }}>SORTED BY PRIORITY</span>
        </div>
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LIVE_OBJECTIVES.map(o => {
            const m = Math.floor(o.time / 60);
            const s = o.time % 60;
            const fmt = o.ready ? "READY" : `${m}:${s.toString().padStart(2, "0")}`;
            return (
              <div key={o.id} className={`objective-card ${o.urgent ? "urgent" : ""}`}>
                <div className="objective-icon-big" style={{ background: o.iconBg }}>{o.glyph}</div>
                <div className="objective-info">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="objective-name">{o.name}</span>
                    <span className={`tag ${o.prio === "TAKE NOW" ? "amber" : o.prio === "HIGH" ? "accent" : ""}`}>{o.prio}</span>
                  </div>
                  <div className="objective-desc">{o.desc}</div>
                  <div className="objective-meta">
                    <span>WIN IMPACT · <strong className="green">+{o.id === "baron" ? 18 : o.id === "herald" ? 9 : 6}%</strong></span>
                    <span>YOUR PROXIMITY · <strong className="cyan">{o.id === "drake" ? "2.4s" : o.id === "herald" ? "11.2s" : "—"}</strong></span>
                  </div>
                </div>
                <div className="objective-timer">
                  <div className={`objective-timer-value ${o.urgent ? "urgent" : ""}`}>{fmt}</div>
                  <div className="objective-timer-label">{o.ready ? "TAKE IT" : "RESPAWN"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lane states + cooldown intel */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" /> Lane states</div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { lane: "TOP", you: "Darius",     them: "Malphite",       state: "Even, frozen at river", color: "var(--fg-2)" },
              { lane: "MID", you: "Syndra",     them: "Ahri",           state: "Pushed by you · push prio", color: "var(--green)" },
              { lane: "BOT", you: "Jinx+Lulu",  them: "Caitlyn+Thresh", state: "Crashed under enemy turret", color: "var(--red)" },
            ].map(l => (
              <div key={l.lane} style={{ display: "grid", gridTemplateColumns: "50px 1fr 1fr", gap: 12, alignItems: "center", padding: 10, background: "var(--bg-3)", borderRadius: 6 }}>
                <span className="t-mono" style={{ fontSize: 11, fontWeight: 700 }}>{l.lane}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--cyan)" }}>{l.you}</span>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--red)" }}>{l.them}</span>
                </div>
                <span style={{ fontSize: 11, color: l.color }}>{l.state}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" /> Cooldown intel · enemy</div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "ahri",     spell: "Charm (E)",               cd: "12s",   color: "var(--green)" },
              { id: "hecarim",  spell: "Onslaught of Shadows (R)", cd: "READY", color: "var(--red)" },
              { id: "thresh",   spell: "Death Sentence (Q)",       cd: "44s",   color: "var(--fg-2)" },
              { id: "caitlyn",  spell: "Ace in the Hole (R)",      cd: "8s",    color: "var(--amber)" },
            ].map(c => (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 10, alignItems: "center" }}>
                <Champ id={c.id} size="sm" withTooltip />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{champById(c.id)?.name}</div>
                  <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{c.spell}</div>
                </div>
                <span className="t-mono" style={{ fontSize: 13, fontWeight: 700, color: c.color }}>{c.cd}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
