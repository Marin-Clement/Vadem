import { invoke } from "@tauri-apps/api/core";
import type { GameState } from "../store/gameStore";

/** Builds the 24-element feature vector (ORDER perspective) and calls predict_win.
 *  Returns P(my team wins) ∈ [0,1], or null if model is unavailable / game inactive. */
export async function computeWinProb(game: GameState): Promise<number | null> {
  if (!game.isGameActive) return null;

  // FEATURE_COLS order — must match training pipeline exactly
  const features: number[] = [
    game.gameTime / 60,           // [0]  game_minutes
    game.itemValueDiff,           // [1]  item_value_diff
    game.killDiff,                // [2]  kill_diff
    0,                            // [3]  kill_swing_3m (no history)
    game.towerDiff,               // [4]  tower_diff
    game.inhibDiff,               // [5]  inhib_diff
    game.dragonDiff,              // [6]  dragon_diff
    game.blueHasSoul ? 1 : 0,    // [7]  blue_has_soul
    game.redHasSoul ? 1 : 0,     // [8]  red_has_soul
    game.blueElderActive ? 1 : 0, // [9]  blue_elder_active
    game.redElderActive ? 1 : 0,  // [10] red_elder_active
    game.blueBaronActive ? 1 : 0, // [11] blue_baron_active
    game.redBaronActive ? 1 : 0,  // [12] red_baron_active
    game.levelDiff,               // [13] level_diff
    game.csDiff,                  // [14] cs_diff
    0,                            // [15] cs_swing_3m (no history)
    game.topScalingDiff,          // [16] top_scaling_diff
    game.jungleScalingDiff,       // [17] jungle_scaling_diff
    game.midScalingDiff,          // [18] mid_scaling_diff
    game.adcScalingDiff,          // [19] adc_scaling_diff
    game.supScalingDiff,          // [20] sup_scaling_diff
    game.carryGoldDiff,           // [21] carry_gold_diff
    game.wardsDiff,               // [22] wards_placed_diff
    game.grubsDiff,               // [23] grubs_diff
  ];

  try {
    const rawProb = await invoke<number>("predict_win", { input: { features } });
    const isBlue = game.myTeam === "ORDER";
    return isBlue ? rawProb : 1 - rawProb;
  } catch {
    return null;
  }
}
