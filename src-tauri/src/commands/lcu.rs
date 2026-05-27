use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// ── Public output types ───────────────────────────────────────────────────────

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LcuTeamSlot {
    pub champion_id: i32,
    pub champion_pick_intent: i32,
    pub position: String,
    pub is_me: bool,
    pub summoner_id: i64,
    pub cell_id: i32,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LcuChampSelectState {
    pub my_team: Vec<LcuTeamSlot>,
    pub their_team: Vec<LcuTeamSlot>,
    pub my_team_bans: Vec<i32>,
    pub their_team_bans: Vec<i32>,
    pub phase: String,
    pub local_player_cell_id: i32,
}

// ── Internal LCU deserialization types (pub(crate) for lcu_ws service) ────────

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LcuSessionTeamMember {
    #[serde(default)]
    pub(crate) cell_id: i32,
    #[serde(default)]
    pub(crate) champion_id: i32,
    #[serde(default)]
    pub(crate) champion_pick_intent: i32,
    #[serde(default)]
    pub(crate) assigned_position: String,
    #[serde(default)]
    pub(crate) summoner_id: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LcuBans {
    #[serde(default)]
    pub(crate) my_team_bans: Vec<i32>,
    #[serde(default)]
    pub(crate) their_team_bans: Vec<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LcuTimer {
    #[serde(default)]
    pub(crate) phase: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LcuChampSelectSession {
    #[serde(default)]
    pub(crate) local_player_cell_id: i32,
    #[serde(default)]
    pub(crate) my_team: Vec<LcuSessionTeamMember>,
    #[serde(default)]
    pub(crate) their_team: Vec<LcuSessionTeamMember>,
    #[serde(default)]
    pub(crate) bans: Option<LcuBans>,
    #[serde(default)]
    pub(crate) timer: Option<LcuTimer>,
}

// ── Lockfile (pub(crate) for lcu_ws service) ──────────────────────────────────

pub(crate) struct Lockfile {
    pub(crate) port: u16,
    pub(crate) password: String,
}

#[cfg(target_os = "windows")]
fn find_lockfile_via_process() -> Option<PathBuf> {
    let output = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "(Get-Process -Name 'LeagueClientUx' -ErrorAction SilentlyContinue | Select-Object -First 1).Path",
        ])
        .output()
        .ok()?;

    let exe_path = String::from_utf8_lossy(&output.stdout);
    let exe_path = exe_path.trim();
    if exe_path.is_empty() {
        return None;
    }

    let lockfile = PathBuf::from(exe_path).parent()?.join("lockfile");
    if lockfile.exists() { Some(lockfile) } else { None }
}

#[cfg(not(target_os = "windows"))]
fn find_lockfile_via_process() -> Option<PathBuf> {
    None
}

pub(crate) fn find_lockfile() -> Option<PathBuf> {
    if let Some(p) = find_lockfile_via_process() {
        return Some(p);
    }

    let candidates: Vec<Option<PathBuf>> = vec![
        Some(PathBuf::from(r"C:\Riot Games\League of Legends\lockfile")),
        Some(PathBuf::from(r"D:\Riot Games\League of Legends\lockfile")),
        std::env::var("LOCALAPPDATA").ok().map(|p| {
            PathBuf::from(p).join("Riot Games").join("League of Legends").join("lockfile")
        }),
        std::env::var("ProgramFiles").ok().map(|p| {
            PathBuf::from(p).join("Riot Games").join("League of Legends").join("lockfile")
        }),
        dirs::home_dir()
            .map(|h| h.join("Library/Application Support/Riot Games/League of Legends/lockfile")),
        Some(PathBuf::from("/Applications/League of Legends.app/Contents/LoL/lockfile")),
    ];

    for candidate in candidates.into_iter().flatten() {
        if candidate.exists() {
            return Some(candidate);
        }
    }
    None
}

pub(crate) fn read_lockfile(path: &PathBuf) -> Option<Lockfile> {
    let content = std::fs::read_to_string(path).ok()?;
    let parts: Vec<&str> = content.trim().split(':').collect();
    if parts.len() < 5 {
        return None;
    }
    Some(Lockfile {
        port: parts[2].parse().ok()?,
        password: parts[3].to_string(),
    })
}

/// Convert a parsed LCU session into the serialisable output type.
pub(crate) fn session_to_state(session: LcuChampSelectSession) -> LcuChampSelectState {
    let local_cell = session.local_player_cell_id;
    let to_slot = |m: &LcuSessionTeamMember| LcuTeamSlot {
        cell_id:              m.cell_id,
        champion_id:          m.champion_id,
        champion_pick_intent: m.champion_pick_intent,
        position:             m.assigned_position.clone(),
        is_me:                m.cell_id == local_cell,
        summoner_id:          m.summoner_id,
    };
    let bans = session.bans.as_ref();
    LcuChampSelectState {
        local_player_cell_id: local_cell,
        my_team:     session.my_team.iter().map(to_slot).collect(),
        their_team:  session.their_team.iter().map(to_slot).collect(),
        my_team_bans:   bans.map(|b| b.my_team_bans.clone()).unwrap_or_default(),
        their_team_bans: bans.map(|b| b.their_team_bans.clone()).unwrap_or_default(),
        phase: session.timer.map(|t| t.phase).unwrap_or_default(),
    }
}

// ── Debug command ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn debug_lcu() -> String {
    let mut out = String::new();

    out.push_str("=== LeagueClientUx.exe process scan ===\n");
    #[cfg(target_os = "windows")]
    {
        match std::process::Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command",
                "(Get-Process -Name 'LeagueClientUx' -ErrorAction SilentlyContinue | Select-Object -First 1).Path"])
            .output()
        {
            Ok(o) => {
                let stdout = String::from_utf8_lossy(&o.stdout);
                let stderr = String::from_utf8_lossy(&o.stderr);
                out.push_str(&format!("  stdout: {:?}\n", stdout.trim()));
                if !stderr.is_empty() {
                    out.push_str(&format!("  stderr: {:?}\n", stderr.trim()));
                }
            }
            Err(e) => out.push_str(&format!("  PowerShell error: {}\n", e)),
        }
    }
    #[cfg(not(target_os = "windows"))]
    out.push_str("  (not Windows)\n");

    out.push_str("\n=== Static lockfile path candidates ===\n");
    let candidates: Vec<(&str, Option<PathBuf>)> = vec![
        ("C:\\Riot Games\\LoL\\lockfile",     Some(PathBuf::from(r"C:\Riot Games\League of Legends\lockfile"))),
        ("D:\\Riot Games\\LoL\\lockfile",     Some(PathBuf::from(r"D:\Riot Games\League of Legends\lockfile"))),
        ("LOCALAPPDATA/Riot/LoL/lockfile",    std::env::var("LOCALAPPDATA").ok().map(|p| PathBuf::from(p).join("Riot Games").join("League of Legends").join("lockfile"))),
        ("ProgramFiles/Riot/LoL/lockfile",    std::env::var("ProgramFiles").ok().map(|p| PathBuf::from(p).join("Riot Games").join("League of Legends").join("lockfile"))),
        ("macOS Library/Riot/LoL/lockfile",   dirs::home_dir().map(|h| h.join("Library/Application Support/Riot Games/League of Legends/lockfile"))),
    ];
    for (label, path) in &candidates {
        match path {
            None    => out.push_str(&format!("  {} → env var not set\n", label)),
            Some(p) => out.push_str(&format!("  {} → {} [{}]\n", label, p.display(),
                if p.exists() { "EXISTS" } else { "not found" })),
        }
    }

    out.push_str("\n=== Lockfile resolve ===\n");
    let lockfile_path = find_lockfile();
    match &lockfile_path {
        None    => { out.push_str("  FAILED: no lockfile found\n"); return out; }
        Some(p) => out.push_str(&format!("  Found: {}\n", p.display())),
    }
    let lockfile_path = lockfile_path.unwrap();

    match std::fs::read_to_string(&lockfile_path) {
        Err(e) => { out.push_str(&format!("  Read error: {}\n", e)); return out; }
        Ok(content) => {
            out.push_str(&format!("  Raw content: {:?}\n", content.trim()));
            let parts: Vec<&str> = content.trim().split(':').collect();
            out.push_str(&format!("  Parts count: {}\n", parts.len()));
            for (i, p) in parts.iter().enumerate() {
                out.push_str(&format!("    [{}] {}\n", i, if i == 3 { "***" } else { p }));
            }
        }
    }

    out.push_str("\n=== Lockfile parse ===\n");
    let lf = match read_lockfile(&lockfile_path) {
        None    => { out.push_str("  FAILED: could not parse lockfile\n"); return out; }
        Some(lf) => { out.push_str(&format!("  port: {}\n  password: ***\n", lf.port)); lf }
    };

    out.push_str("\n=== LCU HTTP request ===\n");
    let url = format!("https://127.0.0.1:{}/lol-champ-select/v1/session", lf.port);
    out.push_str(&format!("  URL: {}\n", url));

    let client = match reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(3))
        .build()
    {
        Err(e) => { out.push_str(&format!("  Client build error: {}\n", e)); return out; }
        Ok(c) => c,
    };

    match client.get(&url).basic_auth("riot", Some(&lf.password)).send().await {
        Err(e) => out.push_str(&format!("  Request error: {}\n", e)),
        Ok(resp) => {
            out.push_str(&format!("  HTTP status: {}\n", resp.status()));
            match resp.text().await {
                Err(e) => out.push_str(&format!("  Body read error: {}\n", e)),
                Ok(body) => {
                    let snippet = if body.len() > 400 { &body[..400] } else { &body };
                    out.push_str(&format!("  Body (first 400): {}\n", snippet));
                }
            }
        }
    }

    out
}

// ── Tauri command ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_lcu_champ_select() -> Result<LcuChampSelectState, String> {
    let lockfile_path = find_lockfile()
        .ok_or_else(|| "League Client not running (lockfile not found)".to_string())?;

    let lf = read_lockfile(&lockfile_path)
        .ok_or_else(|| "Failed to parse lockfile".to_string())?;

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    let url = format!("https://127.0.0.1:{}/lol-champ-select/v1/session", lf.port);
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

    let raw_body = resp.text().await.map_err(|e| format!("LCU read error: {}", e))?;
    let session: LcuChampSelectSession = serde_json::from_str(&raw_body)
        .map_err(|e| format!("LCU parse error: {} — body snippet: {:.200}", e, &raw_body))?;

    Ok(session_to_state(session))
}
