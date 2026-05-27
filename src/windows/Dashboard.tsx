import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { LoginScreen } from "../screens/LoginScreen";
import { useAuthStore } from "../store/authStore";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { DraftScreen } from "../screens/DraftScreen";
import { BuildsScreen } from "../screens/BuildsScreen";
import { MacroScreen } from "../screens/MacroScreen";
import { OverlayPreviewScreen } from "../screens/OverlayPreviewScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { MatchDetailScreen } from "../screens/MatchDetailScreen";

type Screen = "dashboard" | "profile" | "matchDetail" | "draft" | "builds" | "macro" | "overlay" | "settings";

export default function Dashboard() {
  const jwt = useAuthStore(s => s.jwt);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [buildsChampionId, setBuildsChampionId] = useState<string>("syndra");

  const handleNavigate = (s: Screen, extra?: { championId?: string }) => {
    if (s === "builds" && extra?.championId) {
      setBuildsChampionId(extra.championId);
    }
    setScreen(s);
  };

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return (
          <DashboardScreen
            onNavigate={handleNavigate}
            onSelectMatch={(id) => setSelectedMatchId(id)}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            onOpenMatchDetail={(id) => { setSelectedMatchId(id); setScreen("matchDetail"); }}
            onNavigate={handleNavigate}
          />
        );
      case "matchDetail":
        return (
          <MatchDetailScreen
            matchId={selectedMatchId || "m-2034"}
            onBack={() => setScreen("profile")}
            onSearchPlayer={(name) => {
              // Navigate to profile search — for now go to profile screen
              // Future: could open a searched summoner profile
              console.log("Search player:", name);
              setScreen("profile");
            }}
          />
        );
      case "draft":    return <DraftScreen />;
      case "builds":   return <BuildsScreen championId={buildsChampionId} onChangeChampion={setBuildsChampionId} />;
      case "macro":    return <MacroScreen />;
      case "overlay":  return <OverlayPreviewScreen />;
      case "settings": return <SettingsScreen />;
      default:         return null;
    }
  };

  if (!jwt) return <LoginScreen />;

  return (
    <AppShell screen={screen} onNavigate={handleNavigate}>
      {renderScreen()}
    </AppShell>
  );
}
