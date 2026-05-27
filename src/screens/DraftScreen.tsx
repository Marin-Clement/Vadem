import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Champ } from "../components/Champ";
import { Icon } from "../components/Icon";
import { useDDragon } from "../utils/ddragon";
import { analyzeDraft, type DraftAnalysisResponse } from "../api/draft";
import { getCounters, type MatchupEntry } from "../api/builds";

interface LcuTeamSlot {
  championId: number;
  position: string;
  isMe: boolean;
  summonerId: number;
}

interface LcuChampSelectState {
  myTeam: LcuTeamSlot[];
  theirTeam: LcuTeamSlot[];
  myTeamBans: number[];
  theirTeamBans: number[];
  phase: string;
}

const ROLES = ["TOP", "JNG", "MID", "BOT", "SUP"] as const;
type Role = typeof ROLES[number];

interface Slot {
  role: Role;
  id: string | null;
}

function emptyRoster(): Slot[] {
  return ROLES.map(role => ({ role, id: null }));
}

interface ActiveSlot { team: "blue" | "red"; index: number }

function DraftSlot({
  slot, isActive, isEnemy, recRank,
  onClick, onClear,
}: {
  slot: Slot;
  isActive: boolean;
  isEnemy?: boolean;
  recRank?: number;
  onClick: () => void;
  onClear?: () => void;
}) {
  return (
    <div
      className={`draft-pick-slot ${!slot.id ? "empty" : ""} ${isActive ? "active" : ""}`}
      onClick={onClick}
      style={{ position: "relative" }}
    >
      <span className="draft-pick-role">{slot.role}</span>
      {slot.id ? (
        <>
          <Champ id={slot.id} size="lg" withTooltip />
          {!isEnemy && onClear && (
            <div
              style={{ position: "absolute", top: 4, right: 4, cursor: "pointer", zIndex: 10, padding: 2 }}
              onClick={(e) => { e.stopPropagation(); onClear(); }}
            >
              <Icon name="x" size={10} />
            </div>
          )}
        </>
      ) : (
        <div className="champ lg no-bg" style={{ background: "var(--bg-2)", border: "1px dashed var(--line-3)", color: "var(--fg-3)" }}>
          <span style={{ fontSize: 10, fontWeight: 500 }}>?</span>
        </div>
      )}
      <div className="draft-pick-info">
        <span className="draft-pick-name">
          {slot.id ? slot.id : "Awaiting pick"}
        </span>
        <span className="draft-pick-meta">
          {slot.id ? slot.role : "Tap a champion"}
        </span>
      </div>
      {recRank != null && (
        <div className="t-mono" style={{ fontSize: 11, fontWeight: 700, color: recRank === 0 ? "var(--accent)" : "var(--fg-3)" }}>
          #{recRank + 1}
        </div>
      )}
    </div>
  );
}

