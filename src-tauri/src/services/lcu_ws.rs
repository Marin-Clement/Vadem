use base64::{engine::general_purpose::STANDARD, Engine};
use futures_util::{SinkExt, StreamExt};
use native_tls::TlsConnector;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::time::sleep;
use tokio_tungstenite::{
    connect_async_tls_with_config,
    tungstenite::{client::IntoClientRequest, Message},
    Connector,
};
use tracing::{info, warn};

use crate::commands::lcu::{find_lockfile, read_lockfile, session_to_state, LcuChampSelectSession};

/// Runs forever: waits for League to start, connects the WebSocket, streams
/// champion-select events to the frontend, then loops on disconnect.
pub async fn run(app: AppHandle) {
    loop {
        // Wait until the lockfile exists
        let lf = loop {
            if let Some(path) = find_lockfile() {
                if let Some(lf) = read_lockfile(&path) {
                    break lf;
                }
            }
            sleep(Duration::from_secs(2)).await;
        };

        info!("LCU WS: connecting on port {}", lf.port);
        match connect_and_stream(&app, lf.port, &lf.password).await {
            Ok(_)  => info!("LCU WS: session ended"),
            Err(e) => warn!("LCU WS error: {}", e),
        }

        // Brief pause before trying again (League restarted or WS dropped)
        sleep(Duration::from_secs(3)).await;
    }
}

async fn connect_and_stream(app: &AppHandle, port: u16, password: &str) -> Result<(), String> {
    // TLS connector that accepts the LCU self-signed cert
    let tls = TlsConnector::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| e.to_string())?;

    // Build WS upgrade request with Basic auth
    let auth = STANDARD.encode(format!("riot:{}", password));
    let mut request = format!("wss://127.0.0.1:{}/", port)
        .into_client_request()
        .map_err(|e| e.to_string())?;
    request.headers_mut().insert(
        "Authorization",
        format!("Basic {}", auth)
            .parse()
            .map_err(|e: tokio_tungstenite::tungstenite::http::header::InvalidHeaderValue| e.to_string())?,
    );

    let (mut ws, _) = connect_async_tls_with_config(
        request,
        None,
        false,
        Some(Connector::NativeTls(tls)),
    )
    .await
    .map_err(|e| e.to_string())?;

    info!("LCU WS: connected");

    // Subscribe to all JSON API events — LCU uses "OnJsonApiEvent" (generic),
    // not the per-endpoint variant. We filter by URI inside handle_message.
    let sub = serde_json::json!([5, "OnJsonApiEvent"]).to_string();
    ws.send(Message::Text(sub)).await.map_err(|e| e.to_string())?;

    // Stream incoming messages
    while let Some(msg) = ws.next().await {
        match msg {
            Ok(Message::Text(text)) => handle_message(app, &text),
            Ok(Message::Close(_))   => { info!("LCU WS: closed by server"); break; }
            Ok(_)                   => {} // ping/pong/binary — ignore
            Err(e)                  => { warn!("LCU WS recv error: {}", e); break; }
        }
    }

    Ok(())
}

fn handle_message(app: &AppHandle, text: &str) {
    // LCU message format: [opcode, "OnJsonApiEvent", payload]
    // opcode 8 = event, payload = { data, eventType, uri }
    let arr = match serde_json::from_str::<serde_json::Value>(text) {
        Ok(serde_json::Value::Array(a)) if a.len() >= 3 => a,
        _ => return,
    };

    let payload = &arr[2];

    // Filter to champ-select session events only
    let uri = payload["uri"].as_str().unwrap_or("");
    if uri != "/lol-champ-select/v1/session" {
        return;
    }

    let event_type = payload["eventType"].as_str().unwrap_or("");

    match event_type {
        "Delete" => {
            // Champion select ended
            let _ = app.emit("lcu_champ_select_end", ());
            info!("LCU WS: champ select deleted");
        }
        "Update" | "Create" => {
            let data = &payload["data"];
            match serde_json::from_value::<LcuChampSelectSession>(data.clone()) {
                Ok(session) => {
                    let state = session_to_state(session);
                    let _ = app.emit("lcu_champ_select_update", &state);
                }
                Err(e) => warn!("LCU WS: parse error: {}", e),
            }
        }
        _ => {}
    }
}
