import { useState, useEffect } from "react";
import { Icon } from "../components/Icon";
import { Champ } from "../components/Champ";
import { DDragonItem } from "../components/Champ";
import { StatTile, KDARatio } from "../components/Primitives";
import { listMatches, getMatch, formatDuration, formatRelativeTime, type MatchListItem, type MatchDetail } from "../api/matches";
import { getProfile, getSummary, getChampionPool, getRoleDist, syncMatches, type PlayerProfile, type PlayerSummary, type ChampionPoolEntry, type RoleDist } from "../api/player";
import { useAuthStore } from "../store/authStore";
import { useDDragon } from "../utils/ddragon";

type Screen = "dashboard" | "profile" | "matchDetail" | "draft" | "builds" | "macro" | "overlay" | "settings";

const TIER_COLOR: Record<string, string> = {
  IRON: "#6b7280", BRONZE: "#92400e", SILVER: "#9ca3af",
  GOLD: "#d97706", PLATINUM: "#0d9488", EMERALD: "#059669",
  DIAMOND: "#6366f1", MASTER: "#9333ea", GRANDMASTER: "#dc2626",
  CHALLENGER: "#f59e0b",
};

interface Props {
  selectedMatchId: string | null;
  onSelectMatch: (id: string) => void;
  onOpenMatchDetail: (id: string) => void;
  onNavigate?: (s: Screen, extra?: { championId?: string }) => void;
}

