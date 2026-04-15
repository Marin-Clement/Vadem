import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";

export interface AppSettings {
  showWinPrediction:  boolean;
  pollIntervalMs:     number;
  tabOverlayLeft:     number;  // 0–100 percent
  tabOverlayTop:      number;  // 0–100 percent
  timersOverlayLeft:  number;  // 0–100 percent
  timersOverlayTop:   number;  // 0–100 percent
  /** LoL "UI Scale" setting (50–100). Used for the layout preview. */
  hudScale:           number;
  /** LoL minimap scale (50–150). Used for the layout preview. */
  minimapScale:       number;
}

const defaults: AppSettings = {
  showWinPrediction:  true,
  pollIntervalMs:     1000,
  tabOverlayLeft:     70,
  tabOverlayTop:      8,
  timersOverlayLeft:  88,
  timersOverlayTop:   1.5,
  hudScale:           100,
  minimapScale:       100,
};

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<AppSettings>("get_settings")
      .then((s) => setSettingsState({ ...defaults, ...s }))
      .finally(() => setLoading(false));

    // Keep in sync when another window (e.g. Dashboard) saves settings
    const unlisten = listen<AppSettings>("settings_changed", (e) => {
      setSettingsState({ ...defaults, ...e.payload });
    });
    return () => { unlisten.then((f) => f()); };
  }, []);

  const saveSettings = useCallback(async (next: Partial<AppSettings>) => {
    const merged = { ...settings, ...next };
    setSettingsState(merged);
    await invoke("save_settings", { settings: merged });
    // Broadcast to all windows (TabOverlay, TimersOverlay, etc.)
    await emit("settings_changed", merged);
  }, [settings]);

  return { settings, saveSettings, loading };
}
