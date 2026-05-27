import { useState, useEffect } from "react";
import { Icon } from "../components/Icon";
import { Champ } from "../components/Champ";
import { DDragonItem } from "../components/Champ";
import { StatTile, Sparkline, KDARatio } from "../components/Primitives";
import { listMatches, getMatch, formatDuration, formatRelativeTime, type MatchListItem, type MatchDetail } from "../api/matches";
import { getProfile, syncMatches, type PlayerProfile } from "../api/player";
import { useAuthStore } from "../store/authStore";

interface Props {
  selectedMatchId: string | null;
  onSelectMatch: (id: string) => void;
  onOpenMatchDetail: (id: string) => void;
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
                <span className={`tag ${detail.result ? "win" : "loss"}`}>{detail.cs} CS · {detail.cs_per_min.toFixed(1)}/min</span>
                <span className="tag accent">{detail.damage_dealt.toLocaleString()} DMG</span>
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

        {/* Middle: teams */}
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>ALLY TEAM</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {detail.ally_champions.map((id, i) => (
              <Champ key={i} id={id.toLowerCase()} size="sm" withTooltip />
            ))}
          </div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>ENEMY TEAM</div>
          <div style={{ display: "flex", gap: 6 }}>
            {detail.enemy_champions.map((id, i) => (
              <Champ key={i} id={id.toLowerCase()} size="sm" withTooltip />
            ))}
          </div>
        </div>

        {/* Right: stats */}
        <div>
          <div className="t-eyebrow" style={{ marginBottom: 8 }}>MATCH STATS</div>
          <div style={{ display: "flex", gap: 14, marginBottom: 8 }}>
            <div>
              <div className="t-display" style={{ fontSize: 28, fontWeight: 600, color: "var(--fg-3)" }}>{detail.vision_score}</div>
              <div className="t-eyebrow" style={{ fontSize: 9 }}>VISION</div>
            </div>
            <div>
              <div className="t-display" style={{ fontSize: 28, fontWeight: 600, color: "var(--fg-1)" }}>
                {detail.gold_earned.toLocaleString()}
              </div>
              <div className="t-eyebrow" style={{ fontSize: 9 }}>GOLD</div>
            </div>
          </div>
          <Sparkline data={[50, 52, 55, 58, 60, detail.result ? 65 : 40]} color={detail.result ? "var(--green)" : "var(--red)"} />
          <button className="btn btn-sm" style={{ marginTop: 12, width: "100%" }} onClick={(e) => { e.stopPropagation(); onOpenFull(); }}>
            <Icon name="search" size={11} /> OPEN FULL TIMELINE
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProfileScreen({ selectedMatchId, onSelectMatch, onOpenMatchDetail }: Props) {
  const storeProfile = useAuthStore(s => s.profile);
  const setStoreProfile = useAuthStore(s => s.setProfile);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(selectedMatchId);
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | null>(storeProfile);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    Promise.all([
      getProfile().then(p => { setProfile(p); setStoreProfile(p); }),
      listMatches({ limit: 20 }).then(setMatches),
    ]).finally(() => setLoading(false));
  }, [setStoreProfile]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncMatches();
      const updated = await listMatches({ limit: 20 });
      setMatches(updated);
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

  return (
    <div className="content fade-up">
      {/* Profile hero */}
      <div className="panel tactical" style={{ marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div className="tactical-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.3, maskImage: "radial-gradient(circle at 80% 50%, transparent, black 70%)" }} />
        <div className="panel-body" style={{ display: "flex", gap: 24, alignItems: "center", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 96, height: 96, borderRadius: 16, background: "var(--accent)", display: "grid", placeItems: "center", fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 700, color: "#0a0613" }}>
              {(profile?.game_name ?? 'XX').slice(0, 2).toUpperCase()}
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
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {rank && <span className="tag accent">{rank.tier} {rank.division} · {rank.lp} LP</span>}
              <span className="tag">{matches.length} games tracked</span>
              {wins > 0 && <span className="tag win">{wins}W streak</span>}
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
      <div className="grid-4" style={{ marginBottom: 14 }}>
        <StatTile label="Season W/L" value={`${wins}–${losses}`} />
        <StatTile label="Win rate" value={matches.length > 0 ? Math.round(wins / matches.length * 100) : 0} suffix="%" />
        <StatTile label="Avg KDA" value="—" />
        <StatTile label="LP gain · 7d" value={rank ? `${rank.lp}` : '—'} />
      </div>

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
                  className={`match-row ${m.result ? "win" : "loss"} ${openId === m.match_id ? "expanded" : ""}`}
                  onClick={() => { setOpenId(openId === m.match_id ? null : m.match_id); onSelectMatch(m.match_id); }}
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
                  <Icon name={openId === m.match_id ? "chevron-down" : "chevron-right"} size={14} />
                </div>
                {openId === m.match_id && (
                  <MatchDetailPanel matchId={m.match_id} onOpenFull={() => onOpenMatchDetail(m.match_id)} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
