use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AllGameData {
    pub active_player: Option<ActivePlayer>,
    pub all_players: Option<Vec<AllPlayer>>,
    pub events: Option<EventsWrapper>,
    pub game_data: Option<GameDataInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ActivePlayer {
    pub summoner_name: String,
    pub level: u32,
    pub current_gold: f64,
    pub team_relative_gold: Option<f64>,
    pub champion_stats: Option<ChampionStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ChampionStats {
    pub ability_power: f64,
    pub armor: f64,
    pub attack_damage: f64,
    pub crit_chance: f64,
    pub magic_resist: f64,
    pub move_speed: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AllPlayer {
    pub summoner_name: String,
    pub champion_name: String,
    pub team: String,
    pub level: u32,
    pub position: Option<String>,
    pub scores: Option<Scores>,
    pub items: Option<Vec<Item>>,
    pub summoner_spells: Option<SummonerSpells>,
    pub is_dead: bool,
    pub respawn_timer: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Scores {
    pub kills: u32,
    pub deaths: u32,
    pub assists: u32,
    pub creep_score: u32,
    pub ward_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Item {
    #[serde(rename = "itemID")]
    pub item_id: u32,
    #[serde(rename = "displayName", default)]
    pub display_name: String,
    pub count: Option<u32>,
    #[serde(default)]
    pub price: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SummonerSpells {
    #[serde(rename = "summonerSpellOne")]
    pub spell_one: Option<SummonerSpell>,
    #[serde(rename = "summonerSpellTwo")]
    pub spell_two: Option<SummonerSpell>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SummonerSpell {
    #[serde(rename = "displayName")]
    pub display_name: String,
    #[serde(rename = "rawDisplayName")]
    pub raw_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EventsWrapper {
    #[serde(rename = "Events")]
    pub events: Option<Vec<GameEvent>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GameEvent {
    #[serde(rename = "EventID")]
    pub event_id: u32,
    #[serde(rename = "EventName")]
    pub event_name: String,
    #[serde(rename = "EventTime")]
    pub event_time: f64,
    #[serde(rename = "KillerName", default)]
    pub killer_name: String,
    #[serde(rename = "VictimName", default)]
    pub victim_name: String,
    #[serde(rename = "Assisters", default)]
    pub assisters: Vec<String>,
    #[serde(rename = "DragonType", default)]
    pub dragon_type: String,
    #[serde(rename = "TurretKilled", default)]
    pub turret_killed: String,
    #[serde(rename = "InhibKilled", default)]
    pub inhib_killed: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct GameDataInfo {
    pub game_time: f64,
    pub map_name: String,
    pub map_number: u32,
    pub map_terrain: String,
}
