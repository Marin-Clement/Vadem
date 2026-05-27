import { useState, useEffect } from "react";
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
import { PublicProfileScreen } from "../screens/PublicProfileScreen";

type Screen = "dashboard" | "profile" | "matchDetail" | "draft" | "builds" | "macro" | "overlay" | "settings" | "playerProfile";

export default function Dashboard() {
  const jwt = useAuthStore(s => s.jwt);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [prevScreen, setPrevScreen] = useState<Screen>("dashboard");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [buildsChampionId, setBuildsChampionId] = useState<string>("syndra");
  const [playerTarget, setPlayerTarget] = useState<{ gameName: string; tagLine: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("vadem_theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const handleNavigate = (s: Screen, extra?: { championId?: string }) => {
    if (s === "builds" && extra?.championId) {
      setBuildsChampionId(extra.championId);
    }
    setPrevScreen(screen);
    setScreen(s);
  };

  const navigateToPlayer = (gameName: string, tagLine: string) => {
    setPlayerTarget({ gameName, tagLine });
    setPrevScreen(screen);
    setScreen("playerProfile");
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
            onViewPlayer={navigateToPlayer}
          />
        );
      case "matchDetail":
        return (
          <MatchDetailScreen
            matchId={selectedMatchId || ""}
            onBack={() => setScreen("profile")}
            onViewPlayer={navigateToPlayer}
          />
        );
      case "playerProfile":
        return playerTarget ? (
          <PublicProfileScreen
            gameName={playerTarget.gameName}
            tagLine={playerTarget.tagLine}
            onBack={() => setScreen(prevScreen)}
          />
        ) : null;
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
