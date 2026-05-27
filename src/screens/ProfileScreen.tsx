import { useState } from "react";
import { Icon } from "../components/Icon";
import { Champ, ItemGlyph } from "../components/Champ";
import { StatTile, Sparkline, KDARatio } from "../components/Primitives";
import { MATCHES, PLAYER, champById } from "../data/mockData";


interface Props {
  selectedMatchId: string | null;
  onSelectMatch: (id: string) => void;
  onOpenMatchDetail: (id: string) => void;
}

function MatchDetailPanel({ matchId, onOpenFull }: { matchId: string; onOpenFull: () => void }) {
  const m = MATCHES.find(x => x.id === matchId);
  if (!m) return null;
  const champ = champById(m.champion);

  return (
    <div className="match-detail-panel">
      <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 24 }}>
        {/* Left: KDA + items */}
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>YOUR PERFORMANCE</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
            <Champ id={m.champion} size="lg" />
            <div>
              <div className="t-display" style={{ fontSize: 18, fontWeight: 600 }}>{champ?.name}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span className={`tag ${m.result === "win" ? "win" : "loss"}`}>{m.rating.label} · {m.rating.value}</span>
                <span className="tag">{m.cs} CS · {m.csPerMin}/min</span>
                <span className="tag accent">{m.damage.toLocaleString()} DMG</span>
              </div>
            </div>
          </div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>FINAL BUILD</div>
          <div style={{ display: "flex", gap: 6 }}>
            {m.items.map((id, i) => <ItemGlyph key={i} id={id} size="lg" />)}
          </div>
        </div>

        {/* Middle: AI moments */}
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="panel-title-dot" /> KEY MOMENTS · AI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {m.moments.map((mo, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: 8, background: "var(--bg-3)", borderRadius: 6, borderLeft: "2px solid var(--accent)" }}>
                <span className="t-mono" style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>{mo.t}</span>
                <span style={{ fontSize: 11, color: "var(--fg-1)", lineHeight: 1.4 }}>{mo.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: win probability */}
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>WIN PROBABILITY</div>
          <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
            <div>
              <div className="t-display" style={{ fontSize: 28, fontWeight: 600, color: "var(--fg-3)" }}>{m.prediction.pre}%</div>
              <div className="t-eyebrow" style={{ fontSize: 9 }}>PRE-GAME</div>
            </div>
            <div style={{ alignSelf: "center" }}><Icon name="chevron-right" size={16} /></div>
            <div>
              <div className="t-display" style={{ fontSize: 28, fontWeight: 600, color: m.result === "win" ? "var(--green)" : "var(--red)" }}>
                {m.prediction.peak}%
              </div>
              <div className="t-eyebrow" style={{ fontSize: 9 }}>PEAK</div>
            </div>
          </div>
          <Sparkline
            data={[m.prediction.pre, 52, 60, 58, 65, 70, m.prediction.peak]}
            color={m.result === "win" ? "var(--green)" : "var(--red)"}
          />
          <button className="btn btn-sm" style={{ marginTop: 12, width: "100%" }} onClick={(e) => { e.stopPropagation(); onOpenFull(); }}>
            <Icon name="search" size={11} /> OPEN FULL TIMELINE
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileScreen({ selectedMatchId, onSelectMatch, onOpenMatchDetail }: Props) {
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(selectedMatchId);

  const matches = MATCHES.filter(m => filter === "all" || m.result === filter);
  const wins = MATCHES.filter(m => m.result === "win").length;
  const losses = MATCHES.length - wins;

  const roles = [
    { role: "MID", games: 4, wr: 75, color: "var(--accent)" },
    { role: "TOP", games: 1, wr: 100, color: "var(--red)" },
    { role: "JNG", games: 1, wr: 0, color: "var(--green)" },
  ];

  return (
    <div className="content fade-up">
      {/* Profile hero */}
      <div className="panel tactical" style={{ marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div className="tactical-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.3, maskImage: "radial-gradient(circle at 80% 50%, transparent, black 70%)" }} />
        <div className="panel-body" style={{ display: "flex", gap: 24, alignItems: "center", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 96, height: 96, borderRadius: 16, background: "var(--accent)", display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 700, color: "#0a0613" }}>
              WC
            </div>
            <div style={{ position: "absolute", bottom: -4, right: -4, padding: "2px 8px", background: "var(--bg-3)", border: "1px solid var(--accent)", borderRadius: 6, fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>
              {PLAYER.level}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div className="t-display" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{PLAYER.handle}</div>
              <span className="t-mono" style={{ fontSize: 14, color: "var(--fg-3)" }}>#{PLAYER.tag}</span>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12, color: "var(--fg-2)" }}>
              <span>{PLAYER.region}</span>
              <span>·</span>
              <span>Main: {PLAYER.mainRole}</span>
              <span>·</span>
              <span>{PLAYER.hours}h tracked</span>
              <span>·</span>
              <span className="green">● Online</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <span className="tag accent">{PLAYER.rank.tier} {PLAYER.rank.division} · {PLAYER.rank.lp} LP</span>
              <span className="tag">{PLAYER.games} games · season</span>
              <span className="tag win">{PLAYER.streak}W streak</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost"><Icon name="filter" size={14} /> Compare</button>
            <button className="btn"><Icon name="swap" size={14} /> Switch profile</button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid-4" style={{ marginBottom: 14 }}>
        <StatTile label="Season W/L" value={`${wins}–${losses}`} trend={12} trendLabel=" games" />
        <StatTile label="Win rate" value={Math.round(wins / (wins + losses) * 100)} suffix="%" trend={4} />
        <StatTile label="Avg KDA" value="2.94" trend={0.18} />
        <StatTile label="LP gain · 7d" value="+38" />
      </div>

      {/* Role dist + champion pool */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14, marginBottom: 14 }}>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" /> Role distribution</div>
          </div>
          <div className="panel-body">
            {roles.map(r => (
              <div key={r.role} style={{ display: "grid", gridTemplateColumns: "40px 1fr 60px 50px", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--line-1)" }}>
                <span className="t-mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--fg-1)" }}>{r.role}</span>
                <div className="bar" style={{ height: 8 }}>
                  <div className="bar-fill" style={{ width: `${(r.games / 6) * 100}%`, background: r.color }} />
                </div>
                <span className="t-mono fg-2" style={{ fontSize: 11 }}>{r.games} games</span>
                <span className="t-mono" style={{ fontSize: 11, fontWeight: 600, color: r.wr >= 50 ? "var(--green)" : "var(--red)" }}>{r.wr}% WR</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" style={{ background: "var(--cyan)" }} /> Champion pool · last 30d</div>
            <button className="panel-action">EXPAND →</button>
          </div>
          <div className="panel-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { id: "syndra",  g: 28, w: 71, kda: 3.4 },
                { id: "ahri",    g: 14, w: 64, kda: 2.9 },
                { id: "viktor",  g: 11, w: 55, kda: 3.1 },
                { id: "orianna", g: 7,  w: 43, kda: 2.4 },
                { id: "zed",     g: 5,  w: 60, kda: 2.8 },
                { id: "camille", g: 3,  w: 67, kda: 4.1 },
              ].map(c => (
                <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: 8, background: "var(--bg-3)", borderRadius: 6, border: "1px solid var(--line-1)" }}>
                  <Champ id={c.id} withTooltip />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {champById(c.id)?.name}
                    </div>
                    <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{c.g}G · {c.kda} KDA</div>
                  </div>
                  <span className="t-mono" style={{ fontSize: 12, fontWeight: 700, color: c.w >= 50 ? "var(--green)" : "var(--red)" }}>{c.w}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Match history */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Match history</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[["all", "ALL"], ["win", "WINS"], ["loss", "LOSSES"]].map(([k, l]) => (
              <button key={k} className="panel-action" onClick={() => setFilter(k)}
                style={{ padding: "4px 10px", background: filter === k ? "var(--accent-soft)" : "transparent", color: filter === k ? "var(--accent)" : "var(--fg-3)", borderRadius: 4 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {matches.map(m => {
            const champ = champById(m.champion);
            return (
              <div key={m.id}>
                <div
                  className={`match-row ${m.result} ${openId === m.id ? "expanded" : ""}`}
                  onClick={() => { setOpenId(openId === m.id ? null : m.id); onSelectMatch(m.id); }}
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
                  <Icon name={openId === m.id ? "chevron-down" : "chevron-right"} size={14} />
                </div>
                {openId === m.id && (
                  <MatchDetailPanel matchId={m.id} onOpenFull={() => onOpenMatchDetail(m.id)} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
