import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface CooldownInfo {
  summonerName:  string;
  slot:          number;
  isOnCooldown:  boolean;
  remainingSecs: number;
}

interface SpellStore {
  cooldowns: CooldownInfo[];
  markSpell: (summonerName: string, slot: 0 | 1, rawSpell: string, level: number, itemIds: number[]) => void;
  refreshCooldowns: () => void;
}

export const useSpellStore = create<SpellStore>((set) => ({
  cooldowns: [],

  markSpell: (summonerName, slot, rawSpell, level, itemIds) => {
    invoke("mark_spell_used", {
      req: { summonerName, slot, rawSpell, level, itemIds },
    }).then(() => {
      // Immediately refresh after marking
      invoke<CooldownInfo[]>("get_spell_cooldowns").then((cooldowns) =>
        set({ cooldowns })
      );
    });
  },

  refreshCooldowns: () => {
    invoke<CooldownInfo[]>("get_spell_cooldowns").then((cooldowns) =>
      set({ cooldowns })
    );
  },
}));

/** Returns cooldown info for a specific summoner+slot, or null if not tracked. */
export function getCooldown(
  cooldowns: CooldownInfo[],
  summonerName: string,
  slot: 0 | 1
): CooldownInfo | null {
  return (
    cooldowns.find(
      (c) => c.summonerName === summonerName && c.slot === slot
    ) ?? null
  );
}
