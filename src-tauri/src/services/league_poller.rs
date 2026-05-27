use parking_lot::RwLock;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::time::{interval, Duration};
use tracing::{info, warn};

use crate::{
    models::{api::AllGameData, events::GameStatePayload},
    state::game_state::build_payload,
};

const POLL_URL: &str = "https://127.0.0.1:2999/liveclientdata/allgamedata";

pub async fn run(app: AppHandle, last_payload: Arc<RwLock<GameStatePayload>>) {
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true) // League uses a loopback self-signed cert
        .timeout(Duration::from_millis(900))
        .build()
        .expect("Failed to build HTTP client");

    let mut ticker = interval(Duration::from_secs(1));
    let mut was_active = false;

    // Cache active player name across ticks to avoid re-reading from payload
    let mut my_summoner = String::new();

    loop {
        ticker.tick().await;

        match client.get(POLL_URL).send().await {
            Ok(resp) if resp.status().is_success() => {
                match resp.json::<AllGameData>().await {
                    Ok(raw) => {
                        // Latch summoner name on first successful read
                        if my_summoner.is_empty() {
                            if let Some(ap) = &raw.active_player {
                                my_summoner = ap.summoner_name.clone();
                                info!("Active player detected: {}", my_summoner);
                            }
                        }

                        let new_payload = build_payload(&raw, &my_summoner);

                        let changed = {
                            let current = last_payload.read();
                            *current != new_payload
                        };

                        if changed {
                            *last_payload.write() = new_payload.clone();
                            let _ = app.emit("game_state_updated", &new_payload);
                        }

                        was_active = true;
                    }
                    Err(e) => warn!("JSON parse error: {}", e),
                }
            }
            _ => {
                // Game not running or unreachable
                if was_active {
                    let inactive = GameStatePayload::default();
                    *last_payload.write() = inactive.clone();
                    let _ = app.emit("game_state_updated", &inactive);
                    my_summoner.clear();
                    was_active = false;
                    info!("Game disconnected, overlay hidden");
                }
            }
        }
    }
}
