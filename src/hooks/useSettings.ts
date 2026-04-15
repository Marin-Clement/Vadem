import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface AppSettings {
  showWinPrediction: boolean;
  pollIntervalMs:    number;
  tabOverlayLeft:    number;  // 0–100 percent
  tabOverlayTop:     number;  // 0–100 percent
}

const defaults: AppSettings = {
  showWinPrediction: true,
  pollIntervalMs:    1000,
  tabOverlayLeft:    70,
  tabOverlayTop:     8,
};

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<AppSettings>("get_settings")
      .then((s) => setSettingsState({ ...defaults, ...s }))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = useCallback(async (next: Partial<AppSettings>) => {
    const merged = { ...settings, ...next };
    setSettingsState(merged);
    await invoke("save_settings", { settings: merged });
  }, [settings]);

  return { settings, saveSettings, loading };
}
