use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::SystemTime,
};
use tauri::State;

// ── Base cooldown table (identical to C# SpellTrackingViewModel) ────────────

fn base_cd(raw_spell: &str, level: u32) -> f64 {
    if raw_spell.contains("Teleport") {
        // Scales: 360s at L1 → 240s at L10+
        if level >= 10 {
            240.0
        } else {
            360.0 - (level as f64 - 1.0) * 13.3
        }
    } else if raw_spell.contains("Flash") {
        300.0
    } else if raw_spell.contains("Ignite") {
        210.0
    } else if raw_spell.contains("Exhaust") {
        210.0
    } else if raw_spell.contains("Heal") {
        210.0
    } else if raw_spell.contains("Haste") {
        210.0
    }
    // Ghost
    else if raw_spell.contains("Boost") {
        210.0
    }
    // Cleanse
    else if raw_spell.contains("Barrier") {
        210.0
    } else if raw_spell.contains("Smite") {
        15.0
    } else if raw_spell.contains("Dot") {
        210.0
    }
    // raw Ignite variant
    else {
        210.0
    }
}

fn apply_haste(cd: f64, item_ids: &[u32]) -> f64 {
    let haste: u32 = item_ids
        .iter()
        .filter(|&&id| id == 3158) // Ionian Boots of Lucidity
        .count() as u32
        * 10;

    if haste > 0 {
        cd * 100.0 / (100.0 + haste as f64)
    } else {
        cd
    }
}

// ── Registry ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct CdEntry {
    used_at: SystemTime,
    base_cd: f64,
}

pub type SpellRegistry = Arc<Mutex<HashMap<String, CdEntry>>>;

pub(crate) fn new_registry() -> SpellRegistry {
    Arc::new(Mutex::new(HashMap::new()))
}

// ── Commands ─────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct MarkSpellRequest {
    summoner_name: String,
    slot: u8, // 0 or 1
    raw_spell: String,
    level: u32,
    item_ids: Vec<u32>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CooldownInfo {
    summoner_name: String,
    slot: u8,
    is_on_cooldown: bool,
    remaining_secs: f64,
}

#[tauri::command]
pub fn mark_spell_used(req: MarkSpellRequest, registry: State<'_, SpellRegistry>) {
    let cd = apply_haste(base_cd(&req.raw_spell, req.level), &req.item_ids);
    let key = format!("{}#{}", req.summoner_name, req.slot);
    let mut map = registry.lock().unwrap();
    map.insert(
        key,
        CdEntry {
            used_at: SystemTime::now(),
            base_cd: cd,
        },
    );
}

#[tauri::command]
pub fn get_spell_cooldowns(registry: State<'_, SpellRegistry>) -> Vec<CooldownInfo> {
    let map = registry.lock().unwrap();
    map.iter()
        .map(|(key, entry)| {
            let elapsed = entry.used_at.elapsed().unwrap_or_default().as_secs_f64();
            let remaining = (entry.base_cd - elapsed).max(0.0);
            let parts: Vec<&str> = key.splitn(2, '#').collect();
            CooldownInfo {
                summoner_name: parts.first().copied().unwrap_or("").to_string(),
                slot: parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(0),
                is_on_cooldown: remaining > 0.0,
                remaining_secs: remaining,
            }
        })
        .collect()
}
