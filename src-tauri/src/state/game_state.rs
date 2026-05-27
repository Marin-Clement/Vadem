use std::collections::HashMap;
use std::sync::OnceLock;

use crate::models::{
    api::{AllGameData, AllPlayer, GameEvent},
    events::{GameStatePayload, PlayerSummary},
};

// ── Champion scaling data (embedded at compile time) ────────────────────────

static SCALING: OnceLock<HashMap<String, f32>> = OnceLock::new();

fn scaling_map() -> &'static HashMap<String, f32> {
    SCALING.get_or_init(|| {
        serde_json::from_str(include_str!("../../champ_scaling.json")).unwrap_or_default()
    })
}

fn get_scaling(champ: &str) -> f32 {
    *scaling_map().get(champ).unwrap_or(&5.0)
}

fn team_scaling(players: &[&AllPlayer], position: &str) -> f32 {
    players
        .iter()
        .find(|p| p.position.as_deref() == Some(position))
        .map(|p| get_scaling(&p.champion_name))
        .unwrap_or(5.0)
}

// ── Name matching (handles Riot ID "Name#Tag" format) ───────────────────────

fn names_match(a: &str, b: &str) -> bool {
    if a == b {
        return true;
    }
    let a_base = a.split('#').next().unwrap_or(a);
    let b_base = b.split('#').next().unwrap_or(b);
    a_base.eq_ignore_ascii_case(b_base)
}

// ── Event → team resolution ──────────────────────────────────────────────────

fn event_team(evt: &GameEvent, players: &[AllPlayer]) -> Option<String> {
    if !evt.killer_name.is_empty() {
        if let Some(p) = players
            .iter()
            .find(|p| names_match(&p.summoner_name, &evt.killer_name))
        {
            return Some(p.team.clone());
        }
    }
    for assister in &evt.assisters {
        if let Some(p) = players
            .iter()
            .find(|p| names_match(&p.summoner_name, assister))
        {
            return Some(p.team.clone());
        }
    }
    None
}

// ── Payload builder ──────────────────────────────────────────────────────────

