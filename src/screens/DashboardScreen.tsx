import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Champ } from "../components/Champ";
import { StatTile, Sparkline, Donut, KDARatio } from "../components/Primitives";
import { SPARK_DATA } from "../data/mockData";
import { listMatches, formatDuration, formatRelativeTime, type MatchListItem } from "../api/matches";
import { getProfile, type PlayerProfile } from "../api/player";
import { getPatchDeltas, type PatchDelta } from "../api/champions";
import { useAuthStore } from "../store/authStore";
import { WipBanner, WipTag } from "../components/Wip";

type Screen = "dashboard" | "profile" | "matchDetail" | "draft" | "builds" | "macro" | "overlay" | "settings";

interface Props {
  onNavigate: (s: Screen) => void;
  onSelectMatch: (id: string) => void;
}

export function DashboardScreen({ onNavigate, onSelectMatch }: Props) {
  const storeProfile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const [profile, setLocalProfile] = useState<PlayerProfile | null>(storeProfile);
  const [recent, setRecent] = useState<MatchListItem[]>([]);
  const [deltas, setDeltas] = useState<PatchDelta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProfile().then(p => { setLocalProfile(p); setProfile(p); }),
      listMatches({ limit: 4 }).then(setRecent),
      getPatchDeltas().then(d => setDeltas(d.slice(0, 4))),
    ]).finally(() => setLoading(false));
  }, [setProfile]);

  const wins = recent.filter(m => m.result).length;
  const rank = profile?.rank;
  const rankLabel = rank ? `${rank.tier} ${rank.division}` : '—';
  const lpLabel = rank ? `${rank.lp} LP` : '';

  return (
    <div className="content fade-up">
      {/* Hero row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Briefing hero */}
        <div className="panel tactical" style={{ padding: 0 }}>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="t-eyebrow" style={{ marginBottom: 6 }}>Vadem // Briefing</div>
                <div className="t-display" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Welcome back, <span className="accent">{profile?.game_name ?? '—'}</span>
                </div>
                <div style={{ color: "var(--fg-2)", fontSize: 13, marginTop: 4 }}>
                  {wins > 0
                    ? <span>You're on a <strong className="green">{wins}-game win streak</strong>. Conditions look favorable.</span>
                    : <span>Ready to climb? Let's review your recent games.</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => onNavigate("draft")}>
                  <Icon name="draft" size={14} /> Open draft tool
                </button>
              </div>
            </div>

            <WipBanner label="Avg KDA, CS/min and Vision score stats coming soon — needs aggregation pipeline" />
            <div className="grid-4">
              <StatTile label="Win rate · 14d" value={loading ? "…" : `${recent.length > 0 ? Math.round(wins / recent.length * 100) : 0}`} suffix="%" />
              <StatTile label="Avg KDA" value="—" />
              <StatTile label="CS / min" value="—" />
              <StatTile label="Vision score" value="—" />
            </div>
          </div>
        </div>

        {/* Rank card */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" /> Ranked snapshot
            </div>
            <button className="panel-action" onClick={() => onNavigate("profile")}>DETAILS →</button>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 12, background: "var(--accent)",
                display: "grid", placeItems: "center", flexShrink: 0,
              }}>
                <div style={{ width: 64, height: 64, borderRadius: 8, background: "var(--bg-2)", display: "grid", placeItems: "center" }}>
                  <Icon name="trophy" size={28} />
                </div>
              </div>
              <div>
                <div className="t-display" style={{ fontSize: 22, fontWeight: 600 }}>
                  {loading ? '…' : rankLabel}
                </div>
                <div className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                  {lpLabel}
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.10em" }}>
                  LP PROGRESS
                </span>
                <span className="t-mono" style={{ fontSize: 11 }}>{rank?.lp ?? 0} / 100</span>
              </div>
              <div className="bar"><div className="bar-fill" style={{ width: `${rank?.lp ?? 0}%` }} /></div>
            </div>

            <div className="divider" style={{ margin: 0 }} />

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div className="t-eyebrow">Last 30 days · Winrate trend</div>
                <WipTag />
              </div>
              <Sparkline data={SPARK_DATA} />
            </div>
          </div>
        </div>
      </div>

      {/* Three-col row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Today's session */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: "var(--green)", boxShadow: "0 0 6px var(--green-soft)" }} />
              Recent · {recent.length} games
            </div>
            <button className="panel-action" onClick={() => onNavigate("profile")}>VIEW ALL →</button>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {loading ? (
              <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>Loading…</div>
            ) : (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Donut value={recent.length > 0 ? Math.round(wins / recent.length * 100) : 0} size={60} stroke={6} label="W RATE" />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
                    {wins}W · {recent.length - wins}L
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {recent.map(m => (
                      <div key={m.id} style={{
                        flex: 1, height: 24, borderRadius: 3,
                        background: m.result ? "var(--green-soft)" : "var(--red-soft)",
                        borderLeft: `3px solid ${m.result ? "var(--green)" : "var(--red)"}`,
                        display: "grid", placeItems: "center",
                        fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 700,
                        color: m.result ? "var(--green)" : "var(--red)",
                      }}>
                        {m.result ? "W" : "L"}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Champion focus — shows most-played from recent matches */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: "var(--cyan)" }} /> Champion focus
            </div>
          </div>
          <div className="panel-body">
            {recent[0] ? (
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <Champ id={recent[0].champion_id.toLowerCase()} size="xl" />
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div className="t-display" style={{ fontSize: 18, fontWeight: 600 }}>{recent[0].champion_id}</div>
                  <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{recent[0].role}</div>
                </div>
              </div>
            ) : (
              <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>No recent games</div>
            )}
          </div>
        </div>

        {/* Patch deltas */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: "var(--amber)" }} /> Patch deltas
            </div>
            <span className="tag amber">LIVE</span>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {loading || deltas.length === 0 ? (
              <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{loading ? 'Loading…' : 'No data'}</div>
            ) : (
              deltas.map(c => (
                <div key={c.champion_id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Champ id={c.champion_id.toLowerCase()} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{c.champion_id}</div>
                    <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.notes}
                    </div>
                  </div>
                  <span className={`t-mono ${c.wr_delta > 0 ? "green" : "red"}`} style={{ fontSize: 12, fontWeight: 600 }}>
                    {c.wr_delta > 0 ? "+" : ""}{c.wr_delta.toFixed(1)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent matches */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Recent matches</div>
          <button className="panel-action" onClick={() => onNavigate("profile")}>HISTORY →</button>
        </div>
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>No matches found. Click sync in Profile to import matches.</div>
          ) : (
            recent.map(m => (
              <div
                key={m.id}
                className={`match-row ${m.result ? "win" : "loss"}`}
                onClick={() => { onSelectMatch(m.match_id); onNavigate("profile"); }}
              >
                <div />
                <div className="match-result">
                  <span className={`match-result-label ${m.result ? "win" : "loss"}`}>{m.result ? "WIN" : "LOSS"}</span>
                  <span className="match-result-time">{formatDuration(m.duration_secs)}</span>
                </div>
                <div className="match-champ-info">
                  <Champ id={m.champion_id.toLowerCase()} withTooltip />
                  <div className="match-champ-info-text">
                    <span className="match-champ-info-name">{m.champion_id}</span>
                    <span className="match-champ-info-meta">{m.role} · {m.queue_name} · {formatRelativeTime(m.played_at)}</span>
                  </div>
                </div>
                <div className="match-team" />
                <KDARatio k={m.kills} d={m.deaths} a={m.assists} />
                <div className="match-prediction">
                  <div className="match-prediction-bar">
                    <div className="match-prediction-fill" style={{ width: `${m.result ? 60 : 40}%` }} />
                  </div>
                </div>
                <Icon name="chevron-right" size={14} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
