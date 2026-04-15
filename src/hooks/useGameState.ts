import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useGameStore, type GameState } from "../store/gameStore";

/** Called once at the App root — subscribes to the Rust event stream. */
export function useGameStateSync() {
  const setGameState = useGameStore((s) => s.setGameState);

  useEffect(() => {
    const unlisten = listen<GameState>("game_state_updated", (event) => {
      setGameState(event.payload);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [setGameState]);
}

/** Returns the current game state from the store. */
export function useGameState() {
  return useGameStore((s) => s.gameState);
}
