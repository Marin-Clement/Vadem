import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Champ } from "../components/Champ";
import { StatTile, KDARatio } from "../components/Primitives";
import { useDDragon } from "../utils/ddragon";
import { getFullPublicProfile, type FullPublicProfile, type PublicMatchItem } from "../api/player";
import { formatDuration, formatRelativeTime } from "../api/matches";

const TIER_COLOR: Record<string, string> = {
  IRON: "#6b7280", BRONZE: "#92400e", SILVER: "#9ca3af",
  GOLD: "#d97706", PLATINUM: "#0d9488", EMERALD: "#059669",
  DIAMOND: "#6366f1", MASTER: "#9333ea", GRANDMASTER: "#dc2626",
  CHALLENGER: "#f59e0b",
};

interface Props {
  puuid: string;
  gameName: string;
  tagLine: string;
  onBack: () => void;
  onViewPlayer?: (puuid: string, gameName: string, tagLine: string) => void;
}

function MatchRow({
  m,
  onViewPlayer,
}: {
  m: PublicMatchItem;
  onViewPlayer?: (puuid: string, gameName: string, tagLine: string) => void;
}) {
  const playedAt = new Date(m.played_at).toISOString();

  return (
    <div>
      <div className={`match-row ${m.result ? "win" : "loss"}`}>
        <div />
        <div className="match-result">
          <span className={`match-result-label ${m.result ? "win" : "loss"}`}>{m.result ? "WIN" : "LOSS"}</span>
          <span className="match-result-time">{formatDuration(m.duration_secs)}</span>
        </div>
        <div className="match-champ-info">
          <Champ id={m.champion_id.toLowerCase()} withTooltip />
          <div className="match-champ-info-text">
            <span className="match-champ-info-name">{m.champion_id}</span>
            <span className="match-champ-info-meta">{m.role} · {m.queue_name} · {formatRelativeTime(playedAt)}</span>
          </div>
        </div>
        <div className="match-team">
          <div style={{ display: "flex", gap: 2 }}>
            <Champ id={m.champion_id.toLowerCase()} size="xs" playerName="—" />
            {m.ally_champions.slice(0, 4).map((id, i) => {
              const raw = m.ally_names?.[i] ?? "";
              const puuid = m.ally_puuids?.[i] ?? "";
              const [gn, tl = ""] = raw.includes("#") ? raw.split("#") : [raw, ""];
              return (
                <Champ
                  key={i}
                  id={id.toLowerCase()}
                  size="xs"
                  playerName={gn || undefined}
                  withTooltip
                  onClick={puuid && onViewPlayer ? () => onViewPlayer(puuid, gn, tl) : undefined}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {m.enemy_champions.slice(0, 5).map((id, i) => {
              const raw = m.enemy_names?.[i] ?? "";
              const puuid = m.enemy_puuids?.[i] ?? "";
              const [gn, tl = ""] = raw.includes("#") ? raw.split("#") : [raw, ""];
              return (
                <Champ
                  key={i}
                  id={id.toLowerCase()}
                  size="xs"
                  playerName={gn || undefined}
                  withTooltip
                  onClick={puuid && onViewPlayer ? () => onViewPlayer(puuid, gn, tl) : undefined}
                />
              );
            })}
          </div>
        </div>
        <KDARatio k={m.kills} d={m.deaths} a={m.assists} />
        <Icon name="chevron-right" size={14} />
      </div>
    </div>
  );
}

export function PublicProfileScreen({ puuid, gameName, tagLine, onBack, onViewPlayer }: Props) {
  const ddr = useDDragon();
  const [data, setData] = useState<FullPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    getFullPublicProfile(puuid, gameName, tagLine)
      .then(setData)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [puuid, gameName, tagLine]);

  const profile = data?.profile;
  const summary = data?.summary;
  const champPool = data?.champ_pool ?? [];
  const roleDist = data?.role_dist ?? [];
  const allMatches = data?.matches ?? [];

  const displayName = profile?.game_name || gameName;
  const displayTag  = profile?.tag_line  || tagLine;

  const profileIconUrl = profile?.profile_icon_id && ddr
    ? `https://ddragon.leagueoflegends.com/cdn/${ddr.version}/img/profileicon/${profile.profile_icon_id}.png`
    : null;

  const rank = profile?.rank;
  const initials = displayName.slice(0, 2).toUpperCase();

  const filtered = allMatches.filter(m =>
    filter === "all" || (filter === "win" ? m.result : !m.result)
  );

  const avgKDA = summary
    ? summary.avg_deaths === 0
      ? (summary.avg_kills + summary.avg_assists).toFixed(2)
      : ((summary.avg_kills + summary.avg_assists) / summary.avg_deaths).toFixed(2)
    : "—";
  const avgCSMin = summary ? summary.avg_cs_per_min.toFixed(1) : "—";
  const winRate = summary ? Math.round(summary.win_rate * 100) : 0;

  return (
    <div className="content fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <Icon name="chevron-left" size={12} /> Back
        </button>
        <span className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
          PLAYER · {displayName}{displayTag ? `#${displayTag}` : ""}
        </span>
      </div>

      {/* Profile hero */}
      <div className="panel tactical" style={{ marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div className="tactical-grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.3, maskImage: "radial-gradient(circle at 80% 50%, transparent, black 70%)" }} />
        <div className="panel-body" style={{ display: "flex", gap: 24, alignItems: "center", position: "relative" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 80, height: 80, borderRadius: 14,
              background: "var(--accent)", overflow: "hidden",
              display: "grid", placeItems: "center",
              fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 700, color: "#0a0613",
            }}>
              {profileIconUrl ? (
                <img
                  src={profileIconUrl}
                  alt="icon"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.removeProperty("display");
                  }}
                />
              ) : null}
              <span style={{ display: profileIconUrl ? "none" : undefined }}>{initials}</span>
            </div>
            {profile?.summoner_level ? (
              <div style={{
                position: "absolute", bottom: -4, right: -4,
                padding: "2px 6px", background: "var(--bg-3)",
                border: "1px solid var(--accent)", borderRadius: 6,
                fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 700, color: "var(--accent)",
              }}>
                {profile.summoner_level}
              </div>
            ) : null}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div className="t-display" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
                {displayName}
              </div>
              {displayTag && (
                <span className="t-mono" style={{ fontSize: 13, color: "var(--fg-3)" }}>#{displayTag}</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>
              {profile?.region?.toUpperCase() ?? "—"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {rank ? (
                <>
                  <span
                    className="tag accent"
                    style={{
                      background: (TIER_COLOR[rank.tier.toUpperCase()] ?? "var(--accent)") + "22",
                      borderColor: (TIER_COLOR[rank.tier.toUpperCase()] ?? "var(--accent)") + "44",
                      color: TIER_COLOR[rank.tier.toUpperCase()] ?? "var(--accent)",
                    }}
                  >
                    {rank.tier} {rank.division} · {rank.lp} LP
                  </span>
                  <span className="tag">
                    {rank.wins}W {rank.losses}L ({rank.wins + rank.losses > 0
                      ? Math.round(rank.wins / (rank.wins + rank.losses) * 100)
                      : 0}% WR)
                  </span>
                </>
              ) : (
                !loading && !error && <span className="tag" style={{ color: "var(--fg-3)" }}>Unranked</span>
              )}
              {summary && <span className="tag">{summary.games} games tracked</span>}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="panel">
          <div className="panel-body t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>
            Fetching match history from Riot…
          </div>
        </div>
      )}

      {error && (
        <div className="panel">
          <div className="panel-body t-mono" style={{ fontSize: 12, color: "var(--red)" }}>
            {error.includes("404") ? "Player not found" : `Error: ${error}`}
          </div>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Stats strip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
            <StatTile label="Win rate" value={`${winRate}`} suffix="%" />
            <StatTile label="W / L" value={`${summary?.wins ?? 0}–${summary?.losses ?? 0}`} />
            <StatTile label="Avg KDA" value={avgKDA} />
            <StatTile label="Avg CS / min" value={avgCSMin} />
          </div>

          {/* Champion pool + role dist */}
          {(champPool.length > 0 || roleDist.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title"><span className="panel-title-dot" /> Champion pool</div>
                </div>
                <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {champPool.slice(0, 5).map(c => (
                    <div
                      key={c.champion_id}
                      style={{ display: "grid", gridTemplateColumns: "36px 1fr 60px 60px 80px", gap: 10, alignItems: "center", padding: "6px 8px", background: "var(--bg-3)", borderRadius: 6 }}
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
              {filtered.length === 0 ? (
                <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>No matches found.</div>
              ) : (
                filtered.map(m => (
                  <MatchRow
                    key={m.match_id}
                    m={m}
                    onViewPlayer={onViewPlayer}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
