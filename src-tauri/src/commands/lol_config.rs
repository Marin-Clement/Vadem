use serde::Serialize;
use std::path::PathBuf;

/// Values parsed from LoL's game.cfg.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LolConfig {
    /// HUD scale 50–100 (LoL "Interface > HUD Scale"), or None if key absent.
    pub hud_scale: Option<u32>,
    /// Minimap scale 50–150 (LoL "Interface > Minimap Scale"), or None if absent.
    pub minimap_scale: Option<u32>,
    /// Absolute path of the file that was successfully read.
    pub found_at: Option<String>,
}

/// game.cfg is stored under the Riot Games installation dir.
/// LoL can be installed on any drive, so we probe all drive letters plus
/// the Documents fallback that some older installers used.
fn candidate_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    // Try every drive letter for the default Riot Games install location.
    // Note: "C:\" (with backslash) is required for an absolute Windows path;
    // "C:" alone is drive-relative and would produce "C:Riot Games".
    for letter in b'A'..=b'Z' {
        let drive_root = format!("{}:\\", letter as char);
        paths.push(
            PathBuf::from(&drive_root)
                .join("Riot Games")
                .join("League of Legends")
                .join("Config")
                .join("game.cfg"),
        );
    }

    // Legacy / non-standard: Documents folder
    if let Ok(home) = std::env::var("USERPROFILE") {
        for sub in &["Documents", "OneDrive\\Documents"] {
            paths.push(
                PathBuf::from(&home)
                    .join(sub)
                    .join("League of Legends")
                    .join("Config")
                    .join("game.cfg"),
            );
        }
    }

    paths
}

/// Parse a single key from an INI section (case-insensitive section + key).
fn ini_get(content: &str, section: &str, key: &str) -> Option<f64> {
    let mut in_section = false;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            let name = &trimmed[1..trimmed.len() - 1];
            in_section = name.eq_ignore_ascii_case(section);
            continue;
        }
        if !in_section {
            continue;
        }
        if let Some((k, v)) = trimmed.split_once('=') {
            if k.trim().eq_ignore_ascii_case(key) {
                return v.trim().parse::<f64>().ok();
            }
        }
    }
    None
}

/// Convert LoL's 0.0–N.0 internal scale to a display percentage.
///
/// LoL stores both `GlobalScale` (HUD) and `MinimapScale` as floats where
///   0.0 → 50%  (slider minimum)
///   1.0 → 100%
///   2.0 → 150% (minimap maximum)
/// Formula: display% = 50 + raw * 50
fn to_pct(raw: f64, lo: u32, hi: u32) -> u32 {
    ((50.0 + raw * 50.0).round() as u32).clamp(lo, hi)
}

/// Tauri command: find and parse game.cfg, return HUD/minimap scale as %.
#[tauri::command]
pub fn read_lol_config() -> LolConfig {
    for path in candidate_paths() {
        let content = match std::fs::read_to_string(&path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        // [HUD]
        //   GlobalScale   = 0.18   → HUD scale  (50–100 %)
        //   MinimapScale  = 1.00   → Minimap     (50–150 %)
        let hud_scale = ini_get(&content, "HUD", "GlobalScale").map(|v| to_pct(v, 50, 100));
        let minimap_scale = ini_get(&content, "HUD", "MinimapScale").map(|v| to_pct(v, 50, 150));

        return LolConfig {
            hud_scale,
            minimap_scale,
            found_at: Some(path.to_string_lossy().into_owned()),
        };
    }

    LolConfig {
        hud_scale: None,
        minimap_scale: None,
        found_at: None,
    }
}
