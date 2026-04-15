import { Routes, Route } from "react-router-dom";
import Dashboard from "./windows/Dashboard";
import TabOverlay from "./windows/TabOverlay";
import TimersOverlay from "./windows/TimersOverlay";
import { useGameStateSync } from "./hooks/useGameState";

export default function App() {
  // Start listening for game state updates globally
  useGameStateSync();

  return (
    <Routes>
      <Route path="/"       element={<Dashboard />} />
      <Route path="/tab"    element={<TabOverlay />} />
      <Route path="/timers" element={<TimersOverlay />} />
    </Routes>
  );
}
