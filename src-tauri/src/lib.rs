pub mod commands;
pub mod hooks;
pub mod models;
pub mod services;
pub mod state;

use std::sync::Arc;
use parking_lot::RwLock;
use tauri::Manager;
use tracing_subscriber::EnvFilter;

use commands::{
    inference::predict_win,
    lol_config::read_lol_config,
    settings::{get_settings, save_settings, set_overlay_clickthrough},
    spells::{get_spell_cooldowns, mark_spell_used, new_registry},
};
use models::events::GameStatePayload;
use services::{league_poller, ml_service::MlService};

pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::new("yuumipal=info"))
        .init();

    // ort rc.12 requires an explicit global environment init before any Session
    // is created. Without this, type.rs hits `not yet implemented` panics.
    let _ort_ok = ort::init().with_name("yuumipal").commit();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            // ── Shared game state ────────────────────────────────────────────
            let game_state: Arc<RwLock<GameStatePayload>> =
                Arc::new(RwLock::new(GameStatePayload::default()));
            app.manage(game_state.clone());

            // ── Spell cooldown registry ──────────────────────────────────────
            app.manage(new_registry());

            // ── ONNX model ───────────────────────────────────────────────────
            // In dev mode resource_dir() == target/debug/ (no auto-copy).
            // Use CARGO_MANIFEST_DIR (src-tauri/) to reach the project root at
            // compile time; fall back to resource_dir() in release builds.
            let model_path = if cfg!(debug_assertions) {
                std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .parent()
                    .expect("project root not found")
                    .join("yuumipal_win_model.onnx")
            } else {
                app.path()
                    .resource_dir()
                    .expect("resource dir not found")
                    .join("yuumipal_win_model.onnx")
            };

            match MlService::load(model_path.to_str().unwrap()) {
                Ok(ml) => { app.manage(ml); }
                Err(e) => tracing::warn!("ONNX model load failed: {e} — predictions disabled"),
            }

            // ── Tab overlay: click-through by default ────────────────────────
            if let Some(w) = app.get_webview_window("tab-overlay") {
                let _ = w.set_ignore_cursor_events(true);
            }

            // ── Spawn league poller ──────────────────────────────────────────
            let handle = app.handle().clone();
            let state_ref = game_state.clone();
            tauri::async_runtime::spawn(async move {
                league_poller::run(handle, state_ref).await;
            });

            // ── Spawn keyboard hook ──────────────────────────────────────────
            hooks::keyboard::spawn(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            predict_win,
            get_settings,
            save_settings,
            set_overlay_clickthrough,
            mark_spell_used,
            get_spell_cooldowns,
            read_lol_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
