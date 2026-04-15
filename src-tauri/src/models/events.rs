use serde::Serialize;

/// Payload emitted to the frontend as "game_state_updated".
/// All diffs below follow the ORDER (blue) perspective: positive = ORDER ahead.
#[derive(Debug, Clone, Serialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GameStatePayload {
    pub is_game_active: bool,
    pub game_time:      f64,
    pub my_summoner:    String,
    pub my_team:        String,
    pub ally_kills:     u32,
    pub enemy_kills:    u32,
    pub ally_gold:      f64,
    pub enemy_gold:     f64,
    pub ally_xp:        f64,
    pub enemy_xp:       f64,
    pub players:        Vec<PlayerSummary>,

    // ── Feature vector components (ORDER perspective) ────────────────────────
    pub kill_diff:           f32,
    pub level_diff:          f32,
    pub cs_diff:             f32,
    pub tower_diff:          f32,
    pub inhib_diff:          f32,
    pub dragon_diff:         f32,
    pub blue_has_soul:       bool,
    pub red_has_soul:        bool,
    pub blue_elder_active:   bool,
    pub red_elder_active:    bool,
    pub blue_baron_active:   bool,
    pub red_baron_active:    bool,
    pub item_value_diff:     f32,
    pub carry_gold_diff:     f32,
    pub wards_diff:          f32,
    pub grubs_diff:          f32,
    pub top_scaling_diff:    f32,
    pub jungle_scaling_diff: f32,
    pub mid_scaling_diff:    f32,
    pub adc_scaling_diff:    f32,
    pub sup_scaling_diff:    f32,
}

#[derive(Debug, Clone, Serialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PlayerSummary {
    pub summoner_name:  String,
    pub champion_name:  String,
    pub team:           String,
    pub level:          u32,
    pub kills:          u32,
    pub deaths:         u32,
    pub assists:        u32,
    pub cs:             u32,
    pub is_dead:        bool,
    pub respawn_timer:  f64,
    pub spell1_raw:     String,
    pub spell1_display: String,
    pub spell2_raw:     String,
    pub spell2_display: String,
    pub item_ids:       Vec<u32>,
}
