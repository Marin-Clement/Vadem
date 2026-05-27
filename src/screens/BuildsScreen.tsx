import { useState, useEffect } from "react";
import { Champ } from "../components/Champ";
import { DDragonItem } from "../components/Champ";
import { getBuilds, getSkillOrder, getCounters, type BuildEntry, type MatchupEntry } from "../api/builds";
import { WipTag } from "../components/Wip";

interface Props {
  championId?: string;
  vsChampion?: string;
}

const SKILL_LEVELS: Record<string, number[]> = {
  Q: [1, 4, 5, 7, 9],
  W: [3, 14, 15, 17, 18],
  E: [2, 8, 10, 12, 13],
  R: [6, 11, 16],
};

export function BuildsScreen({ championId = "syndra", vsChampion }: Props) {
  const [builds, setBuilds] = useState<BuildEntry[]>([]);
  const [skillOrder, setSkillOrder] = useState<string[]>(["Q", "E", "W", "R"]);
  const [strongVs, setStrongVs] = useState<MatchupEntry[]>([]);
  const [weakVs, setWeakVs] = useState<MatchupEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getBuilds(championId, { vs: vsChampion }).then(r => setBuilds(r.builds)),
      getSkillOrder(championId).then(r => setSkillOrder(r.skill_order)),
      getCounters(championId).then(r => { setStrongVs(r.strong_vs); setWeakVs(r.weak_vs); }),
    ]).finally(() => setLoading(false));
  }, [championId, vsChampion]);

  // Build skill level lookup from the ordered skill list
  const skillLevels: Record<string, number[]> = {};
  skillOrder.forEach((skill) => {
    // Each skill gets leveled at positions in the order they appear
    const levels: number[] = [];
    let level = 0;
    let count = 0;
    while (level < 18 && count < (skill === "R" ? 3 : 5)) {
      level++;
      // This is a simplified version — we fall back to the hardcoded default if no DB data
      if (SKILL_LEVELS[skill]?.includes(level)) {
        levels.push(level);
        count++;
      }
    }
    skillLevels[skill] = SKILL_LEVELS[skill] ?? levels;
  });

  return (
    <div className="content fade-up">
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Champ id={championId.toLowerCase()} size="xl" />
          <div>
            <div className="t-eyebrow">BUILD RECOMMENDER</div>
            <div className="t-display" style={{ fontSize: 24, fontWeight: 600 }}>{championId} · MID</div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
              {vsChampion ? `vs ${vsChampion} · ` : ''}
              {loading ? 'Loading…' : `${builds.reduce((s, b) => s + b.games, 0).toLocaleString()} games sampled`}
            </div>
          </div>
        </div>
        <div />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary">Lock build</button>
        </div>
      </div>

      {loading ? (
        <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)", padding: 16 }}>Loading builds…</div>
      ) : builds.length === 0 ? (
        <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)", padding: 16 }}>No build data for {championId} yet. Play more ranked games to generate data.</div>
      ) : (
        <div className="grid-3" style={{ marginBottom: 14 }}>
          {builds.map(b => (
            <div key={b.name} className={`build-card ${b.recommended ? "recommended" : ""}`}>
              <div className="build-card-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="build-card-title">{b.name}</span>
                    {b.recommended && <WipTag />}
                  </div>
                </div>
                <div className="build-card-pickrate">
                  <b>{(b.win_rate * 100).toFixed(0)}%</b>
                  <div className="t-mono" style={{ fontSize: 9, color: "var(--fg-3)" }}>WIN · {(b.pick_pct * 100).toFixed(0)}% PICK</div>
                </div>
              </div>

              <div>
                <div className="t-eyebrow" style={{ marginBottom: 6 }}>CORE PATH</div>
                <div className="build-path">
                  {b.item_path.map((id, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <DDragonItem itemId={id} size="lg" />
                      {i < b.item_path.length - 1 && <span className="build-path-arrow">›</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="t-eyebrow" style={{ marginBottom: 6 }}>RUNES</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {b.runes.map((r, i) => <span key={i} className="tag">{r}</span>)}
                </div>
              </div>

              <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                {b.games.toLocaleString()} games
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skill order */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Skill order · max priority</div>
          <span className="t-mono fg-3" style={{ fontSize: 10 }}>{skillOrder.join(' › ')}</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(18, 1fr)", gap: 4, fontFamily: "var(--ff-mono)", fontSize: 11 }}>
            <div style={{ color: "var(--fg-3)" }}>LVL</div>
            {[...Array(18).keys()].map(i => (
              <div key={i} style={{ textAlign: "center", color: "var(--fg-3)" }}>{i + 1}</div>
            ))}
            {["Q", "W", "E", "R"].map(skill => (
              <div key={skill} style={{ display: "contents" }}>
                <div style={{ fontWeight: 700, color: skill === "R" ? "var(--accent)" : "var(--fg-1)", display: "grid", placeItems: "center", background: "var(--bg-3)", borderRadius: 4, height: 28 }}>
                  {skill}
                </div>
                {[...Array(18).keys()].map(i => {
                  const lvl = i + 1;
                  const has = SKILL_LEVELS[skill]?.includes(lvl) ?? false;
                  return (
                    <div key={i} style={{
                      height: 28,
                      background: has ? (skill === "R" ? "var(--accent)" : "var(--accent-soft)") : "var(--bg-3)",
                      border: "1px solid var(--line-1)", borderRadius: 4, display: "grid", placeItems: "center",
                      color: has ? (skill === "R" ? "#0a0613" : "var(--accent)") : "transparent",
                      fontWeight: 700,
                    }}>
                      {has ? skill : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Counter matrix */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" style={{ background: "var(--green)" }} /> Strong vs</div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {strongVs.length === 0 ? (
              <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>No data yet</div>
            ) : (
              strongVs.map(c => (
                <div key={c.champion_id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 60px 60px", gap: 10, alignItems: "center" }}>
                  <Champ id={c.champion_id.toLowerCase()} withTooltip />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{c.champion_id}</span>
                  <span className="t-mono green" style={{ fontSize: 13, fontWeight: 600 }}>{(c.win_rate * 100).toFixed(0)}%</span>
                  <span className="t-mono fg-3" style={{ fontSize: 10 }}>{c.games}G</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" style={{ background: "var(--red)" }} /> Weak vs</div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {weakVs.length === 0 ? (
              <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>No data yet</div>
            ) : (
              weakVs.map(c => (
                <div key={c.champion_id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 60px 60px", gap: 10, alignItems: "center" }}>
                  <Champ id={c.champion_id.toLowerCase()} withTooltip />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{c.champion_id}</span>
                  <span className="t-mono red" style={{ fontSize: 13, fontWeight: 600 }}>{(c.win_rate * 100).toFixed(0)}%</span>
                  <span className="t-mono fg-3" style={{ fontSize: 10 }}>{c.games}G</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
