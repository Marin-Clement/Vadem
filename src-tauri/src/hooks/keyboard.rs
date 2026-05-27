use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Shortcut, ShortcutState};
use tracing::info;

/// Enregistre la touche TAB globalement via le plugin officiel de Tauri v2.
pub fn spawn(app: AppHandle) {
    // Dans la v2 officielle, un Shortcut se crée avec (Modifiers, Code)
    // Aucun modificateur (None) + la touche physique Tab (Code::Tab)
    let tab_shortcut = Shortcut::new(None, Code::Tab);

    info!("Registering native global keyboard listener for [TAB] key.");

    // Enregistrement du gestionnaire de raccourci
    let _ = app.global_shortcut().on_shortcut(tab_shortcut, move |app_handle, shortcut, event| {
        // On s'assure que c'est bien notre touche Tab qui a déclenché l'événement
        if shortcut.key == Code::Tab {
            match event.state() {
                ShortcutState::Pressed => {
                    // Affiche la fenêtre d'overlay
                    if let Some(w) = app_handle.get_webview_window("tab-overlay") {
                        let _ = w.show();
                    }
                    // Émet l'événement vers le frontend
                    let _ = app_handle.emit("tab_pressed", ());
                    info!("TAB pressed — overlay shown");
                }
                ShortcutState::Released => {
                    // Masque la fenêtre d'overlay
                    if let Some(w) = app_handle.get_webview_window("tab-overlay") {
                        let _ = w.hide();
                    }
                    // Émet l'événement vers le frontend
                    let _ = app_handle.emit("tab_released", ());
                    info!("TAB released — overlay hidden");
                }
            }
        }
    });
}