function MatchDetailPanel({ matchId, onOpenFull }: { matchId: string; onOpenFull: () => void }) {
  const [detail, setDetail] = useState<MatchDetail | null>(null);

  useEffect(() => {
    getMatch(matchId).then(setDetail).catch(() => setDetail(null));
  }, [matchId]);

  if (!detail) return <div style={{ padding: 16, color: "var(--fg-3)", fontSize: 12 }}>Loading…</div>;

  return (
    <div className="match-detail-panel">
      <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 24 }}>
        {/* Left: KDA + items */}
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>YOUR PERFORMANCE</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
            <Champ id={detail.champion_id.toLowerCase()} size="lg" />
            <div>
              <div className="t-display" style={{ fontSize: 18, fontWeight: 600 }}>{detail.champion_id}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span className={`tag ${detail.result ? "win" : "loss"}`}>{detail.cs ?? 0} CS · {(detail.cs_per_min ?? 0).toFixed(1)}/min</span>
                <span className="tag accent">{(detail.damage ?? 0).toLocaleString()} DMG</span>
              </div>
            </div>
          </div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>FINAL BUILD</div>
          <div style={{ display: "flex", gap: 6 }}>
            {detail.items.map((itemId, i) => (
              <DDragonItem key={i} itemId={itemId} size="lg" />
            ))}
            {Array.from({ length: Math.max(0, 6 - detail.items.length) }).map((_, i) => (
              <DDragonItem key={`empty-${i}`} itemId={null} size="lg" />
            ))}
          </div>
        </div>

        {/* Middle: teams with summoner names */}
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>ALLY TEAM</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            <Champ id={detail.champion_id.toLowerCase()} size="sm" withTooltip playerName="You" />
            {detail.ally_champions.map((id, i) => (
              <Champ
                key={i}
                id={id.toLowerCase()}
                size="sm"
                withTooltip
                playerName={detail.ally_participants?.[i]?.game_name}
              />
            ))}
          </div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>ENEMY TEAM</div>
          <div style={{ display: "flex", gap: 4 }}>
            {detail.enemy_champions.map((id, i) => (
              <Champ
                key={i}
                id={id.toLowerCase()}
                size="sm"
                withTooltip
                playerName={detail.enemy_participants?.[i]?.game_name}
              />
            ))}
          </div>
        </div>

        {/* Right: stats */}
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>MATCH STATS</div>
          <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
            <div>
              <div className="t-display" style={{ fontSize: 28, fontWeight: 600, color: "var(--fg-3)" }}>{detail.vision_score ?? 0}</div>
              <div className="t-eyebrow" style={{ fontSize: 9 }}>VISION</div>
            </div>
            <div>
              <div className="t-display" style={{ fontSize: 28, fontWeight: 600, color: "var(--fg-1)" }}>
                {(detail.gold ?? 0).toLocaleString()}
              </div>
              <div className="t-eyebrow" style={{ fontSize: 9 }}>GOLD</div>
            </div>
            <div>
              <div className="t-display" style={{ fontSize: 28, fontWeight: 600, color: "var(--accent)" }}>
                {(detail.damage ?? 0) > 1000 ? `${((detail.damage ?? 0) / 1000).toFixed(1)}k` : detail.damage ?? 0}
              </div>
              <div className="t-eyebrow" style={{ fontSize: 9 }}>DMG</div>
            </div>
          </div>
          <button className="btn btn-sm" style={{ marginTop: 8, width: "100%" }} onClick={(e) => { e.stopPropagation(); onOpenFull(); }}>
            <Icon name="search" size={11} /> OPEN FULL TIMELINE
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileScreen({ selectedMatchId, onSelectMatch, onOpenMatchDetail, onNavigate }: Props) {
  const storeProfile = useAuthStore(s => s.profile);
  const setStoreProfile = useAuthStore(s => s.setProfile);
  const ddr = useDDragon();
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(selectedMatchId);
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | null>(storeProfile);
  const [summary, setSummary] = useState<PlayerSummary | null>(null);
  const [champPool, setChampPool] = useState<ChampionPoolEntry[]>([]);
  const [roleDist, setRoleDist] = useState<RoleDist[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [p, m] = await Promise.all([
          getProfile(),
          listMatches({ limit: 20 }),
        ]);
        if (cancelled) return;
        setProfile(p);
        setStoreProfile(p);

        // Load aggregations in parallel (non-blocking)
        getSummary().then(s => { if (!cancelled) setSummary(s); }).catch(() => {});
        getChampionPool().then(cp => { if (!cancelled) setChampPool(cp); }).catch(() => {});
        getRoleDist().then(rd => { if (!cancelled) setRoleDist(rd); }).catch(() => {});

        if (m.length === 0) {
          setSyncing(true);
          try {
            await syncMatches();
            const fresh = await listMatches({ limit: 20 });
            if (!cancelled) setMatches(fresh);
          } catch { /* ignore */ }
          finally { if (!cancelled) setSyncing(false); }
        } else {
          setMatches(m);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [setStoreProfile]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncMatches();
      const [updated, s, cp, rd] = await Promise.all([
        listMatches({ limit: 20 }),
        getSummary().catch(() => null),
        getChampionPool().catch(() => []),
        getRoleDist().catch(() => []),
      ]);
      setMatches(updated);
      if (s) setSummary(s);
      setChampPool(cp);
      setRoleDist(rd);
    } finally {
      setSyncing(false);
    }
  };

  const filtered = matches.filter(m =>
    filter === "all" || (filter === "win" ? m.result : !m.result)
  );
  const wins = matches.filter(m => m.result).length;
  const losses = matches.length - wins;
  const rank = profile?.rank;

  const profileIconUrl = profile?.profile_icon_id && ddr
    ? `https://ddragon.leagueoflegends.com/cdn/${ddr.version}/img/profileicon/${profile.profile_icon_id}.png`
    : null;

  const avgKDA = summary
    ? summary.avg_deaths === 0
      ? (summary.avg_kills + summary.avg_assists).toFixed(2)
      : ((summary.avg_kills + summary.avg_assists) / summary.avg_deaths).toFixed(2)
    : "—";
  const avgCSMin = summary ? summary.avg_cs_per_min.toFixed(1) : "—";
  const avgVision = summary ? Math.round(summary.avg_vision_score).toString() : "—";
  const winRate = summary ? Math.round(summary.win_rate * 100) : matches.length > 0 ? Math.round(wins / matches.length * 100) : 0;

  return (
    <div className="content fade-up">
      {/* Profile hero */}
      <div className="panel tactical" style={{ marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div className="tactical-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.3, maskImage: "radial-gradient(circle at 80% 50%, transparent, black 70%)" }} />
        <div className="panel-body" style={{ display: "flex", gap: 24, alignItems: "center", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 96, height: 96, borderRadius: 16, background: "var(--accent)", overflow: "hidden", display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 700, color: "#0a0613" }}>
              {profileIconUrl ? (
                <img src={profileIconUrl} alt="Profile icon" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.removeProperty("display"); }}
                />
              ) : null}
              <span style={{ display: profileIconUrl ? "none" : undefined }}>
                {(profile?.game_name ?? 'XX').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div style={{ position: "absolute", bottom: -4, right: -4, padding: "2px 8px", background: "var(--bg-3)", border: "1px solid var(--accent)", borderRadius: 6, fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>
              {profile?.summoner_level ?? '—'}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div className="t-display" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>{profile?.game_name ?? '—'}</div>
              <span className="t-mono" style={{ fontSize: 14, color: "var(--fg-3)" }}>#{profile?.tag_line ?? '—'}</span>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 12, color: "var(--fg-2)" }}>
              <span>{profile?.region ?? '—'}</span>
              <span>·</span>
              <span className="green">● Online</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {rank && (
                <span className="tag accent" style={{ background: (TIER_COLOR[rank.tier.toUpperCase()] ?? "var(--accent)") + "22", borderColor: (TIER_COLOR[rank.tier.toUpperCase()] ?? "var(--accent)") + "44", color: TIER_COLOR[rank.tier.toUpperCase()] ?? "var(--accent)" }}>
                  {rank.tier} {rank.division} · {rank.lp} LP
                </span>
              )}
              {rank && <span className="tag">{rank.wins}W {rank.losses}L ({rank.wins + rank.losses > 0 ? Math.round(rank.wins / (rank.wins + rank.losses) * 100) : 0}% WR)</span>}
              <span className="tag">{summary?.games ?? matches.length} games tracked</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={handleSync} disabled={syncing}>
              <Icon name="swap" size={14} /> {syncing ? 'Syncing…' : 'Sync matches'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }}>
        <StatTile label="Win rate · 30d" value={`${winRate}`} suffix="%" />
        <StatTile label="W / L" value={`${summary?.wins ?? wins}–${summary?.losses ?? losses}`} />
        <StatTile label="Avg KDA" value={avgKDA} />
        <StatTile label="Avg CS / min" value={avgCSMin} />
        <StatTile label="Avg vision" value={avgVision} />
      </div>

      {/* Champion pool + role dist */}
      {(champPool.length > 0 || roleDist.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          {/* Champion pool */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><span className="panel-title-dot" /> Champion pool · 30d</div>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {champPool.slice(0, 5).map(c => (
                <div
                  key={c.champion_id}
                  style={{ display: "grid", gridTemplateColumns: "36px 1fr 60px 60px 80px", gap: 10, alignItems: "center", padding: "6px 8px", background: "var(--bg-3)", borderRadius: 6, cursor: "pointer" }}
                  onClick={() => onNavigate?.("builds", { championId: c.champion_id })}
                >
                  <Champ id={c.champion_id.toLowerCase()} withTooltip />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{c.champion_id}</div>
                    <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{c.games}G · {((c.avg_kills + c.avg_assists) / Math.max(c.avg_deaths, 1)).toFixed(1)} KDA</div>
                  </div>
                  <div>
                    <div className="bar" style={{ height: 4 }}>
                      <div className="bar-fill" style={{ width: `${c.win_rate * 100}%`, background: c.win_rate >= 0.5 ? "var(--green)" : "var(--red)" }} />
                    </div>
                    <div className="t-mono" style={{ fontSize: 10, color: c.win_rate >= 0.5 ? "var(--green)" : "var(--red)", marginTop: 2 }}>
                      {Math.round(c.win_rate * 100)}% WR
                    </div>
                  </div>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{c.avg_cs_per_min.toFixed(1)} CS/m</span>
                  <span className="tag" style={{ fontSize: 10 }}>{c.wins}W {c.games - c.wins}L</span>
                </div>
              ))}
            </div>
          </div>

          {/* Role distribution */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title"><span className="panel-title-dot" /> Role distribution</div>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {roleDist.map(r => (
                <div key={r.role} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="t-mono" style={{ fontSize: 11, fontWeight: 700 }}>{r.role}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>{r.games}G</span>
                      <span className="t-mono" style={{ fontSize: 11, color: r.win_rate >= 0.5 ? "var(--green)" : "var(--red)" }}>
                        {Math.round(r.win_rate * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="bar" style={{ height: 6 }}>
                    <div className="bar-fill" style={{ width: `${r.win_rate * 100}%`, background: r.win_rate >= 0.5 ? "var(--green)" : "var(--red)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match history */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Match history</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[["all", "ALL"], ["win", "WINS"], ["loss", "LOSSES"]].map(([k, l]) => (
              <button key={k} className="panel-action" onClick={() => setFilter(k)}
                style={{ padding: "4px 10px", background: filter === k ? "var(--accent-soft)" : "transparent", color: filter === k ? "var(--accent)" : "var(--fg-3)", borderRadius: 4 }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
              No matches found. Click "Sync matches" to import from Riot.
            </div>
          ) : (
            filtered.map(m => (
              <div key={m.id}>
                <div
                  className={`match-row ${m.result ? "win" : "loss"} ${openId === m.id ? "expanded" : ""}`}
                  onClick={() => { setOpenId(openId === m.id ? null : m.id); onSelectMatch(m.id); }}
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
                  {/* Team composition mini */}
                  <div className="match-team" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", gap: 2 }}>
                      <Champ id={m.champion_id.toLowerCase()} size="xs" />
                      {m.ally_champions.slice(0, 4).map((id, i) => (
                        <Champ key={i} id={id.toLowerCase()} size="xs" withTooltip />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {m.enemy_champions.slice(0, 5).map((id, i) => (
                        <Champ key={i} id={id.toLowerCase()} size="xs" withTooltip />
                      ))}
                    </div>
                  </div>
                  <KDARatio k={m.kills ?? 0} d={m.deaths ?? 0} a={m.assists ?? 0} />
                  <Icon name={openId === m.id ? "chevron-down" : "chevron-right"} size={14} />
                </div>
                {openId === m.id && (
                  <MatchDetailPanel matchId={m.id} onOpenFull={() => onOpenMatchDetail(m.id)} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
