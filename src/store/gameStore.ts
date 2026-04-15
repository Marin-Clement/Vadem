import { create } from "zustand";

export interface PlayerSummary {
  summonerName:  string;
  championName:  string;
  team:          string;
  level:         number;
  kills:         number;
  deaths:        number;
  assists:       number;
  cs:            number;
  isDead:        boolean;
  respawnTimer:  number;
  spell1Raw:     string;
  spell1Display: string;
  spell2Raw:     string;
  spell2Display: string;
  itemIds:       number[];
}

export interface GameState {
  isGameActive: boolean;
  gameTime:     number;
  mySummoner:   string;
  myTeam:       string;
  allyKills:    number;
  enemyKills:   number;
  allyGold:     number;
  enemyGold:    number;
  allyXp:       number;
  enemyXp:      number;
  players:      PlayerSummary[];

  // Feature vector components (all ORDER/blue perspective)
  killDiff:          number;
  levelDiff:         number;
  csDiff:            number;
  towerDiff:         number;
  inhibDiff:         number;
  dragonDiff:        number;
  blueHasSoul:       boolean;
  redHasSoul:        boolean;
  blueElderActive:   boolean;
  redElderActive:    boolean;
  blueBaronActive:   boolean;
  redBaronActive:    boolean;
  itemValueDiff:     number;
  carryGoldDiff:     number;
  wardsDiff:         number;
  grubsDiff:         number;
  topScalingDiff:    number;
  jungleScalingDiff: number;
  midScalingDiff:    number;
  adcScalingDiff:    number;
  supScalingDiff:    number;
}

const defaultState: GameState = {
  isGameActive: false,
  gameTime:     0,
  mySummoner:   "",
  myTeam:       "",
  allyKills:    0,
  enemyKills:   0,
  allyGold:     0,
  enemyGold:    0,
  allyXp:       0,
  enemyXp:      0,
  players:      [],
  killDiff:          0,
  levelDiff:         0,
  csDiff:            0,
  towerDiff:         0,
  inhibDiff:         0,
  dragonDiff:        0,
  blueHasSoul:       false,
  redHasSoul:        false,
  blueElderActive:   false,
  redElderActive:    false,
  blueBaronActive:   false,
  redBaronActive:    false,
  itemValueDiff:     0,
  carryGoldDiff:     0,
  wardsDiff:         0,
  grubsDiff:         0,
  topScalingDiff:    0,
  jungleScalingDiff: 0,
  midScalingDiff:    0,
  adcScalingDiff:    0,
  supScalingDiff:    0,
};

interface GameStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState:    defaultState,
  setGameState: (state) => set({ gameState: state }),
}));

// Selectors
export const selectEnemies = (myTeam: string, players: PlayerSummary[]) =>
  players.filter((p) => p.team !== myTeam);

export const selectAllies = (myTeam: string, players: PlayerSummary[]) =>
  players.filter((p) => p.team === myTeam);
