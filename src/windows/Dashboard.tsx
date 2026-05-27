import { useState } from "react";
import { AppShell } from "../components/AppShell";
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
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const renderScreen = () => {
    switch (screen) {
      case "dashboard":
        return (
          <DashboardScreen
            onNavigate={setScreen}
            onSelectMatch={(id) => setSelectedMatchId(id)}
          />
        );
      case "profile":
        return (
          <ProfileScreen
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            onOpenMatchDetail={(id) => { setSelectedMatchId(id); setScreen("matchDetail"); }}
          />
        );
      case "matchDetail":
        return (
          <MatchDetailScreen
            matchId={selectedMatchId || "m-2034"}
            onBack={() => setScreen("profile")}
          />
        );
      case "draft":    return <DraftScreen />;
      case "builds":   return <BuildsScreen />;
      case "macro":    return <MacroScreen />;
      case "overlay":  return <OverlayPreviewScreen />;
      case "settings": return <SettingsScreen />;
      default:         return null;
    }
  };

  return (
    <AppShell screen={screen} onNavigate={setScreen}>
      {renderScreen()}
    </AppShell>
  );
}
