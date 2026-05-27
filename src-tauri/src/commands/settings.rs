use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "settings.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub show_win_prediction: bool,
    pub poll_interval_ms: u64,
    /// Tab overlay panel position — percentage of screen width/height (0–100)
    pub tab_overlay_left: f64,
    pub tab_overlay_top: f64,
    /// Timers overlay position — percentage of screen width/height (0–100)
    pub timers_overlay_left: f64,
    pub timers_overlay_top: f64,
    /// LoL "UI Scale" setting (50–100, matches in-game slider).
    /// Used only for the layout preview; does not affect LoL itself.
    pub hud_scale: u32,
    /// LoL minimap scale (50–150, matches in-game minimap slider).
    pub minimap_scale: u32,
    /// Overlay corner: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    pub overlay_pos: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            show_win_prediction: true,
            poll_interval_ms: 1000,
            tab_overlay_left: 70.0,
            tab_overlay_top: 8.0,
            // ~top-right corner (208px panel on 1920px screen ≈ 88% left, ~1.5% top)
            timers_overlay_left: 88.0,
            timers_overlay_top: 1.5,
            hud_scale: 100,
            minimap_scale: 100,
            overlay_pos: "top-right".to_string(),
        }
    }
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let settings = store
        .get("settings")
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    Ok(settings)
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    store.set(
        "settings",
        serde_json::to_value(settings).map_err(|e| e.to_string())?,
    );
    store.save().map_err(|e| e.to_string())
}

/// Enable or disable click-through on an overlay window by label.
/// `window_label` e.g. "tab-overlay" or "timers-overlay".
#[tauri::command]
pub fn set_overlay_clickthrough(
    app: AppHandle,
    window_label: String,
    enabled: bool,
) -> Result<(), String> {
    app.get_webview_window(&window_label)
        .ok_or_else(|| format!("window '{}' not found", window_label))?
        .set_ignore_cursor_events(enabled)
        .map_err(|e| e.to_string())
}
