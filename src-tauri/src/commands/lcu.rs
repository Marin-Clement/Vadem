use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LcuTeamSlot {
    pub champion_id: i32,
    pub position: String,
    pub is_me: bool,
    pub summoner_id: i64,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LcuChampSelectState {
    pub my_team: Vec<LcuTeamSlot>,
    pub their_team: Vec<LcuTeamSlot>,
    pub my_team_bans: Vec<i32>,
    pub their_team_bans: Vec<i32>,
    pub phase: String, // "PLANNING", "BAN_PICK", "FINALIZATION", ""
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LcuSessionTeamMember {
    champion_id: i32,
    #[serde(default)]
    assigned_position: String,
    #[serde(default)]
    summoner_id: i64,
    #[serde(default)]
    is_self: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LcuBans {
    #[serde(default)]
    my_team_bans: Vec<i32>,
    #[serde(default)]
    their_team_bans: Vec<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LcuChampSelectSession {
    #[serde(default)]
    my_team: Vec<LcuSessionTeamMember>,
    #[serde(default)]
    their_team: Vec<LcuSessionTeamMember>,
    #[serde(default)]
    bans: Option<LcuBans>,
    #[serde(default)]
    timer: Option<LcuTimer>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LcuTimer {
    #[serde(default)]
    phase: String,
}

struct Lockfile {
    port: u16,
    password: String,
}

fn find_lockfile() -> Option<PathBuf> {
    // macOS paths
    let candidates = vec![
        // Installed via Riot Client on Mac
        dirs::home_dir().map(|h| h.join("Library/Application Support/Riot Games/League of Legends/lockfile")),
        // Alternative install location
        Some(PathBuf::from("/Applications/League of Legends.app/Contents/LoL/lockfile")),
    ];

    for candidate in candidates.into_iter().flatten() {
        if candidate.exists() {
            return Some(candidate);
        }
    }
    None
}

fn read_lockfile(path: &PathBuf) -> Option<Lockfile> {
    // Format: LeagueClient:{pid}:{port}:{password}:{protocol}
    let content = std::fs::read_to_string(path).ok()?;
    let parts: Vec<&str> = content.trim().split(':').collect();
    if parts.len() < 5 {
        return None;
    }
    let port: u16 = parts[2].parse().ok()?;
    let password = parts[3].to_string();
    Some(Lockfile { port, password })
}

/// Tauri command: read current champion select state from League Client
#[tauri::command]
pub async fn get_lcu_champ_select() -> Result<LcuChampSelectState, String> {
    let lockfile_path = find_lockfile()
        .ok_or_else(|| "League Client not running (lockfile not found)".to_string())?;

    let lf = read_lockfile(&lockfile_path)
        .ok_or_else(|| "Failed to parse lockfile".to_string())?;

    // Build a client that accepts self-signed certs (LCU uses one)
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!("https://127.0.0.1:{}/lol/champ-select/v1/session", lf.port);
    let resp = client
        .get(&url)
        .basic_auth("riot", Some(&lf.password))
        .send()
        .await
        .map_err(|e| format!("LCU request failed: {}", e))?;

    if resp.status() == 404 {
        return Err("Not in champion select".to_string());
    }
    if !resp.status().is_success() {
        return Err(format!("LCU returned HTTP {}", resp.status()));
    }

    let session: LcuChampSelectSession = resp
        .json()
        .await
        .map_err(|e| format!("LCU parse error: {}", e))?;

    let to_slot = |m: &LcuSessionTeamMember| LcuTeamSlot {
        champion_id: m.champion_id,
        position: m.assigned_position.clone(),
        is_me: m.is_self,
        summoner_id: m.summoner_id,
    };

    let bans = session.bans.as_ref();

    Ok(LcuChampSelectState {
        my_team: session.my_team.iter().map(to_slot).collect(),
        their_team: session.their_team.iter().map(to_slot).collect(),
        my_team_bans: bans.map(|b| b.my_team_bans.clone()).unwrap_or_default(),
        their_team_bans: bans.map(|b| b.their_team_bans.clone()).unwrap_or_default(),
        phase: session.timer.map(|t| t.phase).unwrap_or_default(),
    })
}
