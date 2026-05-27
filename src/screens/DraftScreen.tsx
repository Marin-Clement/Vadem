import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Champ } from "../components/Champ";
import { Icon } from "../components/Icon";
import { useDDragon } from "../utils/ddragon";
import { analyzeDraft, type DraftAnalysisResponse } from "../api/draft";
import { getCounters, type MatchupEntry } from "../api/builds";

interface LcuTeamSlot {
  championId: number;
  championPickIntent: number;
  position: string;
  isMe: boolean;
  summonerId: number;
  cellId: number;
}

interface LcuChampSelectState {
  myTeam: LcuTeamSlot[];
  theirTeam: LcuTeamSlot[];
  myTeamBans: number[];
  theirTeamBans: number[];
  phase: string;
  localPlayerCellId: number;
}

const ROLES = ["TOP", "JNG", "MID", "BOT", "SUP"] as const;
type Role = typeof ROLES[number];

interface Slot {
  role: Role;
  id: string | null;
  isHover: boolean;
  isMe: boolean;
}

function emptyRoster(): Slot[] {
  return ROLES.map(role => ({ role, id: null, isHover: false, isMe: false }));
}

function DraftSlot({
  slot,
  isActive,
  isEnemy,
  recRank,
  onClick,
}: {
  slot: Slot;
  isActive: boolean;
  isEnemy?: boolean;
  recRank?: number;
  onClick: () => void;
}) {
  const isEmpty = !slot.id;
  const isHover = slot.isHover;

  return (
    <div
      className={`draft-pick-slot ${isEmpty ? "empty" : ""} ${isActive ? "active" : ""}`}
      onClick={onClick}
      style={{
        position: "relative",
        opacity: isHover ? 0.65 : 1,
        borderLeft: slot.isMe ? "3px solid var(--accent)" : undefined,
      }}
    >
      <span className="draft-pick-role">{slot.role}</span>
      {slot.id ? (
        <div style={{ position: "relative" }}>
          <Champ id={slot.id} size="lg" withTooltip />
          {isHover && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: 6,
              border: "2px dashed var(--fg-3)",
              pointerEvents: "none",
            }} />
          )}
        </div>
      ) : (
        <div className="champ lg no-bg" style={{ background: "var(--bg-2)", border: "1px dashed var(--line-3)", color: "var(--fg-3)" }}>
          <span style={{ fontSize: 10, fontWeight: 500 }}>?</span>
        </div>
      )}
      <div className="draft-pick-info">
        <span className="draft-pick-name" style={{ color: isHover ? "var(--fg-3)" : undefined }}>
          {slot.id
            ? (isHover ? `${slot.id}…` : slot.id)
            : isEnemy ? "Enemy pick" : "Your pick"}
        </span>
        <span className="draft-pick-meta">
          {slot.id ? (isHover ? "Hovering" : slot.role) : "Awaiting"}
        </span>
      </div>
      {recRank != null && !isHover && (
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
  const [activeSlot, setActiveSlot] = useState<{ team: "blue" | "red"; index: number } | null>(null);
  const [analysis, setAnalysis] = useState<DraftAnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<{ id: string; score: number; why: string }[]>([]);
  const [lcuStatus, setLcuStatus] = useState<"connecting" | "waiting" | "active" | "error">("connecting");
  const [lcuError, setLcuError] = useState<string | null>(null);

  const applyLcuState = useCallback((state: LcuChampSelectState) => {
    if (!ddr) return;

    const keyToId = (key: number): string | null => {
      if (key <= 0) return null;
      return ddr.champByKey[String(key)] ?? null;
    };

    // LCU position strings → our role labels
    const POS_TO_ROLE: Record<string, Role> = {
      TOP:     "TOP",
      JUNGLE:  "JNG",
      MIDDLE:  "MID",
      BOTTOM:  "BOT",
      UTILITY: "SUP",
    };

    const toSlot = (m: LcuTeamSlot, role: Role): Slot => {
      const locked = keyToId(m.championId);
      const intent = keyToId(m.championPickIntent);
      return { role, id: locked ?? intent, isHover: !locked && !!intent, isMe: m.isMe };
    };

    const buildRoster = (members: LcuTeamSlot[]): Slot[] => {
      const placed = new Set<number>();
      const byRole: Partial<Record<Role, LcuTeamSlot>> = {};
      for (const m of members) {
        const role = POS_TO_ROLE[m.position.toUpperCase()];
        if (role) { byRole[role] = m; placed.add(m.cellId); }
      }
      const unplaced = [...members]
        .filter(m => !placed.has(m.cellId))
        .sort((a, b) => a.cellId - b.cellId);
      let ui = 0;
      return ROLES.map(role => {
        if (byRole[role]) return toSlot(byRole[role]!, role);
        if (ui < unplaced.length) return toSlot(unplaced[ui++], role);
        return { role, id: null, isHover: false, isMe: false };
      });
    };

    const newBlue = buildRoster(state.myTeam);
    setBlueRoster(newBlue);
    setRedRoster(buildRoster(state.theirTeam));
    setBlueBans(state.myTeamBans.map(keyToId).filter(Boolean) as string[]);
    setRedBans(state.theirTeamBans.map(keyToId).filter(Boolean) as string[]);
    setLcuStatus("active");
    setLcuError(null);
    // Auto-focus local player's slot (only if user hasn't clicked a slot yet)
    const myIdx = newBlue.findIndex(s => s.isMe);
    if (myIdx >= 0) setActiveSlot(prev => prev ?? { team: "blue", index: myIdx });
  }, [ddr]);

  const syncLcu = useCallback(async () => {
    try {
      const state = await invoke<LcuChampSelectState>("get_lcu_champ_select");
      applyLcuState(state);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("not running") || msg.includes("lockfile not found")) {
        setLcuStatus("error");
        setLcuError("League Client not running");
      } else if (msg.includes("Not in champion select")) {
        setLcuStatus("waiting");
        setLcuError(null);
      } else if (msg.includes("parse error")) {
        setLcuStatus("error");
        setLcuError(`Parse error: ${msg}`);
      } else {
        setLcuStatus("waiting");
        setLcuError(null);
      }
    }
  }, [applyLcuState]);

  useEffect(() => {
    syncLcu();
  }, [syncLcu]);

  // Real-time WebSocket events from the Rust LCU service
  useEffect(() => {
    const unlistenUpdate = listen<LcuChampSelectState>("lcu_champ_select_update", (e) => {
      applyLcuState(e.payload);
    });
    const unlistenEnd = listen("lcu_champ_select_end", () => {
      setLcuStatus("waiting");
      setBlueRoster(emptyRoster());
      setRedRoster(emptyRoster());
      setBlueBans([]);
      setRedBans([]);
    });
    return () => {
      unlistenUpdate.then((f) => f());
      unlistenEnd.then((f) => f());
    };
  }, [applyLcuState]);

  const handleAnalyze = useCallback(async () => {
    const blue = blueRoster.filter(p => p.id).map(p => p.id!);
    const red = redRoster.filter(p => p.id).map(p => p.id!);
    if (blue.length < 1 && red.length < 1) return;
    setAnalyzing(true);
    try {
      const result = await analyzeDraft({ blue_team: blue, red_team: red });
      setAnalysis(result);
    } catch {
      // keep last analysis
    } finally {
      setAnalyzing(false);
    }
  }, [blueRoster, redRoster]);

  useEffect(() => {
    const blue = blueRoster.filter(p => p.id);
    const red = redRoster.filter(p => p.id);
    if (blue.length === 0 && red.length === 0) return;
    const t = setTimeout(handleAnalyze, 800);
    return () => clearTimeout(t);
  }, [blueRoster, redRoster]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeSlot) { setRecommendations([]); return; }
    const enemySlot = (activeSlot.team === "blue" ? redRoster : blueRoster)[activeSlot.index];
    if (!enemySlot?.id) { setRecommendations([]); return; }
    getCounters(enemySlot.id)
      .then(res => {
        const counters: MatchupEntry[] = res.strong_vs ?? [];
        setRecommendations(
          counters.slice(0, 3).map(c => ({
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
  const activeRoster = activeSlot?.team === "blue" ? blueRoster : redRoster;
  const hasData = lcuStatus === "active";

  return (
    <div className="content fade-up" style={{ paddingBottom: 16 }}>
      {/* Status bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {lcuStatus === "active" && (
            <>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
              <span className="t-mono" style={{ fontSize: 11, color: "var(--green)" }}>CHAMPION SELECT · LIVE</span>
            </>
          )}
          {lcuStatus === "waiting" && (
            <>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--fg-3)" }} />
              <span className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>Waiting for champion select…</span>
            </>
          )}
          {lcuStatus === "connecting" && (
            <>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--amber)" }} />
              <span className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>Connecting to League Client…</span>
            </>
          )}
          {lcuStatus === "error" && (
            <>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--red)" }} />
              <span className="t-mono" style={{ fontSize: 11, color: "var(--red)" }}>{lcuError ?? "League Client not running"}</span>
            </>
          )}
        </div>
      </div>

      {/* Waiting overlay */}
      {!hasData && (
        <div style={{
          position: "relative", minHeight: 280, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
          background: "var(--bg-1)", border: "1px dashed var(--line-2)", borderRadius: 12, padding: 40,
        }}>
          <Icon name="draft" size={32} />
          <div className="t-display" style={{ fontSize: 18, fontWeight: 600, color: "var(--fg-2)" }}>
            {lcuStatus === "error" ? "League Client not detected" : "Waiting for champion select"}
          </div>
          <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)", textAlign: "center" }}>
            {lcuStatus === "error"
              ? "Start the League of Legends client and enter champion select to use this screen."
              : "Enter champion select in the League client — the draft will populate automatically."}
          </div>
        </div>
      )}

      {/* Draft board */}
      {hasData && (
        <div className="draft-grid">
          {/* BLUE TEAM */}
          <div className="draft-team blue">
            <div className="draft-team-header">
              <div className="draft-team-name">Blue · Your team</div>
              <span className="tag cyan">{blueRoster.filter(s => s.id).length}/5</span>
            </div>
            {blueRoster.map((slot, i) => {
              const isActive = activeSlot?.team === "blue" && activeSlot.index === i;
              const recIdx = recommendations.findIndex(r => r.id === slot.id);
              return (
                <DraftSlot
                  key={i}
                  slot={slot}
                  isActive={isActive}
                  recRank={recIdx >= 0 ? recIdx : undefined}
                  onClick={() => setActiveSlot({ team: "blue", index: i })}
                />
              );
            })}
            {blueBans.length > 0 && (
              <>
                <div className="t-eyebrow" style={{ marginTop: 6 }}>BANS</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {blueBans.map(id => <Champ key={id} id={id} size="sm" className="banned-look" />)}
                </div>
              </>
            )}
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

            <div className="panel">
              <div className="panel-header">
                <div className="panel-title"><span className="panel-title-dot" /> Suggested · {activeSlot ? activeRoster[activeSlot.index]?.role : "—"}</div>
              </div>
              <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendations.length === 0 ? (
                  <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                    {activeSlot && redRoster[activeSlot.index]?.id
                      ? "Loading counters…"
                      : "Select a slot — when enemy is picked, counters appear"}
                  </div>
                ) : (
                  recommendations.map((r, i) => (
                    <div
                      key={r.id}
                      style={{
                        display: "grid", gridTemplateColumns: "20px 40px 1fr 50px", gap: 10, alignItems: "center",
                        padding: 8, background: "var(--bg-3)", borderRadius: 6,
                        border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--line-1)",
                      }}
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
              const isActive = activeSlot?.team === "red" && activeSlot.index === i;
              return (
                <DraftSlot
                  key={i}
                  slot={slot}
                  isActive={isActive}
                  isEnemy
                  onClick={() => setActiveSlot({ team: "red", index: i })}
                />
              );
            })}
            {redBans.length > 0 && (
              <>
                <div className="t-eyebrow" style={{ marginTop: 6 }}>BANS</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {redBans.map(id => <Champ key={id} id={id} size="sm" className="banned-look" />)}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
