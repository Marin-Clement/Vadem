import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { useDDragon } from "../utils/ddragon";
import { getPublicProfile, type PlayerProfile } from "../api/player";

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
}

export function PublicProfileScreen({ puuid, gameName, tagLine, onBack }: Props) {
  const ddr = useDDragon();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getPublicProfile(puuid, gameName, tagLine)
      .then(setProfile)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [puuid, gameName, tagLine]);

  const displayName = profile?.game_name || gameName;
  const displayTag  = profile?.tag_line  || tagLine;

  const profileIconUrl = profile?.profile_icon_id && ddr
    ? `https://ddragon.leagueoflegends.com/cdn/${ddr.version}/img/profileicon/${profile.profile_icon_id}.png`
    : null;

  const rank = profile?.rank;
  const initials = displayName.slice(0, 2).toUpperCase();

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

      {loading && (
        <div className="panel">
          <div className="panel-body t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>
            Loading profile…
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

      {!loading && (
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
                  !error && <span className="tag" style={{ color: "var(--fg-3)" }}>Unranked</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
