/* global React */
const { useState: useStateD } = React;

const DraftScreen = () => {
  const [activeSlot, setActiveSlot] = useStateD({ team: "blue", index: 2 });
  const [hoveredChamp, setHoveredChamp] = useStateD(null);

  const blueRoster = [
    { role: "TOP", id: "halberd", lane: "70%" },
    { role: "JNG", id: "vex",     lane: "62%" },
    { role: "MID", id: null,      lane: null },
    { role: "BOT", id: "quill",   lane: "55%" },
    { role: "SUP", id: "myra",    lane: "60%" },
  ];
  const redRoster = [
    { role: "TOP", id: "ironwake", lane: "58%" },
    { role: "JNG", id: "thornroot", lane: "65%" },
    { role: "MID", id: "echo",     lane: "52%" },
    { role: "BOT", id: "talon",    lane: "48%" },
    { role: "SUP", id: "verdant",  lane: "62%" },
  ];

  const bans = ["sable", "wraith", "kestrel", "atlas", "ravel", "kael"];
  const recommended = [
    { id: "noctis",   score: 86, why: "Counters Echo (62% WR last patch)" },
    { id: "lumen",    score: 79, why: "Strong vs Echo poke" },
    { id: "aria",     score: 74, why: "Scaling matches your team comp" },
  ];

  return (
    <div className="content fade-up" style={{paddingBottom: 16}}>
      <div className="draft-grid" style={{height: "auto"}}>
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
                   onClick={() => !p.id && setActiveSlot({team:"blue", index: i})}>
                <span className="draft-pick-role">{p.role}</span>
                {p.id ? <window.Champ id={p.id} size="lg" withTooltip/> : (
                  <div className="champ lg no-bg" style={{background:"var(--bg-2)", border:"1px dashed var(--line-3)", color:"var(--fg-3)"}}>
                    <span style={{fontSize: 10, fontWeight: 500}}>?</span>
                  </div>
                )}
                <div className="draft-pick-info">
                  <span className="draft-pick-name">{p.id ? window.champById(p.id).name : "Awaiting pick"}</span>
                  <span className="draft-pick-meta">{p.id ? window.champById(p.id).tags.join(" · ") : "Tap a champion"}</span>
                </div>
                <div className="draft-pick-stat" style={{color: p.lane ? "var(--green)" : "var(--fg-4)"}}>
                  {p.lane || "—"}
                  <div className="t-mono" style={{fontSize: 9, color:"var(--fg-3)", fontWeight: 400}}>LANE WR</div>
                </div>
              </div>
            );
          })}
          <div className="t-eyebrow" style={{marginTop: 6}}>BLUE BANS</div>
          <div style={{display:"flex", gap: 4}}>
            {bans.slice(0,3).map(id => <window.Champ key={id} id={id} size="sm" className="banned-look"/>)}
          </div>
        </div>

        {/* CENTER */}
        <div className="draft-center">
          <div className="draft-prediction-card tactical">
            <div className="draft-prediction-label">Predicted win rate</div>
            <div className="draft-prediction-value">61<span className="pct">%</span></div>
            <div className="draft-prediction-trend">↑ +9% if you lock Noctis</div>
            <div className="divider" style={{margin: "14px 0 10px"}}/>
            <div style={{display:"flex", justifyContent:"space-between", fontFamily:"var(--ff-mono)", fontSize: 10, color:"var(--fg-3)"}}>
              <div><div style={{fontSize: 16, color:"var(--cyan)", fontWeight: 700}}>61%</div><div style={{letterSpacing:"0.10em"}}>BLUE</div></div>
              <div><div style={{fontSize: 16, color:"var(--fg-1)", fontWeight: 700}}>0.84</div><div style={{letterSpacing:"0.10em"}}>CONFIDENCE</div></div>
              <div><div style={{fontSize: 16, color:"var(--red)", fontWeight: 700}}>39%</div><div style={{letterSpacing:"0.10em"}}>RED</div></div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><span className="panel-title-dot"/> AI suggests · MID</div>
              <span className="tag accent">FOR YOU</span>
            </div>
            <div className="panel-body" style={{display:"flex", flexDirection:"column", gap: 8}}>
              {recommended.map((r, i) => (
                <div key={r.id} style={{display:"grid", gridTemplateColumns: "20px 40px 1fr 50px", gap: 10, alignItems:"center", padding: 8, background:"var(--bg-3)", borderRadius: 6, border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--line-1)", cursor: "pointer"}}>
                  <span className="t-display" style={{fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--accent)" : "var(--fg-3)"}}>{i+1}</span>
                  <window.Champ id={r.id} withTooltip/>
                  <div style={{minWidth: 0}}>
                    <div style={{fontSize: 12, fontWeight: 600}}>{window.champById(r.id).name}</div>
                    <div className="t-mono" style={{fontSize: 10, color:"var(--fg-3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{r.why}</div>
                  </div>
                  <div className="t-mono" style={{fontSize: 13, fontWeight: 700, color:"var(--accent)", textAlign:"right"}}>{r.score}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="coach-bubble">
            <div className="coach-avatar">YP</div>
            <div>
              <div className="coach-meta">DRAFT NOTE</div>
              <div className="coach-text">
                Their team has <strong>3 melee threats</strong> and weak vs poke. Your team needs reach and zoning. <strong>Lumen or Noctis</strong> close the gap. Avoid melee assassins this draft.
              </div>
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
              <window.Champ id={p.id} size="lg" withTooltip/>
              <div className="draft-pick-info">
                <span className="draft-pick-name">{window.champById(p.id).name}</span>
                <span className="draft-pick-meta">{window.champById(p.id).tags.join(" · ")}</span>
              </div>
              <div className="draft-pick-stat" style={{color: parseInt(p.lane) >= 60 ? "var(--red)" : "var(--fg-2)"}}>
                {p.lane}
                <div className="t-mono" style={{fontSize: 9, color:"var(--fg-3)", fontWeight: 400}}>LANE WR</div>
              </div>
            </div>
          ))}
          <div className="t-eyebrow" style={{marginTop: 6}}>RED BANS</div>
          <div style={{display:"flex", gap: 4}}>
            {bans.slice(3).map(id => <window.Champ key={id} id={id} size="sm"/>)}
          </div>
        </div>
      </div>

      {/* Champion picker */}
      <div className="panel" style={{marginTop: 14}}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot"/> Champion pool · MID</div>
          <div style={{display:"flex", gap: 4}}>
            {["ALL","MAGE","ASSASSIN","CONTROL","POKE"].map((t,i) => (
              <button key={t} className="seg-item" style={i === 0 ? {background:"var(--accent-soft)", color:"var(--accent)"} : {}}>{t}</button>
            ))}
          </div>
        </div>
        <div className="panel-body">
          <div className="picker-grid">
            {window.CHAMPIONS.map(c => {
              const isBanned = bans.includes(c.id);
              const isPicked = [...blueRoster, ...redRoster].some(s => s.id === c.id);
              const recRank = recommended.findIndex(r => r.id === c.id);
              return (
                <div key={c.id}
                     className={`picker-item ${isBanned || isPicked ? "banned" : ""} ${recRank === 0 ? "recommended" : ""}`}
                     onMouseEnter={() => setHoveredChamp(c.id)}
                     onMouseLeave={() => setHoveredChamp(null)}>
                  <window.Champ id={c.id} size="" />
                  {recRank >= 0 && !isBanned && !isPicked && <div className="pick-rank">{recRank+1}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

window.DraftScreen = DraftScreen;
