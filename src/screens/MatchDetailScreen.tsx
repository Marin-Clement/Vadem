import { useEffect, useState } from "react";
import { Icon } from "../components/Icon";
import { Champ } from "../components/Champ";
import { DDragonItem } from "../components/Champ";
import { Sparkline } from "../components/Primitives";
import { getMatch, formatDuration, formatRelativeTime, type MatchDetail, type ParticipantSummary } from "../api/matches";
import { WipBanner, WipTag } from "../components/Wip";

const ROLES = ["TOP", "JNG", "MID", "BOT", "SUP"];

interface Props {
  matchId: string;
  onBack: () => void;
  onSearchPlayer?: (gameName: string) => void;
}

interface PlayerRowProps {
  role: string;
  participant?: ParticipantSummary;
  champId: string;
  isMe: boolean;
  onSearchPlayer?: (gameName: string) => void;
}

function PlayerRow({ role, participant, champId, isMe, onSearchPlayer }: PlayerRowProps) {
  const kda = participant
    ? `${participant.kills}/${participant.deaths}/${participant.assists}`
    : "—";
  const name = isMe ? "You" : (participant?.game_name ?? champId);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "32px 36px 1fr 80px",
        gap: 10,
        alignItems: "center",
        padding: 8,
        background: isMe ? "var(--accent-soft)" : "var(--bg-3)",
        border: `1px solid ${isMe ? "var(--accent)" : "var(--line-1)"}`,
        borderRadius: 6,
        cursor: !isMe && participant?.game_name ? "pointer" : "default",
      }}
      onClick={() => !isMe && participant?.game_name && onSearchPlayer?.(participant.game_name)}
      title={!isMe && participant?.game_name ? `Search ${participant.game_name}` : undefined}
    >
      <span className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)", fontWeight: 700, letterSpacing: "0.08em" }}>
        {role}
      </span>
      <Champ id={champId.toLowerCase()} withTooltip />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </div>
        {!isMe && participant?.cs != null && (
          <div className="t-mono" style={{ fontSize: 10, color: "var(--fg-3)" }}>
            {participant.cs} CS
          </div>
        )}
      </div>
      <span className="t-mono fg-2" style={{ fontSize: 11 }}>{kda}</span>
    </div>
  );
}

