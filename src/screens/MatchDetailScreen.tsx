import { Icon } from "../components/Icon";
import { Champ } from "../components/Champ";
import { MATCHES, champById } from "../data/mockData";

const ROLES = ["TOP", "JNG", "MID", "BOT", "SUP"];

interface Props {
  matchId: string;
  onBack: () => void;
}

export function MatchDetailScreen({ matchId, onBack }: Props) {
  const m = MATCHES.find(x => x.id === matchId) || MATCHES[0];

  return (
    <div className="content fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <Icon name="chevron-left" size={12} /> Back to history
        </button>
        <span className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>MATCH ID · {m.id.toUpperCase()}</span>
      </div>

      {/* Header */}
      <div className="panel tactical" style={{ marginBottom: 14, borderColor: m.result === "win" ? "oklch(0.78 0.16 150 / 0.4)" : "oklch(0.68 0.22 25 / 0.4)" }}>
        <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center" }}>
          <div style={{ width: 6, height: 80, background: m.result === "win" ? "var(--green)" : "var(--red)", boxShadow: `0 0 12px ${m.result === "win" ? "var(--green-soft)" : "var(--red-soft)"}`, borderRadius: 4 }} />
          <div>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>{m.queue} · {m.timestamp}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div className="t-display" style={{ fontSize: 36, fontWeight: 700, color: m.result === "win" ? "var(--green)" : "var(--red)" }}>
                {m.result.toUpperCase()}
              </div>
              <div className="t-display" style={{ fontSize: 22, color: "var(--fg-1)" }}>· {m.duration}</div>
              <span className="tag accent">{m.rating.label} · {m.rating.value}/10</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "KDA", val: `${m.kda.k}/${m.kda.d}/${m.kda.a}` },
              { label: "CS",  val: String(m.cs) },
              { label: "DMG", val: `${(m.damage / 1000).toFixed(1)}k` },
              { label: "VS",  val: String(m.vision) },
            ].map(s => (
              <div key={s.label}>
                <div className="t-eyebrow">{s.label}</div>
                <div className="t-display t-num" style={{ fontSize: 22, fontWeight: 600 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        {[
          { team: "Your team", side: "blue", roster: m.ally, won: m.result === "win" },
          { team: "Enemy team", side: "red", roster: m.enemy, won: m.result === "loss" },
        ].map((t, idx) => (
          <div key={idx} className="panel" style={{ borderColor: t.won ? "oklch(0.78 0.16 150 / 0.3)" : undefined }}>
            <div className="panel-header">
              <div className="panel-title">
                <span className="panel-title-dot" style={{ background: t.side === "blue" ? "var(--cyan)" : "var(--red)" }} />
                {t.team}
              </div>
              <span className={`tag ${t.won ? "win" : "loss"}`}>{t.won ? "VICTORY" : "DEFEAT"}</span>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {t.roster.map((cid, i) => {
                const c = champById(cid);
                const role = ROLES[i];
                const isMe = idx === 0 && cid === m.champion;
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 36px 1fr 80px 60px", gap: 10, alignItems: "center", padding: 8, background: isMe ? "var(--accent-soft)" : "var(--bg-3)", border: `1px solid ${isMe ? "var(--accent)" : "var(--line-1)"}`, borderRadius: 6 }}>
                    <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 700, letterSpacing: "0.08em" }}>{role}</span>
                    <Champ id={cid} withTooltip />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{c?.name || "?"}</div>
                      <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{isMe ? "You" : `Player ${i + 1}`}</div>
                    </div>
                    <span className="t-mono" style={{ fontSize: 11, fontWeight: 600 }}>
                      {Math.floor(Math.random() * 10) + 2}/{Math.floor(Math.random() * 8) + 1}/{Math.floor(Math.random() * 12) + 2}
                    </span>
                    <span className="t-mono fg-2" style={{ fontSize: 10 }}>{Math.floor(Math.random() * 100) + 150} CS</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Game timeline · key events</div>
          <span className="t-mono fg-3" style={{ fontSize: 10 }}>POWERED BY YUUMI MODEL v2.4</span>
        </div>
        <div className="panel-body">
          <div style={{ position: "relative", height: 120, padding: "20px 0" }}>
            <div style={{ position: "absolute", inset: "20px 0", background: "var(--bg-3)", borderRadius: 6, border: "1px solid var(--line-1)" }} />
            <svg width="100%" height="100%" viewBox="0 0 1000 80" preserveAspectRatio="none" style={{ position: "relative", zIndex: 1 }}>
              <path d="M0,40 C100,38 200,32 300,30 S500,55 600,50 S800,15 900,8 L1000,5" fill="none" stroke="var(--accent)" strokeWidth="2" />
              <path d="M0,40 L0,80 L1000,80 L1000,5 C800,15 600,50 300,30 C200,32 100,38 0,40 Z" fill="var(--accent-soft)" opacity="0.6" />
            </svg>
            {m.moments.map((mo, i) => {
              const left = (i + 1) * (90 / (m.moments.length + 1));
              return (
                <div key={i} style={{ position: "absolute", top: 14, left: `${left}%`, transform: "translateX(-50%)", zIndex: 2 }}>
                  <div className="tip-root">
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", border: "3px solid var(--bg-2)", cursor: "pointer" }} />
                    <div className="tip" style={{ whiteSpace: "normal", maxWidth: 220, minWidth: 200 }}>
                      <span className="tip-name">{mo.t}</span>
                      <div style={{ fontSize: 11, color: "var(--fg-1)" }}>{mo.text}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--fg-3)" }}>
            <span>00:00</span><span>10:00</span><span>20:00</span><span>30:00</span><span>{m.duration}</span>
          </div>
        </div>
      </div>

      {/* Coach takeaway */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Coach takeaway</div>
        </div>
        <div className="panel-body">
          <div className="coach-bubble">
            <div className="coach-avatar">YP</div>
            <div>
              <div className="coach-meta">3 INSIGHTS · MODEL CONFIDENCE 87%</div>
              <div className="coach-text" style={{ marginBottom: 8 }}>
                <strong>You won the early game decisively</strong> ({m.prediction.pre}% → {m.prediction.peak}% by 14:00). Solo kill rotations and Drake setup were textbook.
              </div>
              <div className="coach-text" style={{ marginBottom: 8 }}>
                <strong>Mid-game vision dropped</strong> between 18-24 minutes — only 6 wards placed in 6 minutes. This is your pattern in 73% of recent games.
              </div>
              <div className="coach-text">
                <strong>Drill recommendation:</strong> wave-clear timing on Syndra. Q → W (Force of Will) clears two waves in 3.2s. Practice tool: <span className="accent" style={{ cursor: "pointer", textDecoration: "underline" }}>Open trainer →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
