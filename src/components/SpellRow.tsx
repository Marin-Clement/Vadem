import { useSpellStore, getCooldown } from "../store/spellStore";
import { type PlayerSummary } from "../store/gameStore";

interface Props {
  player: PlayerSummary;
  isEnemy: boolean;
}

export function SpellRow({ player, isEnemy }: Props) {
  const { cooldowns, markSpell } = useSpellStore();

  const cd1 = getCooldown(cooldowns, player.summonerName, 0);
  const cd2 = getCooldown(cooldowns, player.summonerName, 1);

  const spellBtn = (
    display: string,
    raw: string,
    slot: 0 | 1,
    cd: ReturnType<typeof getCooldown>
  ) => {
    const active = cd?.isOnCooldown;
    const remaining = cd?.remainingSecs ?? 0;

    return (
      <button
        onClick={() =>
          isEnemy &&
          markSpell(player.summonerName, slot, raw, player.level, player.itemIds)
        }
        disabled={!isEnemy}
        title={isEnemy ? `Click to mark ${display} as used` : undefined}
        className={[
          "flex-1 text-2xs font-mono px-2 py-1 rounded transition-all duration-150",
          "border truncate min-w-0",
          active
            ? "bg-loss/20 text-loss border-loss/50 font-semibold"
            : "bg-surface-raised text-text-secondary border-surface-border",
          isEnemy && !active
            ? "hover:border-accent/40 hover:text-text-primary cursor-pointer"
            : "cursor-default",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {active ? `${Math.ceil(remaining)}s` : display || "—"}
      </button>
    );
  };

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-surface-border last:border-0">
      {/* Champion name */}
      <span
        className="w-28 text-xs font-medium truncate text-text-primary"
        title={player.championName}
      >
        {player.championName}
      </span>

      {/* Level badge */}
      <span className="w-5 text-center text-2xs font-mono text-text-muted">
        {player.level}
      </span>

      {/* Dead indicator */}
      {player.isDead ? (
        <span className="text-2xs font-mono text-loss w-10 text-center">
          {Math.ceil(player.respawnTimer)}s
        </span>
      ) : (
        <span className="w-10" />
      )}

      {/* Spell buttons */}
      <div className="flex gap-1 flex-1">
        {spellBtn(player.spell1Display, player.spell1Raw, 0, cd1)}
        {spellBtn(player.spell2Display, player.spell2Raw, 1, cd2)}
      </div>
    </div>
  );
}
