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
  return (
    <div
      className={`draft-pick-slot ${!slot.id ? "empty" : ""} ${isActive ? "active" : ""}`}
      onClick={onClick}
      style={{ position: "relative" }}
    >
      <span className="draft-pick-role">{slot.role}</span>
      {slot.id ? (
        <Champ id={slot.id} size="lg" withTooltip />
      ) : (
        <div className="champ lg no-bg" style={{ background: "var(--bg-2)", border: "1px dashed var(--line-3)", color: "var(--fg-3)" }}>
          <span style={{ fontSize: 10, fontWeight: 500 }}>?</span>
        </div>
      )}
      <div className="draft-pick-info">
        <span className="draft-pick-name">
          {slot.id ? slot.id : isEnemy ? "Enemy pick" : "Your pick"}
        </span>
        <span className="draft-pick-meta">
          {slot.id ? slot.role : "Awaiting"}
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
  const [activeSlot, setActiveSlot] = useState<{ team: "blue" | "red"; index: number }>({ team: "blue", index: 0 });
  const [analysis, setAnalysis] = useState<DraftAnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<{ id: string; score: number; why: string }[]>([]);
  const [lcuStatus, setLcuStatus] = useState<"connecting" | "waiting" | "active" | "error">("connecting");
  const [lcuError, setLcuError] = useState<string | null>(null);
  const lcuPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyLcuState = useCallback((state: LcuChampSelectState) => {
    if (!ddr) return;
    const keyToId = (key: number): string | null => {
      if (key <= 0) return null;
      return ddr.champByKey[String(key)] ?? null;
    };

    const posOrder: Record<string, number> = { TOP: 0, JUNGLE: 1, MIDDLE: 2, BOTTOM: 3, UTILITY: 4, "": 0 };
    const sortedMy = [...state.myTeam].sort((a, b) => (posOrder[a.position.toUpperCase()] ?? 0) - (posOrder[b.position.toUpperCase()] ?? 0));
    const sortedTheir = [...state.theirTeam].sort((a, b) => (posOrder[a.position.toUpperCase()] ?? 0) - (posOrder[b.position.toUpperCase()] ?? 0));

    setBlueRoster(ROLES.map((role, i) => ({ role, id: sortedMy[i] ? keyToId(sortedMy[i].championId) : null })));
    setRedRoster(ROLES.map((role, i) => ({ role, id: sortedTheir[i] ? keyToId(sortedTheir[i].championId) : null })));
    setBlueBans(state.myTeamBans.map(keyToId).filter(Boolean) as string[]);
    setRedBans(state.theirTeamBans.map(keyToId).filter(Boolean) as string[]);
    setLcuStatus("active");
    setLcuError(null);
  }, [ddr]);

  const syncLcu = useCallback(async () => {
    try {
      const state = await invoke<LcuChampSelectState>("get_lcu_champ_select");
      applyLcuState(state);
    } catch (e) {
      const msg = String(e);
      if (msg.includes("not running")) {
        setLcuStatus("error");
        setLcuError("League Client not running");
      } else if (msg.includes("Not in")) {
        setLcuStatus("waiting");
        setLcuError(null);
      } else {
        setLcuStatus("waiting");
        setLcuError(null);
      }
    }
  }, [applyLcuState]);

  // Auto-start polling on mount
  useEffect(() => {
    syncLcu();
    lcuPollRef.current = setInterval(syncLcu, 3000);
    return () => {
      if (lcuPollRef.current) clearInterval(lcuPollRef.current);
    };
  }, [syncLcu]);

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
  const activeRoster = activeSlot.team === "blue" ? blueRoster : redRoster;
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
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--yellow, #d97706)" }} />
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
        <div style={{ flex: 1 }} />
        <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>Auto-sync every 3s</span>
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
              const isActive = activeSlot.team === "blue" && activeSlot.index === i;
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
                <div className="panel-title"><span className="panel-title-dot" /> Suggested · {activeRoster[activeSlot.index]?.role}</div>
              </div>
              <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recommendations.length === 0 ? (
                  <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                    {redRoster[activeSlot.index]?.id
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
              const isActive = activeSlot.team === "red" && activeSlot.index === i;
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
