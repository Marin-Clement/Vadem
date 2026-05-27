import { Icon } from "../components/Icon";
import { Champ } from "../components/Champ";
import { StatTile, Sparkline, Donut, KDARatio } from "../components/Primitives";
import { MATCHES, PLAYER, SPARK_DATA, champById } from "../data/mockData";

type Screen = "dashboard" | "profile" | "matchDetail" | "draft" | "builds" | "macro" | "overlay" | "settings";

interface Props {
  onNavigate: (s: Screen) => void;
  onSelectMatch: (id: string) => void;
}

export function DashboardScreen({ onNavigate, onSelectMatch }: Props) {
  const recent = MATCHES.slice(0, 4);
  const wins = recent.filter(m => m.result === "win").length;

  return (
    <div className="content fade-up">
      {/* Hero row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* AI coach hero */}
        <div className="panel tactical" style={{ padding: 0 }}>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="t-eyebrow" style={{ marginBottom: 6 }}>Vadem // Briefing</div>
                <div className="t-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Welcome back, <span className="accent">{PLAYER.handle}</span>
                </div>
                <div style={{ color: "var(--fg-2)", fontSize: 13, marginTop: 4 }}>
                  You're on a <strong className="green">{PLAYER.streak}-game win streak</strong>. Conditions look favorable for a climb session.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => onNavigate("draft")}>
                  <Icon name="draft" size={14} /> Open draft tool
                </button>
                <button className="btn btn-primary">
                  <Icon name="play" size={12} /> Queue up
                </button>
              </div>
            </div>

            <div className="coach-bubble">
              <div className="coach-avatar">YP</div>
              <div>
                <div className="coach-meta">Coach insight · 2 min ago</div>
                <div className="coach-text">
                  Your last 3 wins on <strong>Syndra</strong> share a pattern: roams between 8–12 min created a +2.3k gold lead by 14:00. Tonight, prioritize early prio with the <strong>Q wave-clear</strong> push, then mid-river vision before second Dragon spawn.
                </div>
              </div>
            </div>

            <div className="grid-4">
              <StatTile label="Win rate · 14d" value="62" suffix="%" trend={8} trendLabel="%" />
              <StatTile label="Avg KDA" value="3.18" trend={0.42} />
              <StatTile label="CS / min" value="7.6" trend={0.3} />
              <StatTile label="Vision score" value="22" trend={-2} />
            </div>
          </div>
        </div>

        {/* Rank card */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" /> Ranked snapshot
            </div>
            <button className="panel-action">DETAILS →</button>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 12, background: "var(--accent)",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <div style={{ width: 64, height: 64, borderRadius: 8, background: "var(--bg-2)", display: "grid", placeItems: "center" }}>
                  <Icon name="trophy" size={28} />
                </div>
              </div>
              <div>
                <div className="t-display" style={{ fontSize: 22, fontWeight: 600 }}>
                  {PLAYER.rank.tier} {PLAYER.rank.division}
                </div>
                <div className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                  {PLAYER.rank.lp} LP · #4,203 EUW
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.10em" }}>
                  PROGRESS TO DIAMOND I
                </span>
                <span className="t-mono" style={{ fontSize: 11 }}>64 / 100</span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: "64%" }} /></div>
            </div>

            <div className="divider" style={{ margin: 0 }} />

            <div>
              <div className="t-eyebrow" style={{ marginBottom: 8 }}>Last 30 days · Winrate trend</div>
              <Sparkline data={SPARK_DATA} />
            </div>
          </div>
        </div>
      </div>

      {/* Three-col row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Today's session */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: "var(--green)", boxShadow: "0 0 6px var(--green-soft)" }} />
              Today · {recent.length} games
            </div>
            <button className="panel-action" onClick={() => onNavigate("profile")}>VIEW ALL →</button>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Donut value={Math.round(wins / recent.length * 100)} size={60} stroke={6} label="W RATE" />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
                  {wins}W · {recent.length - wins}L
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {recent.map(m => (
                    <div key={m.id} style={{
                      flex: 1, height: 24, borderRadius: 3,
                      background: m.result === "win" ? "var(--green-soft)" : "var(--red-soft)",
                      borderLeft: `3px solid ${m.result === "win" ? "var(--green)" : "var(--red)"}`,
                      display: "grid", placeItems: "center",
                      fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 700,
                      color: m.result === "win" ? "var(--green)" : "var(--red)",
                    }}>
                      {m.result === "win" ? "W" : "L"}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="divider" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="t-eyebrow">SESSION TIPS</div>
              <div style={{ fontSize: 12, color: "var(--fg-1)", lineHeight: 1.55 }}>
                Dodge if last pick is <strong className="amber">Echo</strong> — 38% WR vs your roster matchup.
              </div>
            </div>
          </div>
        </div>

        {/* Champion focus */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: "var(--cyan)" }} /> Champion focus
            </div>
            <button className="panel-action">SWAP →</button>
          </div>
          <div className="panel-body">
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <Champ id="syndra" size="xl" />
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div className="t-display" style={{ fontSize: 18, fontWeight: 600 }}>Syndra</div>
                <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>MID · MAGE / BURST</div>
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  <span className="tag accent">M7</span>
                  <span className="tag">412k pts</span>
                </div>
              </div>
            </div>
            <div className="grid-3" style={{ gap: 6 }}>
              {[
                { label: "WIN RATE", value: "71%", color: "var(--green)" },
                { label: "KDA",      value: "3.4",  color: "var(--fg-0)" },
                { label: "GAMES",    value: "28",   color: "var(--fg-0)" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", padding: 8, background: "var(--bg-3)", borderRadius: 6 }}>
                  <div className="t-display" style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.value}</div>
                  <div className="t-eyebrow" style={{ fontSize: 9 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Patch deltas */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: "var(--amber)" }} /> Patch 14.9 deltas
            </div>
            <span className="tag amber">NEW</span>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { name: "Syndra",  id: "syndra",   delta: +3.1, note: "E mana cost ↓, Q damage ↑" },
              { name: "Leona",   id: "leona",    delta: +2.4, note: "Passive healing buffed" },
              { name: "Malphite",id: "malphite", delta: -1.8, note: "Base armor ↓ 4" },
              { name: "Ahri",    id: "ahri",     delta: -2.5, note: "W cooldown +2s at early ranks" },
            ].map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Champ id={c.id} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</div>
                  <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.note}
                  </div>
                </div>
                <span className={`t-mono ${c.delta > 0 ? "green" : "red"}`} style={{ fontSize: 12, fontWeight: 600 }}>
                  {c.delta > 0 ? "+" : ""}{c.delta}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent matches */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Recent matches</div>
          <button className="panel-action" onClick={() => onNavigate("profile")}>HISTORY →</button>
        </div>
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recent.map(m => {
            const champ = champById(m.champion);
            return (
              <div
                key={m.id}
                className={`match-row ${m.result}`}
                onClick={() => { onSelectMatch(m.id); onNavigate("profile"); }}
              >
                <div />
                <div className="match-result">
                  <span className={`match-result-label ${m.result}`}>{m.result.toUpperCase()}</span>
                  <span className="match-result-time">{m.duration}</span>
                </div>
                <div className="match-champ-info">
                  <Champ id={m.champion} withTooltip />
                  <div className="match-champ-info-text">
                    <span className="match-champ-info-name">{champ?.name}</span>
                    <span className="match-champ-info-meta">{m.role} · {m.queue} · {m.timestamp}</span>
                  </div>
                </div>
                <div className="match-team">
                  {m.ally.map((id, i) => <Champ key={i} id={id} size="xs" withTooltip />)}
                </div>
                <KDARatio {...m.kda} />
                <div className="match-prediction">
                  <div className="match-prediction-bar">
                    <div className="match-prediction-fill" style={{ width: `${m.prediction.peak}%` }} />
                  </div>
                  <span>{m.prediction.peak}%</span>
                </div>
                <Icon name="chevron-right" size={14} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