export function DraftScreen() {
  const ddr = useDDragon();
  const [blueRoster, setBlueRoster] = useState<Slot[]>(emptyRoster());
  const [redRoster, setRedRoster] = useState<Slot[]>(emptyRoster());
  const [blueBans, setBlueBans] = useState<string[]>([]);
  const [redBans, setRedBans] = useState<string[]>([]);
  const [activeSlot, setActiveSlot] = useState<ActiveSlot>({ team: "blue", index: 0 });
  const [banMode, setBanMode] = useState<"blue" | "red" | null>(null);
  const [analysis, setAnalysis] = useState<DraftAnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [champFilter, setChampFilter] = useState("ALL");
  const [champSearch, setChampSearch] = useState("");
  const [recommendations, setRecommendations] = useState<{ id: string; score: number; why: string }[]>([]);
  const [lcuStatus, setLcuStatus] = useState<"idle" | "polling" | "active" | "error">("idle");
  const [lcuError, setLcuError] = useState<string | null>(null);
  const lcuPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve all champion IDs from DDragon for the picker grid
  const allChampIds = ddr
    ? Object.values(ddr.champByName).filter((v, i, arr) => arr.indexOf(v) === i).sort()
    : [];

  const allPicked = [...blueRoster, ...redRoster].map(s => s.id).filter(Boolean) as string[];
  const allBanned = [...blueBans, ...redBans];

  // Filter picker
  const filteredChamps = allChampIds.filter(id => {
    const q = champSearch.toLowerCase();
    if (q && !id.toLowerCase().includes(q)) return false;
    return true;
  });

  // Active slot info
  const activeRoster = activeSlot.team === "blue" ? blueRoster : redRoster;

  const pickChampion = useCallback((champId: string) => {
    if (allPicked.includes(champId) || allBanned.includes(champId)) return;

    if (banMode) {
      const bans = banMode === "blue" ? blueBans : redBans;
      if (bans.includes(champId) || bans.length >= 5) return;
      if (banMode === "blue") setBlueBans(prev => [...prev, champId]);
      else setRedBans(prev => [...prev, champId]);
      return;
    }

    const roster = activeSlot.team === "blue" ? [...blueRoster] : [...redRoster];
    roster[activeSlot.index] = { ...roster[activeSlot.index], id: champId };
    if (activeSlot.team === "blue") setBlueRoster(roster);
    else setRedRoster(roster);

    // Auto-advance to next empty slot
    const nextEmpty = roster.findIndex((s, i) => i > activeSlot.index && !s.id);
    if (nextEmpty !== -1) {
      setActiveSlot({ team: activeSlot.team, index: nextEmpty });
    }
  }, [activeSlot, blueRoster, redRoster, blueBans, redBans, allPicked, allBanned, banMode]);

  const clearSlot = (team: "blue" | "red", index: number) => {
    const roster = team === "blue" ? [...blueRoster] : [...redRoster];
    roster[index] = { ...roster[index], id: null };
    if (team === "blue") setBlueRoster(roster);
    else setRedRoster(roster);
  };

  const applyLcuState = useCallback((state: LcuChampSelectState) => {
    if (!ddr) return;
    const keyToId = (key: number): string | null => {
      if (key <= 0) return null;
      return ddr.champByKey[String(key)] ?? null;
    };

    // Build blue roster (myTeam) by position order
    const posOrder: Record<string, number> = { TOP: 0, JUNGLE: 1, MIDDLE: 2, BOTTOM: 3, UTILITY: 4, "": 0 };
    const sortedMy = [...state.myTeam].sort((a, b) => (posOrder[a.position.toUpperCase()] ?? 0) - (posOrder[b.position.toUpperCase()] ?? 0));
    const sortedTheir = [...state.theirTeam].sort((a, b) => (posOrder[a.position.toUpperCase()] ?? 0) - (posOrder[b.position.toUpperCase()] ?? 0));

    const newBlue = ROLES.map((role, i) => {
      const slot = sortedMy[i];
      const champId = slot ? keyToId(slot.championId) : null;
      return { role, id: champId };
    });

    const newRed = ROLES.map((role, i) => {
      const slot = sortedTheir[i];
      const champId = slot ? keyToId(slot.championId) : null;
      return { role, id: champId };
    });

    const newBlueBans = state.myTeamBans.map(keyToId).filter(Boolean) as string[];
    const newRedBans = state.theirTeamBans.map(keyToId).filter(Boolean) as string[];

    setBlueRoster(newBlue);
    setRedRoster(newRed);
    setBlueBans(newBlueBans);
    setRedBans(newRedBans);
  }, [ddr]);

  const syncLcu = useCallback(async () => {
    try {
      const state = await invoke<LcuChampSelectState>("get_lcu_champ_select");
      applyLcuState(state);
      setLcuStatus("active");
      setLcuError(null);
    } catch (e) {
      const msg = String(e);
      setLcuError(msg.includes("not running") ? "Client not running" : msg.includes("Not in") ? "Not in champion select" : msg);
      setLcuStatus("error");
    }
  }, [applyLcuState]);

  const startLcuPolling = useCallback(() => {
    if (lcuPollRef.current) return;
    setLcuStatus("polling");
    syncLcu();
    lcuPollRef.current = setInterval(syncLcu, 3000);
  }, [syncLcu]);

  const stopLcuPolling = useCallback(() => {
    if (lcuPollRef.current) {
      clearInterval(lcuPollRef.current);
      lcuPollRef.current = null;
    }
    setLcuStatus("idle");
    setLcuError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (lcuPollRef.current) clearInterval(lcuPollRef.current); }, []);

  const handleAnalyze = useCallback(async () => {
    const blue = blueRoster.filter(p => p.id).map(p => p.id!);
    const red = redRoster.filter(p => p.id).map(p => p.id!);
    if (blue.length < 1 && red.length < 1) return;
    setAnalyzing(true);
    try {
      const result = await analyzeDraft({ blue_team: blue, red_team: red });
      setAnalysis(result);
    } catch {
      // keep last analysis or null
    } finally {
      setAnalyzing(false);
    }
  }, [blueRoster, redRoster]);

  // Auto-analyze when teams change (debounced)
  useEffect(() => {
    const blue = blueRoster.filter(p => p.id);
    const red = redRoster.filter(p => p.id);
    if (blue.length === 0 && red.length === 0) return;
    const t = setTimeout(handleAnalyze, 800);
    return () => clearTimeout(t);
  }, [blueRoster, redRoster]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load counter recommendations for the active slot's role
  useEffect(() => {
    const enemySlot = (activeSlot.team === "blue" ? redRoster : blueRoster)[activeSlot.index];
    if (!enemySlot?.id) {
      setRecommendations([]);
      return;
    }
    getCounters(enemySlot.id)
      .then(res => {
        const counters: MatchupEntry[] = res.strong_vs ?? [];
        setRecommendations(
          counters.slice(0, 3).map((c) => ({
            id: c.champion_id,
            score: Math.round(c.win_rate * 100),
            why: `${Math.round(c.win_rate * 100)}% WR vs ${enemySlot.id} (${c.games} games)`,
          }))
        );
      })
      .catch(() => setRecommendations([]));
  }, [activeSlot, redRoster, blueRoster]); // eslint-disable-line react-hooks/exhaustive-deps

  const blueWr = analysis ? Math.round(analysis.blue_win_rate * 100) : 50;
  const redWr = analysis ? Math.round(analysis.red_win_rate * 100) : 50;
  const confidence = analysis ? analysis.confidence.toFixed(2) : "—";

  const FILTERS = ["ALL", "MAGE", "ASSASSIN", "FIGHTER", "TANK", "SUPPORT", "MARKSMAN"];

  return (
    <div className="content fade-up" style={{ paddingBottom: 16 }}>
      {/* Mode bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <span className="t-eyebrow">BAN MODE:</span>
        <button
          className={`btn btn-sm ${banMode === "blue" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setBanMode(banMode === "blue" ? null : "blue")}
        >
          BLUE BANS {blueBans.length}/5
        </button>
        <button
          className={`btn btn-sm ${banMode === "red" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setBanMode(banMode === "red" ? null : "red")}
        >
          RED BANS {redBans.length}/5
        </button>
        {banMode && (
          <span className="tag" style={{ background: banMode === "blue" ? "var(--cyan)" : "var(--red)", color: "#fff" }}>
            Banning for {banMode.toUpperCase()} team — click a champion
          </span>
        )}
        <div style={{ flex: 1 }} />
        {lcuStatus === "polling" || lcuStatus === "active" ? (
          <button className="btn btn-sm" style={{ background: "var(--green-soft)", color: "var(--green)", border: "1px solid var(--green)" }} onClick={stopLcuPolling}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--green)", marginRight: 4 }} />
            Live · Disconnect
          </button>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={startLcuPolling} title="Auto-fill from League Client">
            <Icon name="draft" size={12} /> Sync from Client
          </button>
        )}
        {lcuError && <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{lcuError}</span>}
        <button className="btn btn-ghost btn-sm" onClick={() => { setBlueRoster(emptyRoster()); setRedRoster(emptyRoster()); setBlueBans([]); setRedBans([]); setAnalysis(null); stopLcuPolling(); }}>
          <Icon name="swap" size={12} /> Reset
        </button>
      </div>

      <div className="draft-grid">
        {/* BLUE TEAM */}
        <div className="draft-team blue">
          <div className="draft-team-header">
            <div className="draft-team-name">Blue · Your team</div>
            <span className="tag cyan">{blueRoster.filter(s => s.id).length}/5</span>
          </div>
          {blueRoster.map((slot, i) => {
            const isActive = activeSlot.team === "blue" && activeSlot.index === i && !banMode;
            const recIdx = recommendations.findIndex(r => r.id === slot.id);
            return (
              <DraftSlot
                key={i}
                slot={slot}
                isActive={isActive}
                recRank={recIdx >= 0 ? recIdx : undefined}
                onClick={() => { setBanMode(null); setActiveSlot({ team: "blue", index: i }); }}
                onClear={() => clearSlot("blue", i)}
              />
            );
          })}
          <div className="t-eyebrow" style={{ marginTop: 6 }}>BLUE BANS</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {blueBans.map(id => (
              <div key={id} style={{ position: "relative", cursor: "pointer" }} onClick={() => setBlueBans(prev => prev.filter(b => b !== id))}>
                <Champ id={id} size="sm" className="banned-look" />
              </div>
            ))}
            {blueBans.length < 5 && <div className="champ sm" style={{ background: "var(--bg-3)", border: "1px dashed var(--line-3)", cursor: "pointer" }} onClick={() => setBanMode("blue")}><span style={{ fontSize: 9 }}>+</span></div>}
          </div>
        </div>

        {/* CENTER */}
        <div className="draft-center">
          <div className="draft-prediction-card tactical">
            <div className="draft-prediction-label">Win probability</div>
            <div className="draft-prediction-value">{blueWr}<span className="pct">%</span></div>
            <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", marginTop: 8, marginBottom: 8 }}>
              <div style={{ flex: blueWr, background: "var(--cyan)" }} />
              <div style={{ flex: redWr, background: "var(--red)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--fg-3)" }}>
              <div><div style={{ fontSize: 16, color: "var(--cyan)", fontWeight: 700 }}>{blueWr}%</div><div style={{ letterSpacing: "0.10em" }}>BLUE</div></div>
              <div><div style={{ fontSize: 16, color: "var(--fg-1)", fontWeight: 700 }}>{confidence}</div><div style={{ letterSpacing: "0.10em" }}>CONF</div></div>
              <div><div style={{ fontSize: 16, color: "var(--red)", fontWeight: 700 }}>{redWr}%</div><div style={{ letterSpacing: "0.10em" }}>RED</div></div>
            </div>
            {analyzing && <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", marginTop: 6, textAlign: "center" }}>Analyzing…</div>}
          </div>

          {/* Pick recommendations */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><span className="panel-title-dot" /> Suggested · {activeRoster[activeSlot.index]?.role}</div>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recommendations.length === 0 ? (
                <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                  {redRoster[activeSlot.index]?.id
                    ? "Loading counters…"
                    : "Lock enemy picks to see suggestions"}
                </div>
              ) : (
                recommendations.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      display: "grid", gridTemplateColumns: "20px 40px 1fr 50px", gap: 10, alignItems: "center",
                      padding: 8, background: "var(--bg-3)", borderRadius: 6,
                      border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--line-1)", cursor: "pointer",
                    }}
                    onClick={() => pickChampion(r.id)}
                  >
                    <span className="t-display" style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? "var(--accent)" : "var(--fg-3)" }}>{i + 1}</span>
                    <Champ id={r.id} withTooltip />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{r.id}</div>
                      <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.why}</div>
                    </div>
                    <div className="t-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", textAlign: "right" }}>{r.score}%</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RED TEAM */}
        <div className="draft-team red">
          <div className="draft-team-header">
            <div className="draft-team-name">Red · Enemy</div>
            <span className="tag loss">{redRoster.filter(s => s.id).length}/5</span>
          </div>
          {redRoster.map((slot, i) => {
            const isActive = activeSlot.team === "red" && activeSlot.index === i && !banMode;
            return (
              <DraftSlot
                key={i}
                slot={slot}
                isActive={isActive}
                isEnemy
                onClick={() => { setBanMode(null); setActiveSlot({ team: "red", index: i }); }}
                onClear={() => clearSlot("red", i)}
              />
            );
          })}
          <div className="t-eyebrow" style={{ marginTop: 6 }}>RED BANS</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {redBans.map(id => (
              <div key={id} style={{ position: "relative", cursor: "pointer" }} onClick={() => setRedBans(prev => prev.filter(b => b !== id))}>
                <Champ id={id} size="sm" className="banned-look" />
              </div>
            ))}
            {redBans.length < 5 && <div className="champ sm" style={{ background: "var(--bg-3)", border: "1px dashed var(--line-3)", cursor: "pointer" }} onClick={() => setBanMode("red")}><span style={{ fontSize: 9 }}>+</span></div>}
          </div>
        </div>
      </div>

      {/* Champion picker */}
      <div className="panel" style={{ marginTop: 14 }}>
        <div className="panel-header">
          <div className="panel-title">
            <span className="panel-title-dot" />
            {banMode ? `Banning for ${banMode.toUpperCase()} team` : `Picking for ${activeSlot.team.toUpperCase()} · ${activeRoster[activeSlot.index]?.role}`}
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-3)", border: "1px solid var(--line-1)", borderRadius: 6, padding: "3px 8px" }}>
              <Icon name="search" size={12} />
              <input
                value={champSearch}
                onChange={e => setChampSearch(e.target.value)}
                placeholder="Filter…"
                style={{ background: "none", border: "none", outline: "none", fontSize: 11, width: 80, color: "var(--fg-0)" }}
              />
            </div>
            {FILTERS.map((f) => (
              <button
                key={f}
                className="seg-item"
                style={champFilter === f ? { background: "var(--accent-soft)", color: "var(--accent)" } : {}}
                onClick={() => setChampFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body">
          <div className="picker-grid">
            {filteredChamps.map(id => {
              const isBanned = allBanned.includes(id);
              const isPicked = allPicked.includes(id);
              const isDisabled = isBanned || isPicked;
              const recRank = recommendations.findIndex(r => r.id === id);
              return (
                <div
                  key={id}
                  className={`picker-item ${isDisabled ? "banned" : ""} ${recRank === 0 ? "recommended" : ""}`}
                  onClick={() => !isDisabled && pickChampion(id)}
                  title={id}
                >
                  <Champ id={id} />
                  {recRank >= 0 && !isDisabled && (
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
