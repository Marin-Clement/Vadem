import { useState, useCallback } from "react";
import { Champ } from "../components/Champ";
import { CHAMPIONS, champById } from "../data/mockData";
import { analyzeDraft, type DraftAnalysisResponse } from "../api/draft";
import { WipBanner, WipTag } from "../components/Wip";

export function DraftScreen() {
  const [activeSlot, setActiveSlot] = useState({ team: "blue", index: 2 });
  const [analysis, setAnalysis] = useState<DraftAnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const blueRoster = [
    { role: "TOP", id: "darius",   lane: "70%" },
    { role: "JNG", id: "vi",       lane: "62%" },
    { role: "MID", id: null,       lane: null },
    { role: "BOT", id: "jinx",     lane: "55%" },
    { role: "SUP", id: "lulu",     lane: "60%" },
  ];
  const redRoster = [
    { role: "TOP", id: "malphite", lane: "58%" },
    { role: "JNG", id: "hecarim",  lane: "65%" },
    { role: "MID", id: "ahri",     lane: "52%" },
    { role: "BOT", id: "caitlyn",  lane: "48%" },
    { role: "SUP", id: "thresh",   lane: "62%" },
  ];

  const bans = ["zed", "khazix", "leona", "ksante", "jhin", "leesin"];
  const recommended = [
    { id: "syndra",  score: 86, why: "Counters Ahri (62% WR last patch)" },
    { id: "viktor",  score: 79, why: "Strong vs Ahri poke, scales hard" },
    { id: "orianna", score: 74, why: "Scaling matches your engage comp" },
  ];

  const handleAnalyze = useCallback(async () => {
    const blue = blueRoster.filter(p => p.id).map(p => p.id!);
    const red = redRoster.map(p => p.id!);
    if (blue.length < 1 || red.length < 1) return;
    setAnalyzing(true);
    try {
      const result = await analyzeDraft({ blue_team: blue, red_team: red });
      setAnalysis(result);
    } catch {
      // fall back to placeholder
    } finally {
      setAnalyzing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const blueWr = analysis ? Math.round(analysis.blue_win_rate * 100) : 61;
  const redWr = analysis ? Math.round(analysis.red_win_rate * 100) : 39;
  const confidence = analysis ? analysis.confidence.toFixed(2) : "0.84";

  return (
    <div className="content fade-up" style={{ paddingBottom: 16 }}>
      <div className="draft-grid">
        {/* BLUE TEAM */}
        <div className="draft-team blue">
          <div className="draft-team-header">
            <div className="draft-team-name">Blue · Your team</div>
            <span className="tag cyan">PICK 5/5</span>
          </div>
          {blueRoster.map((p, i) => {
            const isActive = activeSlot.team === "blue" && activeSlot.index === i;
            return (
              <div key={i}
                className={`draft-pick-slot ${!p.id ? "empty" : ""} ${isActive ? "active" : ""}`}
                onClick={() => !p.id && setActiveSlot({ team: "blue", index: i })}
              >
                <span className="draft-pick-role">{p.role}</span>
                {p.id ? (
                  <Champ id={p.id} size="lg" withTooltip />
                ) : (
                  <div className="champ lg no-bg" style={{ background: "var(--bg-2)", border: "1px dashed var(--line-3)", color: "var(--fg-3)" }}>
                    <span style={{ fontSize: 10, fontWeight: 500 }}>?</span>
                  </div>
                )}
                <div className="draft-pick-info">
                  <span className="draft-pick-name">
                    {p.id ? champById(p.id)?.name ?? p.id : "Awaiting pick"}
                  </span>
                  <span className="draft-pick-meta">
                    {p.id ? champById(p.id)?.tags.join(" · ") ?? "—" : "Tap a champion"}
                  </span>
                </div>
                <div className="draft-pick-stat" style={{ color: p.lane ? "var(--green)" : "var(--fg-4)" }}>
                  {p.lane || "—"}
                  <div className="t-mono" style={{ fontSize: 9, color: "var(--fg-3)", fontWeight: 400 }}>LANE WR</div>
                </div>
              </div>
            );
          })}
          <div className="t-eyebrow" style={{ marginTop: 6 }}>BLUE BANS</div>
          <div style={{ display: "flex", gap: 4 }}>
            {bans.slice(0, 3).map(id => <Champ key={id} id={id} size="sm" className="banned-look" />)}
          </div>
        </div>

        {/* CENTER */}
        <div className="draft-center">
          <div className="draft-prediction-card tactical">
            <div className="draft-prediction-label">Predicted win rate</div>
            <div className="draft-prediction-value">{blueWr}<span className="pct">%</span></div>
            <div className="draft-prediction-trend" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              ↑ +9% if you lock Syndra <WipTag />
            </div>
            <div className="divider" style={{ margin: "14px 0 10px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--fg-3)" }}>
              <div><div style={{ fontSize: 16, color: "var(--cyan)", fontWeight: 700 }}>{blueWr}%</div><div style={{ letterSpacing: "0.10em" }}>BLUE</div></div>
              <div><div style={{ fontSize: 16, color: "var(--fg-1)", fontWeight: 700 }}>{confidence}</div><div style={{ letterSpacing: "0.10em" }}>CONFIDENCE</div></div>
              <div><div style={{ fontSize: 16, color: "var(--red)", fontWeight: 700 }}>{redWr}%</div><div style={{ letterSpacing: "0.10em" }}>RED</div></div>
            </div>
            <button className="btn btn-sm" style={{ marginTop: 12, width: "100%" }} onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? "Analyzing…" : "Analyze draft"}
            </button>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><span className="panel-title-dot" /> Suggested · MID</div>
              <WipTag />
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <WipBanner label="Pick recommendations — placeholder scores, ML ranking not yet connected" />
              {recommended.map((r, i) => (
                <div key={r.id} style={{
                  display: "grid", gridTemplateColumns: "20px 40px 1fr 50px", gap: 10, alignItems: "center",
                  padding: 8, background: "var(--bg-3)", borderRadius: 6,
                  border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--line-1)", cursor: "pointer",
                }}>
                  <span className="t-display" style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--accent)" : "var(--fg-3)" }}>{i + 1}</span>
                  <Champ id={r.id} withTooltip />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{champById(r.id)?.name ?? r.id}</div>
                    <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.why}</div>
                  </div>
                  <div className="t-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", textAlign: "right" }}>{r.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RED TEAM */}
        <div className="draft-team red">
          <div className="draft-team-header">
            <div className="draft-team-name">Red · Enemy</div>
            <span className="tag loss">5/5 LOCKED</span>
          </div>
          {redRoster.map((p, i) => (
            <div key={i} className="draft-pick-slot">
              <span className="draft-pick-role">{p.role}</span>
              <Champ id={p.id!} size="lg" withTooltip />
              <div className="draft-pick-info">
                <span className="draft-pick-name">{champById(p.id!)?.name ?? p.id}</span>
                <span className="draft-pick-meta">{champById(p.id!)?.tags.join(" · ") ?? "—"}</span>
              </div>
              <div className="draft-pick-stat" style={{ color: parseInt(p.lane!) >= 60 ? "var(--red)" : "var(--fg-2)" }}>
                {p.lane}
                <div className="t-mono" style={{ fontSize: 9, color: "var(--fg-3)", fontWeight: 400 }}>LANE WR</div>
              </div>
            </div>
          ))}
          <div className="t-eyebrow" style={{ marginTop: 6 }}>RED BANS</div>
          <div style={{ display: "flex", gap: 4 }}>
            {bans.slice(3).map(id => <Champ key={id} id={id} size="sm" />)}
          </div>
        </div>
      </div>

      {/* Champion picker */}
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Champion pool · MID</div>
          <div style={{ display: "flex", gap: 4 }}>
            {["ALL", "MAGE", "ASSASSIN", "CONTROL", "POKE"].map((t, i) => (
              <button key={t} className="seg-item" style={i === 0 ? { background: "var(--accent-soft)", color: "var(--accent)" } : {}}>{t}</button>
            ))}
          </div>
        </div>
        <div className="panel-body">
          <div className="picker-grid">
            {CHAMPIONS.map(c => {
              const isBanned = bans.includes(c.id);
              const isPicked = [...blueRoster, ...redRoster].some(s => s.id === c.id);
              const recRank = recommended.findIndex(r => r.id === c.id);
              return (
                <div key={c.id}
                  className={`picker-item ${isBanned || isPicked ? "banned" : ""} ${recRank === 0 ? "recommended" : ""}`}
                >
                  <Champ id={c.id} />
                  {recRank >= 0 && !isBanned && !isPicked && (
                    <div className="pick-rank">{recRank + 1}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
