use rdev::{listen, Event, EventType, Key};
use std::sync::mpsc;
use std::thread;
use tauri::{AppHandle, Emitter, Manager};
use tauri::async_runtime;
use tracing::{info, warn};

enum TabEvent {
    Pressed,
    Released,
}

/// Spawns two concurrent workers:
/// 1. An OS-thread running `rdev::listen` (blocks forever — cannot be on a tokio thread).
/// 2. A tokio task draining a channel and emitting Tauri events.
pub fn spawn(app: AppHandle) {
    let (tx, rx) = mpsc::channel::<TabEvent>();

    // ── OS hook thread ───────────────────────────────────────────────────────
    thread::spawn(move || {
        let mut tab_down = false;

        if let Err(e) = listen(move |event: Event| {
            match event.event_type {
                EventType::KeyPress(Key::Tab) if !tab_down => {
                    tab_down = true;
                    let _ = tx.send(TabEvent::Pressed);
                }
                EventType::KeyRelease(Key::Tab) if tab_down => {
                    tab_down = false;
                    let _ = tx.send(TabEvent::Released);
                }
                _ => {}
            }
        }) {
            warn!("rdev listen error: {:?}", e);
        }
    });

    // ── Async drain task ─────────────────────────────────────────────────────
    // Must use tauri's runtime — tokio::spawn panics when called from setup()
    async_runtime::spawn(async move {
        while let Ok(evt) = rx.recv() {
            match evt {
                TabEvent::Pressed => {
                    if let Some(w) = app.get_webview_window("tab-overlay") {
                        let _ = w.show();
                    }
                    let _ = app.emit("tab_pressed", ());
                    info!("TAB pressed — overlay shown");
                }
                TabEvent::Released => {
                    if let Some(w) = app.get_webview_window("tab-overlay") {
                        let _ = w.hide();
                    }
                    let _ = app.emit("tab_released", ());
                }
            }
        }
    });
}
