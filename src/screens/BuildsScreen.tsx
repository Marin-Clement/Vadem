import { Champ, ItemGlyph } from "../components/Champ";

const builds = [
  {
    id: "burst", name: "Burst Carry", recommended: true, pick: 64, win: 71,
    mythic: "ludens",
    core: ["ludens", "sorcshoes", "rabadons", "voidstaff"],
    situational: ["zhonyas", "blasting"],
    runes: ["Electrocute", "Sudden Impact", "Ravenous Hunter", "Gathering Storm"],
    vs: "Standard mages with low MR",
  },
  {
    id: "scaling", name: "Scaling Control", recommended: false, pick: 22, win: 64,
    mythic: "shadowflame",
    core: ["shadowflame", "sorcshoes", "rabadons", "voidstaff"],
    situational: ["warmogs"],
    runes: ["Phase Rush", "Manaflow Band", "Transcendence", "Scorch"],
    vs: "Long games, team comp with frontline",
  },
  {
    id: "anti-tank", name: "Anti-Tank", recommended: false, pick: 12, win: 58,
    mythic: "ludens",
    core: ["ludens", "sorcshoes", "voidstaff", "blasting"],
    situational: ["zhonyas"],
    runes: ["Conqueror", "Legend: Tenacity", "Demolish", "Bone Plating"],
    vs: "Tank-heavy enemy comps",
  },
];

const skillOrder: Record<string, number[]> = {
  Q: [1, 4, 5, 7, 9],
  W: [3, 14, 15, 17, 18],
  E: [2, 8, 10, 12, 13],
  R: [6, 11, 16],
};

export function BuildsScreen() {
  return (
    <div className="content fade-up">
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Champ id="syndra" size="xl" />
          <div>
            <div className="t-eyebrow">BUILD RECOMMENDER</div>
            <div className="t-display" style={{ fontSize: 24, fontWeight: 600 }}>Syndra · MID</div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>vs Ahri · Patch 15.9 · 12,481 games sampled</div>
          </div>
        </div>
        <div />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn">Change matchup</button>
          <button className="btn btn-primary">Lock build</button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 14 }}>
        {builds.map(b => (
          <div key={b.id} className={`build-card ${b.recommended ? "recommended" : ""}`}>
            <div className="build-card-header">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="build-card-title">{b.name}</span>
                  {b.recommended && <span className="tag accent">AI PICK</span>}
                </div>
                <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>{b.vs}</div>
              </div>
              <div className="build-card-pickrate">
                <b>{b.win}%</b>
                <div className="t-mono" style={{ fontSize: 9, color: "var(--fg-3)" }}>WIN · {b.pick}% PICK</div>
              </div>
            </div>

            <div>
              <div className="t-eyebrow" style={{ marginBottom: 6 }}>CORE PATH</div>
              <div className="build-path">
                {b.core.map((id, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ItemGlyph id={id} size="lg" />
                    {i < b.core.length - 1 && <span className="build-path-arrow">›</span>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="t-eyebrow" style={{ marginBottom: 6 }}>SITUATIONAL</div>
              <div style={{ display: "flex", gap: 6 }}>
                {b.situational.map((id, i) => <ItemGlyph key={i} id={id} />)}
              </div>
            </div>

            <div>
              <div className="t-eyebrow" style={{ marginBottom: 6 }}>RUNES</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {b.runes.map((r, i) => <span key={i} className="tag">{r}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skill order */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Skill order · max priority</div>
          <span className="t-mono fg-3" style={{ fontSize: 10 }}>Q › E › W</span>
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
                  const has = skillOrder[skill].includes(lvl);
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
            {[
              { id: "ahri",    name: "Ahri",    wr: 62, games: "412" },
              { id: "viktor",  name: "Viktor",  wr: 58, games: "298" },
              { id: "orianna", name: "Orianna", wr: 56, games: "184" },
            ].map(c => (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 60px 60px", gap: 10, alignItems: "center" }}>
                <Champ id={c.id} withTooltip />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</span>
                <span className="t-mono green" style={{ fontSize: 13, fontWeight: 600 }}>{c.wr}%</span>
                <span className="t-mono fg-3" style={{ fontSize: 10 }}>{c.games}G</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title"><span className="panel-title-dot" style={{ background: "var(--red)" }} /> Weak vs</div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "zed",    name: "Zed",     wr: 41, games: "212" },
              { id: "khazix", name: "Kha'Zix", wr: 44, games: "98" },
              { id: "leesin", name: "Lee Sin",  wr: 46, games: "78" },
            ].map(c => (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 60px 60px", gap: 10, alignItems: "center" }}>
                <Champ id={c.id} withTooltip />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</span>
                <span className="t-mono red" style={{ fontSize: 13, fontWeight: 600 }}>{c.wr}%</span>
                <span className="t-mono fg-3" style={{ fontSize: 10 }}>{c.games}G</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
