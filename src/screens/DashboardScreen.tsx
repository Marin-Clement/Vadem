import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Champ } from "../components/Champ";
import { StatTile, Donut, KDARatio } from "../components/Primitives";
import { listMatches, formatDuration, formatRelativeTime, type MatchListItem } from "../api/matches";
import { getProfile, getSummary, type PlayerProfile, type PlayerSummary } from "../api/player";
import { getPatchDeltas, type PatchDelta } from "../api/champions";
import { useAuthStore } from "../store/authStore";

type Screen = "dashboard" | "profile" | "matchDetail" | "draft" | "builds" | "macro" | "overlay" | "settings";

const TIER_COLOR: Record<string, string> = {
  IRON: "#6b7280", BRONZE: "#92400e", SILVER: "#9ca3af",
  GOLD: "#d97706", PLATINUM: "#0d9488", EMERALD: "#059669",
  DIAMOND: "#6366f1", MASTER: "#9333ea", GRANDMASTER: "#dc2626",
  CHALLENGER: "#f59e0b",
};

function RankBadge({ tier }: { tier: string }) {
  const color = TIER_COLOR[tier.toUpperCase()] ?? "var(--accent)";
  return (
    <div style={{
      width: 80, height: 80, borderRadius: 12, background: color + "22",
      border: `2px solid ${color}40`, display: "grid", placeItems: "center", flexShrink: 0,
    }}>
      <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.02em" }}>
        {tier.slice(0, 1)}
      </div>
    </div>
  );
}

function TeamMini({ champs }: { champs: string[] }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {champs.slice(0, 5).map((id, i) => (
        <Champ key={i} id={id.toLowerCase()} size="xs" withTooltip />
      ))}
    </div>
  );
}

interface Props {
  onNavigate: (s: Screen, extra?: { championId?: string }) => void;
  onSelectMatch: (id: string) => void;
}

export function DashboardScreen({ onNavigate, onSelectMatch }: Props) {
  const storeProfile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const [profile, setLocalProfile] = useState<PlayerProfile | null>(storeProfile);
  const [summary, setSummary] = useState<PlayerSummary | null>(null);
  const [recent, setRecent] = useState<MatchListItem[]>([]);
  const [deltas, setDeltas] = useState<PatchDelta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProfile().then(p => { setLocalProfile(p); setProfile(p); }),
      getSummary().then(setSummary).catch(() => null),
      listMatches({ limit: 5 }).then(setRecent),
      getPatchDeltas().then(d => setDeltas(d.slice(0, 4))),
    ]).finally(() => setLoading(false));
  }, [setProfile]);

  const rank = profile?.rank;
  const rankLabel = rank ? `${rank.tier} ${rank.division}` : '—';

  // Use backend summary for aggregated stats; fall back to client calc from recent matches
  const avgKDA = summary
    ? summary.avg_deaths === 0
      ? ((summary.avg_kills + summary.avg_assists)).toFixed(2)
      : ((summary.avg_kills + summary.avg_assists) / summary.avg_deaths).toFixed(2)
    : "—";
  const avgCSMin = summary ? summary.avg_cs_per_min.toFixed(1) : "—";
  const avgVision = summary ? Math.round(summary.avg_vision_score).toString() : "—";
  const winRate = summary
    ? Math.round(summary.win_rate * 100)
    : recent.length > 0 ? Math.round(recent.filter(m => m.result).length / recent.length * 100) : 0;

  const streakCount = summary?.streak ?? 0;
  const streakWin = recent[0]?.result ?? false;

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
                  {streakCount >= 2
                    ? <span>You're on a <strong className={streakWin ? "green" : "red"}>{streakCount}-game {streakWin ? "win" : "loss"} streak</strong>. {streakWin ? "Conditions look favorable." : "Time to review your games."}</span>
                    : <span>Ready to climb? Let's review your recent games.</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => onNavigate("draft")}>
                  <Icon name="draft" size={14} /> Open draft tool
                </button>
              </div>
            </div>

            <div className="grid-4">
              <StatTile label="Win rate · 30d" value={loading ? "…" : `${winRate}`} suffix="%" />
              <StatTile label="Avg KDA" value={loading ? "…" : avgKDA} />
              <StatTile label="CS / min" value={loading ? "…" : avgCSMin} />
              <StatTile label="Avg vision" value={loading ? "…" : avgVision} />
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
              {rank ? <RankBadge tier={rank.tier} /> : (
                <div style={{ width: 80, height: 80, borderRadius: 12, background: "var(--bg-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name="trophy" size={28} />
                </div>
              )}
              <div>
                <div className="t-display" style={{ fontSize: 22, fontWeight: 600 }}>
                  {loading ? '…' : rankLabel}
                </div>
                {rank && (
                  <div className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>
                    {rank.lp} LP · {rank.wins}W {rank.losses}L
                  </div>
                )}
              </div>
            </div>

            {rank && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.10em" }}>LP PROGRESS</span>
                  <span className="t-mono" style={{ fontSize: 11 }}>{rank.lp} / 100</span>
                </div>
                <div className="bar">
                  <div className="bar-fill" style={{
                    width: `${rank.lp}%`,
                    background: TIER_COLOR[rank.tier.toUpperCase()] ?? "var(--accent)",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--green)" }}>
                    {rank.wins}W
                  </span>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
                    {rank.wins + rank.losses > 0 ? Math.round(rank.wins / (rank.wins + rank.losses) * 100) : 0}% WR
                  </span>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--red)" }}>
                    {rank.losses}L
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Three-col row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Session summary */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: "var(--green)", boxShadow: "0 0 6px var(--green-soft)" }} />
              {summary ? `${summary.games} games tracked` : `Recent · ${recent.length}`}
            </div>
            <button className="panel-action" onClick={() => onNavigate("profile")}>VIEW ALL →</button>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {loading ? (
              <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>Loading…</div>
            ) : summary ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Donut value={Math.round(summary.win_rate * 100)} size={60} stroke={6} label="W RATE" />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>
                    {summary.wins}W · {summary.losses}L
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
            ) : (
              <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>No data</div>
            )}
          </div>
        </div>

        {/* Champion focus */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-title-dot" style={{ background: "var(--cyan)" }} /> Champion focus
            </div>
            <button className="panel-action" onClick={() => recent[0] && onNavigate("builds", { championId: recent[0].champion_id })}>BUILDS →</button>
          </div>
          <div className="panel-body">
            {recent[0] ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Champ id={recent[0].champion_id.toLowerCase()} size="xl" withTooltip />
                <div>
                  <div className="t-display" style={{ fontSize: 18, fontWeight: 600 }}>{recent[0].champion_id}</div>
                  <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{recent[0].role}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <span className={`tag ${recent[0].result ? "win" : "loss"}`}>{recent[0].result ? "WIN" : "LOSS"}</span>
                    <span className="tag">{recent[0].kills ?? 0}/{recent[0].deaths ?? 0}/{recent[0].assists ?? 0}</span>
                  </div>
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
                <div key={c.champion_id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                  onClick={() => onNavigate("builds", { championId: c.champion_id })}>
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

      {/* Recent matches with team compositions */}
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
                onClick={() => { onSelectMatch(m.id); onNavigate("profile"); }}
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
                <div className="match-team">
                  <TeamMini champs={[m.champion_id, ...m.ally_champions]} />
                  <TeamMini champs={m.enemy_champions} />
                </div>
                <KDARatio k={m.kills ?? 0} d={m.deaths ?? 0} a={m.assists ?? 0} />
                <Icon name="chevron-right" size={14} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