pub fn build_payload(data: &AllGameData, my_summoner: &str) -> GameStatePayload {
    let players_raw: &[AllPlayer] = data.all_players.as_deref().unwrap_or_default();
    let game_time = data.game_data.as_ref().map_or(0.0, |g| g.game_time);
    let events: &[GameEvent] = data
        .events
        .as_ref()
        .and_then(|e| e.events.as_deref())
        .unwrap_or_default();

    // ── Team identity ────────────────────────────────────────────────────────
    let my_team = players_raw
        .iter()
        .find(|p| names_match(&p.summoner_name, my_summoner))
        .map(|p| p.team.clone())
        .unwrap_or_default();

    let my_is_order = my_team == "ORDER";
    let order_players: Vec<&AllPlayer> = players_raw.iter().filter(|p| p.team == "ORDER").collect();
    let chaos_players: Vec<&AllPlayer> = players_raw.iter().filter(|p| p.team == "CHAOS").collect();

    // ── Kills ────────────────────────────────────────────────────────────────
    let sum_kills = |ps: &[&AllPlayer]| -> u32 {
        ps.iter()
            .filter_map(|p| p.scores.as_ref())
            .map(|s| s.kills)
            .sum()
    };
    let order_kills = sum_kills(&order_players);
    let chaos_kills = sum_kills(&chaos_players);
    let ally_kills = if my_is_order {
        order_kills
    } else {
        chaos_kills
    };
    let enemy_kills = if my_is_order {
        chaos_kills
    } else {
        order_kills
    };

    // ── Levels + CS ──────────────────────────────────────────────────────────
    let order_levels: u32 = order_players.iter().map(|p| p.level).sum();
    let chaos_levels: u32 = chaos_players.iter().map(|p| p.level).sum();
    let order_cs: u32 = order_players
        .iter()
        .filter_map(|p| p.scores.as_ref())
        .map(|s| s.creep_score)
        .sum();
    let chaos_cs: u32 = chaos_players
        .iter()
        .filter_map(|p| p.scores.as_ref())
        .map(|s| s.creep_score)
        .sum();

    // ── Ward score ───────────────────────────────────────────────────────────
    let order_wards: f64 = order_players
        .iter()
        .filter_map(|p| p.scores.as_ref())
        .map(|s| s.ward_score)
        .sum();
    let chaos_wards: f64 = chaos_players
        .iter()
        .filter_map(|p| p.scores.as_ref())
        .map(|s| s.ward_score)
        .sum();

    // ── Item value & carry gold diff ─────────────────────────────────────────
    let player_item_value = |p: &AllPlayer| -> u32 {
        p.items
            .as_deref()
            .unwrap_or_default()
            .iter()
            .map(|i| i.price)
            .sum::<u32>()
    };
    let mut order_vals: Vec<u32> = order_players.iter().map(|p| player_item_value(p)).collect();
    let mut chaos_vals: Vec<u32> = chaos_players.iter().map(|p| player_item_value(p)).collect();
    order_vals.sort_unstable_by(|a, b| b.cmp(a));
    chaos_vals.sort_unstable_by(|a, b| b.cmp(a));

    let item_value_diff =
        order_vals.iter().sum::<u32>() as f32 - chaos_vals.iter().sum::<u32>() as f32;
    let carry_gold_diff = order_vals.iter().take(2).sum::<u32>() as f32
        - chaos_vals.iter().take(2).sum::<u32>() as f32;

    // ── Tower diff (weighted by tier, ported from C# WinProbabilityViewModel) ─
    let tier_weight = |count: u32| -> f32 {
        match count {
            0 => 3.0,
            1 => 5.0,
            2 => 7.0,
            _ => 9.0,
        }
    };
    let mut order_lane: HashMap<String, u32> = HashMap::new();
    let mut chaos_lane: HashMap<String, u32> = HashMap::new();
    let mut order_tower_score: f32 = 0.0;
    let mut chaos_tower_score: f32 = 0.0;

    for t in events.iter().filter(|e| e.event_name == "TurretKilled") {
        let tn = t.turret_killed.to_ascii_lowercase();
        let lane = t
            .turret_killed
            .split('_')
            .find(|s| {
                s.len() == 2
                    && s.starts_with('L')
                    && s.chars().nth(1).map_or(false, |c| c.is_ascii_digit())
            })
            .unwrap_or("?")
            .to_string();

        if tn.contains("tchaos") {
            let c = order_lane.entry(lane).or_insert(0);
            order_tower_score += tier_weight(*c);
            *c += 1;
        } else if tn.contains("torder") {
            let c = chaos_lane.entry(lane).or_insert(0);
            chaos_tower_score += tier_weight(*c);
            *c += 1;
        }
    }
    let tower_diff = order_tower_score - chaos_tower_score;

    // ── Inhib diff ───────────────────────────────────────────────────────────
    // positive = ORDER winning (CHAOS inhibs down > ORDER inhibs down)
    let chaos_inhibs: usize = events
        .iter()
        .filter(|e| {
            e.event_name == "InhibKilled"
                && e.inhib_killed.to_ascii_lowercase().contains("tchaos")
                && game_time - e.event_time < 300.0
        })
        .count();
    let order_inhibs: usize = events
        .iter()
        .filter(|e| {
            e.event_name == "InhibKilled"
                && e.inhib_killed.to_ascii_lowercase().contains("torder")
                && game_time - e.event_time < 300.0
        })
        .count();
    let inhib_diff = chaos_inhibs as f32 - order_inhibs as f32;

    // ── Dragon / soul ────────────────────────────────────────────────────────
    let order_dragons = events
        .iter()
        .filter(|e| {
            e.event_name == "DragonKill"
                && e.dragon_type != "Elder"
                && event_team(e, players_raw).as_deref() == Some("ORDER")
        })
        .count();
    let chaos_dragons = events
        .iter()
        .filter(|e| {
            e.event_name == "DragonKill"
                && e.dragon_type != "Elder"
                && event_team(e, players_raw).as_deref() == Some("CHAOS")
        })
        .count();
    let dragon_diff = order_dragons as f32 - chaos_dragons as f32;
    let blue_has_soul = order_dragons >= 4;
    let red_has_soul = chaos_dragons >= 4;

    // ── Elder ────────────────────────────────────────────────────────────────
    let blue_elder_active = events.iter().any(|e| {
        e.event_name == "DragonKill"
            && e.dragon_type == "Elder"
            && event_team(e, players_raw).as_deref() == Some("ORDER")
            && game_time - e.event_time < 150.0
    });
    let red_elder_active = events.iter().any(|e| {
        e.event_name == "DragonKill"
            && e.dragon_type == "Elder"
            && event_team(e, players_raw).as_deref() == Some("CHAOS")
            && game_time - e.event_time < 150.0
    });

    // ── Baron ────────────────────────────────────────────────────────────────
    let blue_baron_active = events.iter().any(|e| {
        e.event_name == "BaronKill"
            && event_team(e, players_raw).as_deref() == Some("ORDER")
            && game_time - e.event_time < 180.0
    });
    let red_baron_active = events.iter().any(|e| {
        e.event_name == "BaronKill"
            && event_team(e, players_raw).as_deref() == Some("CHAOS")
            && game_time - e.event_time < 180.0
    });

    // ── Grubs ────────────────────────────────────────────────────────────────
    let order_grubs = events
        .iter()
        .filter(|e| {
            e.event_name == "HordeKill" && event_team(e, players_raw).as_deref() == Some("ORDER")
        })
        .count();
    let chaos_grubs = events
        .iter()
        .filter(|e| {
            e.event_name == "HordeKill" && event_team(e, players_raw).as_deref() == Some("CHAOS")
        })
        .count();
    let grubs_diff = order_grubs as f32 - chaos_grubs as f32;

    // ── Scaling diffs (time-weighted) ────────────────────────────────────────
    let time_weight = (game_time as f32 / 60.0) / 30.0;
    let top_scaling_diff =
        (team_scaling(&order_players, "TOP") - team_scaling(&chaos_players, "TOP")) * time_weight;
    let jungle_scaling_diff = (team_scaling(&order_players, "JUNGLE")
        - team_scaling(&chaos_players, "JUNGLE"))
        * time_weight;
    let mid_scaling_diff = (team_scaling(&order_players, "MIDDLE")
        - team_scaling(&chaos_players, "MIDDLE"))
        * time_weight;
    let adc_scaling_diff = (team_scaling(&order_players, "BOTTOM")
        - team_scaling(&chaos_players, "BOTTOM"))
        * time_weight;
    let sup_scaling_diff = (team_scaling(&order_players, "UTILITY")
        - team_scaling(&chaos_players, "UTILITY"))
        * time_weight;

    // ── Player summaries ─────────────────────────────────────────────────────
    let to_summary = |p: &AllPlayer| PlayerSummary {
        summoner_name: p.summoner_name.clone(),
        champion_name: p.champion_name.clone(),
        team: p.team.clone(),
        level: p.level,
        kills: p.scores.as_ref().map_or(0, |s| s.kills),
        deaths: p.scores.as_ref().map_or(0, |s| s.deaths),
        assists: p.scores.as_ref().map_or(0, |s| s.assists),
        cs: p.scores.as_ref().map_or(0, |s| s.creep_score),
        is_dead: p.is_dead,
        respawn_timer: p.respawn_timer,
        spell1_raw: p
            .summoner_spells
            .as_ref()
            .and_then(|s| s.spell_one.as_ref())
            .map(|s| s.raw_name.clone())
            .unwrap_or_default(),
        spell1_display: p
            .summoner_spells
            .as_ref()
            .and_then(|s| s.spell_one.as_ref())
            .map(|s| s.display_name.clone())
            .unwrap_or_default(),
        spell2_raw: p
            .summoner_spells
            .as_ref()
            .and_then(|s| s.spell_two.as_ref())
            .map(|s| s.raw_name.clone())
            .unwrap_or_default(),
        spell2_display: p
            .summoner_spells
            .as_ref()
            .and_then(|s| s.spell_two.as_ref())
            .map(|s| s.display_name.clone())
            .unwrap_or_default(),
        item_ids: p
            .items
            .as_deref()
            .unwrap_or_default()
            .iter()
            .map(|i| i.item_id)
            .collect(),
    };

    let players: Vec<PlayerSummary> = players_raw.iter().map(to_summary).collect();

    GameStatePayload {
        is_game_active: true,
        game_time,
        my_summoner: my_summoner.to_string(),
        my_team: my_team.clone(),
        ally_kills,
        enemy_kills,
        ally_gold: data.active_player.as_ref().map_or(0.0, |p| p.current_gold),
        enemy_gold: 0.0,
        ally_xp: 0.0,
        enemy_xp: 0.0,
        players,
        // Feature vector components (all ORDER perspective)
        kill_diff: order_kills as f32 - chaos_kills as f32,
        level_diff: order_levels as f32 - chaos_levels as f32,
        cs_diff: order_cs as f32 - chaos_cs as f32,
        tower_diff,
        inhib_diff,
        dragon_diff,
        blue_has_soul,
        red_has_soul,
        blue_elder_active,
        red_elder_active,
        blue_baron_active,
        red_baron_active,
        item_value_diff,
        carry_gold_diff,
        wards_diff: order_wards as f32 - chaos_wards as f32,
        grubs_diff,
        top_scaling_diff,
        jungle_scaling_diff,
        mid_scaling_diff,
        adc_scaling_diff,
        sup_scaling_diff,
    }
}