export function MatchDetailScreen({ matchId, onBack, onSearchPlayer }: Props) {
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMatch(matchId)
      .then(setMatch)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) {
    return (
      <div className="content fade-up">
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
          <Icon name="chevron-left" size={12} /> Back to history
        </button>
        <div className="t-mono" style={{ color: "var(--fg-3)", fontSize: 12 }}>Loading match…</div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="content fade-up">
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 16 }}>
          <Icon name="chevron-left" size={12} /> Back to history
        </button>
        <div className="t-mono" style={{ color: "var(--red)", fontSize: 12 }}>{error ?? "Match not found"}</div>
      </div>
    );
  }

  const won = match.result;
  const k = match.kills ?? 0, d = match.deaths ?? 0, a = match.assists ?? 0;
  const kda = `${k}/${d}/${a}`;
  const kdaRatio = d === 0 ? "Perfect" : ((k + a) / d).toFixed(2);

  // Build full 5-player rosters for display
  // Ally side: user (index 0) + 4 allies from ally_participants
  type RosterEntry = { champId: string; participant?: ParticipantSummary; isMe: boolean };
  const allyRoster: RosterEntry[] = [
    { champId: match.champion_id, participant: undefined, isMe: true },
    ...match.ally_champions.map((champId, i): RosterEntry => ({
      champId,
      participant: match.ally_participants?.[i],
      isMe: false,
    })),
  ].slice(0, 5);

  while (allyRoster.length < 5) {
    allyRoster.push({ champId: "?", participant: undefined, isMe: false });
  }

  const enemyRoster: RosterEntry[] = match.enemy_champions.map((champId, i): RosterEntry => ({
    champId,
    participant: match.enemy_participants?.[i],
    isMe: false,
  })).slice(0, 5);

  while (enemyRoster.length < 5) {
    enemyRoster.push({ champId: "?", participant: undefined, isMe: false });
  }

  return (
    <div className="content fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <Icon name="chevron-left" size={12} /> Back to history
        </button>
        <span className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>MATCH · {match.id}</span>
      </div>

      {/* Header */}
      <div className="panel tactical" style={{ marginBottom: 14, borderColor: won ? "oklch(0.78 0.16 150 / 0.4)" : "oklch(0.68 0.22 25 / 0.4)" }}>
        <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center" }}>
          <div style={{ width: 6, height: 80, background: won ? "var(--green)" : "var(--red)", boxShadow: `0 0 12px ${won ? "var(--green-soft)" : "var(--red-soft)"}`, borderRadius: 4 }} />
          <div>
            <div className="t-eyebrow" style={{ marginBottom: 4 }}>{match.queue_name} · {formatRelativeTime(match.played_at)}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <div className="t-display" style={{ fontSize: 36, fontWeight: 700, color: won ? "var(--green)" : "var(--red)" }}>
                {won ? "VICTORY" : "DEFEAT"}
              </div>
              <div className="t-display" style={{ fontSize: 22, color: "var(--fg-1)" }}>· {formatDuration(match.duration_secs)}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "KDA",  val: kda },
              { label: "RATIO", val: kdaRatio },
              { label: "CS",   val: String(match.cs ?? 0) },
              { label: "DMG",  val: `${((match.damage ?? 0) / 1000).toFixed(1)}k` },
              { label: "VS",   val: String(match.vision_score ?? 0) },
            ].map(s => (
              <div key={s.label}>
                <div className="t-eyebrow">{s.label}</div>
                <div className="t-display t-num" style={{ fontSize: 20, fontWeight: 600 }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Champion + items */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Your performance</div>
        </div>
        <div className="panel-body" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Champ id={match.champion_id.toLowerCase()} size="xl" />
            <div>
              <div className="t-display" style={{ fontSize: 22, fontWeight: 600 }}>{match.champion_id}</div>
              <div className="t-mono" style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2 }}>{match.role}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <span className="tag">{match.cs ?? 0} CS</span>
                <span className="tag">{(match.cs_per_min ?? 0).toFixed(1)} CS/min</span>
                <span className="tag accent">{(match.gold ?? 0).toLocaleString()} gold</span>
              </div>
            </div>
          </div>

          <div>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>FINAL BUILD</div>
            <div style={{ display: "flex", gap: 6 }}>
              {match.items.map((id, i) => <DDragonItem key={i} itemId={id} size="lg" />)}
              {Array.from({ length: Math.max(0, 6 - match.items.length) }).map((_, i) => (
                <DDragonItem key={`e${i}`} itemId={null} size="lg" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Teams — full 5v5 with summoner names */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        {[
          { label: "Your team", side: "blue", roster: allyRoster, won },
          { label: "Enemy team", side: "red", roster: enemyRoster, won: !won },
        ].map((t, idx) => (
          <div key={idx} className="panel" style={{ borderColor: t.won ? "oklch(0.78 0.16 150 / 0.3)" : undefined }}>
            <div className="panel-header">
              <div className="panel-title">
                <span className="panel-title-dot" style={{ background: t.side === "blue" ? "var(--cyan)" : "var(--red)" }} />
                {t.label}
              </div>
              <span className={`tag ${t.won ? "win" : "loss"}`}>{t.won ? "VICTORY" : "DEFEAT"}</span>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {t.roster.map((player, i) => (
                <PlayerRow
                  key={i}
                  role={ROLES[i] ?? "?"}
                  participant={player.participant}
                  champId={player.champId}
                  isMe={player.isMe}
                  onSearchPlayer={onSearchPlayer}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Win probability sparkline */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> Win probability trend</div>
          <WipTag />
        </div>
        <div className="panel-body">
          <WipBanner label="Win probability timeline — requires per-minute game state snapshots, not yet stored" />
          <Sparkline
            data={[50, 52, won ? 58 : 48, won ? 62 : 44, won ? 67 : 41, won ? 72 : 38, won ? 78 : 35]}
            color={won ? "var(--green)" : "var(--red)"}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--ff-mono)", fontSize: 10, color: "var(--fg-3)" }}>
            <span>0:00</span><span>10:00</span><span>20:00</span><span>30:00</span><span>{formatDuration(match.duration_secs)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
