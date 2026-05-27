/* global React */
const Overlay = ({ position }) => {
  const tick = window.useTicker(1000);
  const baseProb = 62;
  const prob = baseProb + Math.sin(tick / 4) * 3;
  const probInt = Math.round(prob);

  // Animate Drake countdown
  const drakeTime = 92 - (tick % 92);
  const dm = Math.floor(drakeTime / 60);
  const ds = drakeTime % 60;

  return (
    <div className={`overlay-widget ${position}`}>
      <div className="overlay-header">
        <div className="overlay-title">
          <span style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: "var(--green)", boxShadow: "0 0 6px var(--green)"
          }}/>
          YuumiPal · Live
        </div>
        <span className="overlay-time">18:{(24 + (tick % 60)).toString().padStart(2, "0")}</span>
      </div>

      <div className="overlay-body">
        {/* Win probability bar */}
        <div>
          <div style={{
            display: "flex", justifyContent: "space-between", marginBottom: 4,
            fontFamily: "var(--ff-mono)", fontSize: 9,
            letterSpacing: "0.10em", color: "rgba(255,255,255,0.6)"
          }}>
            <span>WIN PROBABILITY</span>
            <span style={{color: "var(--accent)", fontWeight: 700}}>+{Math.round((prob - baseProb) * 10) / 10}%</span>
          </div>
          <div className="overlay-winrate-bar">
            <div className="overlay-winrate-blue" style={{width: `${probInt}%`}}>{probInt}%</div>
            <div className="overlay-winrate-red">{100 - probInt}%</div>
          </div>
        </div>

        {/* AI tip */}
        <div className="overlay-tip">
          <div className="overlay-tip-icon">!</div>
          <div className="overlay-tip-text">
            <strong>Set up Herald</strong> at 19:30 — Vex has smite + closer pathing. <strong className="accent" style={{color: "var(--accent)"}}>+8% win</strong>.
          </div>
        </div>

        {/* Objectives */}
        <div style={{display: "flex", flexDirection: "column", gap: 4}}>
          <div className="overlay-objective-row">
            <div className="overlay-obj-icon" style={{background: "oklch(0.45 0.10 215)", color: "white"}}>OC</div>
            <span className="overlay-obj-name">Ocean Drake</span>
            <span className="overlay-obj-time">{dm}:{ds.toString().padStart(2,"0")}</span>
          </div>
          <div className="overlay-objective-row">
            <div className="overlay-obj-icon" style={{background: "oklch(0.45 0.18 25)", color: "white"}}>RH</div>
            <span className="overlay-obj-name">Rift Herald</span>
            <span className="overlay-obj-time ready">READY</span>
          </div>
          <div className="overlay-objective-row">
            <div className="overlay-obj-icon" style={{background: "oklch(0.45 0.14 75)", color: "white"}}>AB</div>
            <span className="overlay-obj-name">Ancient Baron</span>
            <span className="overlay-obj-time" style={{color: "var(--fg-3)"}}>5:{(18 - (tick % 60)).toString().padStart(2,"0")}</span>
          </div>
        </div>
      </div>

      <div className="overlay-footer">
        <button className="overlay-footer-btn">BUILD</button>
        <button className="overlay-footer-btn">MAP</button>
        <button className="overlay-footer-btn" style={{background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)"}}>OPEN</button>
      </div>
    </div>
  );
};

window.Overlay = Overlay;
