/* global React */
// =========================================================
// YuumiPal — fictional MOBA data ("RIFTLINE")
// All names original. No real game IP.
// =========================================================

const ROLES = ["TOP", "JNG", "MID", "BOT", "SUP"];

// Original champion roster — invented for this prototype
const CHAMPIONS = [
  // TOP
  { id: "halberd",   name: "Halberd",   role: "TOP", initials: "HL", tags: ["Bruiser","Frontline"] },
  { id: "ironwake",  name: "Ironwake",  role: "TOP", initials: "IW", tags: ["Tank","Engage"] },
  { id: "stormveil", name: "Stormveil", role: "TOP", initials: "SV", tags: ["Skirmisher","Mage"] },
  { id: "atlas",     name: "Atlas",     role: "TOP", initials: "AT", tags: ["Tank"] },
  { id: "rune",      name: "Rune",      role: "TOP", initials: "RN", tags: ["Bruiser"] },

  // JNG
  { id: "vex",       name: "Vex",       role: "JNG", initials: "VX", tags: ["Assassin","Burst"] },
  { id: "thornroot", name: "Thornroot", role: "JNG", initials: "TR", tags: ["Tank","CC"] },
  { id: "wraith",    name: "Wraith",    role: "JNG", initials: "WR", tags: ["Assassin"] },
  { id: "nimbus",    name: "Nimbus",    role: "JNG", initials: "NM", tags: ["Skirmisher"] },
  { id: "kael",      name: "Kael",      role: "JNG", initials: "KL", tags: ["Bruiser"] },

  // MID
  { id: "noctis",    name: "Noctis",    role: "MID", initials: "NC", tags: ["Mage","Burst"] },
  { id: "echo",      name: "Echo",      role: "MID", initials: "EC", tags: ["Mage","Control"] },
  { id: "sable",     name: "Sable",     role: "MID", initials: "SB", tags: ["Assassin"] },
  { id: "lumen",     name: "Lumen",     role: "MID", initials: "LM", tags: ["Mage","Poke"] },
  { id: "aria",      name: "Aria",      role: "MID", initials: "AR", tags: ["Mage"] },

  // BOT
  { id: "quill",     name: "Quill",     role: "BOT", initials: "QL", tags: ["ADC","Hyper"] },
  { id: "talon",     name: "Talon",     role: "BOT", initials: "TL", tags: ["ADC","Lane"] },
  { id: "gale",      name: "Gale",      role: "BOT", initials: "GL", tags: ["ADC","Mobile"] },
  { id: "ember",     name: "Ember",     role: "BOT", initials: "EM", tags: ["ADC","Burst"] },
  { id: "ravel",     name: "Ravel",     role: "BOT", initials: "RV", tags: ["ADC"] },

  // SUP
  { id: "myra",      name: "Myra",      role: "SUP", initials: "MY", tags: ["Enchanter"] },
  { id: "verdant",   name: "Verdant",   role: "SUP", initials: "VR", tags: ["Engage","Tank"] },
  { id: "solace",    name: "Solace",    role: "SUP", initials: "SL", tags: ["Enchanter"] },
  { id: "brace",     name: "Brace",     role: "SUP", initials: "BC", tags: ["Tank","Engage"] },
  { id: "kestrel",   name: "Kestrel",   role: "SUP", initials: "KS", tags: ["Mage","Poke"] },
];

const champById = (id) => CHAMPIONS.find(c => c.id === id);

// Original items
const ITEMS = {
  spectralCore: { id: "spectralCore", name: "Spectral Core", glyph: "SC", tier: "mythic",     desc: "Mythic — Ability haste, magic damage, on-hit echo." },
  ashenBulwark: { id: "ashenBulwark", name: "Ashen Bulwark", glyph: "AB", tier: "legendary",  desc: "Armor, max HP, magic resist on shield expire." },
  voidpiercer:  { id: "voidpiercer",  name: "Voidpiercer",   glyph: "VP", tier: "legendary",  desc: "Lethality, attack damage, percent armor pen." },
  stormcaller:  { id: "stormcaller",  name: "Stormcaller",   glyph: "SK", tier: "legendary",  desc: "Ability power, mana, chain magic damage." },
  emberglass:   { id: "emberglass",   name: "Emberglass",    glyph: "EG", tier: "legendary",  desc: "Magic pen, ability power, burn debuff." },
  thornward:    { id: "thornward",    name: "Thornward",     glyph: "TW", tier: "legendary",  desc: "Armor, HP, reflects basic attacks." },
  silkstride:   { id: "silkstride",   name: "Silkstride",    glyph: "SS", tier: "boots",      desc: "Boots — magic resist." },
  swiftboot:    { id: "swiftboot",    name: "Swiftboot",     glyph: "SB", tier: "boots",      desc: "Boots — movement speed." },
  brawlerfist:  { id: "brawlerfist",  name: "Brawlerfist",   glyph: "BF", tier: "legendary",  desc: "Attack damage, lifesteal, healing on takedown." },
  ironvow:      { id: "ironvow",      name: "Ironvow",       glyph: "IV", tier: "legendary",  desc: "Tank — armor, HP, ally shield aura." },
  hexcatalyst:  { id: "hexcatalyst",  name: "Hex Catalyst",  glyph: "HC", tier: "component",  desc: "Component — ability power, mana." },
  dawnshard:    { id: "dawnshard",    name: "Dawnshard",     glyph: "DS", tier: "component",  desc: "Component — armor, HP." },
};

// Match history — fictional players, fictional MOBA
const MATCHES = [
  {
    id: "m-2034",
    result: "win",
    queue: "Ranked Solo",
    duration: "32:41",
    timestamp: "2h ago",
    champion: "noctis",
    role: "MID",
    kda: { k: 11, d: 3, a: 7 },
    cs: 268,
    csPerMin: 8.2,
    gold: 14820,
    damage: 38420,
    vision: 21,
    items: ["spectralCore", "silkstride", "stormcaller", "emberglass", "hexcatalyst", null],
    prediction: { pre: 56, peak: 88 },
    ally: ["halberd", "vex", "noctis", "quill", "myra"],
    enemy: ["ironwake", "thornroot", "echo", "talon", "verdant"],
    moments: [
      { t: "06:12", text: "Solo kill on Echo at lvl 4 with Spectral Pulse rotation" },
      { t: "14:30", text: "Roamed bot, 2-for-0 secured Ocean Drake" },
      { t: "23:58", text: "Caught Talon in river fog, opened Baron pit" },
    ],
    rating: { value: 9.2, label: "S+" },
  },
  {
    id: "m-2033",
    result: "loss",
    queue: "Ranked Solo",
    duration: "28:14",
    timestamp: "3h ago",
    champion: "noctis",
    role: "MID",
    kda: { k: 5, d: 8, a: 4 },
    cs: 189,
    csPerMin: 6.7,
    gold: 9210,
    damage: 21300,
    vision: 14,
    items: ["spectralCore", "silkstride", "hexcatalyst", null, null, null],
    prediction: { pre: 49, peak: 51 },
    ally: ["rune", "wraith", "noctis", "ember", "brace"],
    enemy: ["atlas", "kael", "sable", "gale", "kestrel"],
    moments: [
      { t: "08:45", text: "Mid lane gank failed, gave 1 kill to Sable" },
      { t: "18:22", text: "Lost mid outer turret while bot was diving" },
    ],
    rating: { value: 5.4, label: "B" },
  },
  {
    id: "m-2032",
    result: "win",
    queue: "Ranked Flex",
    duration: "41:09",
    timestamp: "1d ago",
    champion: "echo",
    role: "MID",
    kda: { k: 7, d: 4, a: 18 },
    cs: 241,
    csPerMin: 5.9,
    gold: 13240,
    damage: 28100,
    vision: 38,
    items: ["stormcaller", "silkstride", "emberglass", "spectralCore", "thornward", "hexcatalyst"],
    prediction: { pre: 62, peak: 79 },
    ally: ["stormveil", "thornroot", "echo", "quill", "solace"],
    enemy: ["halberd", "nimbus", "lumen", "ravel", "verdant"],
    moments: [
      { t: "12:00", text: "Setup Rift Herald with vision control + lockdown chain" },
      { t: "32:14", text: "Game-winning ult on 4 in Baron pit" },
    ],
    rating: { value: 8.1, label: "S" },
  },
  {
    id: "m-2031",
    result: "win",
    queue: "Ranked Solo",
    duration: "26:55",
    timestamp: "1d ago",
    champion: "lumen",
    role: "MID",
    kda: { k: 14, d: 2, a: 6 },
    cs: 215,
    csPerMin: 8.0,
    gold: 13900,
    damage: 31280,
    vision: 16,
    items: ["spectralCore", "swiftboot", "emberglass", "stormcaller", null, null],
    prediction: { pre: 52, peak: 91 },
    ally: ["ironwake", "vex", "lumen", "talon", "myra"],
    enemy: ["rune", "thornroot", "aria", "ember", "brace"],
    moments: [
      { t: "02:40", text: "First blood on invade with Vex" },
      { t: "11:15", text: "Solo kill on Aria at lvl 6" },
    ],
    rating: { value: 9.6, label: "S+" },
  },
  {
    id: "m-2030",
    result: "loss",
    queue: "Ranked Solo",
    duration: "35:22",
    timestamp: "2d ago",
    champion: "noctis",
    role: "MID",
    kda: { k: 8, d: 6, a: 9 },
    cs: 256,
    csPerMin: 7.3,
    gold: 13120,
    damage: 33450,
    vision: 22,
    items: ["spectralCore", "silkstride", "stormcaller", "emberglass", null, null],
    prediction: { pre: 51, peak: 64 },
    ally: ["atlas", "kael", "noctis", "quill", "verdant"],
    enemy: ["halberd", "wraith", "echo", "gale", "solace"],
    moments: [
      { t: "20:30", text: "Threw Ocean Drake fight, caught out 1v3" },
    ],
    rating: { value: 6.8, label: "A" },
  },
  {
    id: "m-2029",
    result: "win",
    queue: "Normal",
    duration: "23:18",
    timestamp: "2d ago",
    champion: "aria",
    role: "MID",
    kda: { k: 9, d: 1, a: 5 },
    cs: 184,
    csPerMin: 7.9,
    gold: 11430,
    damage: 24780,
    vision: 12,
    items: ["stormcaller", "silkstride", "emberglass", null, null, null],
    prediction: { pre: 58, peak: 95 },
    ally: ["halberd", "thornroot", "aria", "talon", "myra"],
    enemy: ["rune", "vex", "noctis", "ember", "kestrel"],
    moments: [
      { t: "09:30", text: "5/0 by 10 minutes — perfect lane snowball" },
    ],
    rating: { value: 8.8, label: "S" },
  },
];

// Recent objectives in current "live" game
const LIVE_OBJECTIVES = [
  { id: "drake",    name: "Ocean Drake",  desc: "Stacks heal regen for the team",  iconBg: "oklch(0.45 0.10 215)", glyph: "OC", time: 92,  urgent: true,  prio: "HIGH" },
  { id: "herald",   name: "Rift Herald",  desc: "Pushes lanes, breaks turrets",   iconBg: "oklch(0.45 0.18 25)",  glyph: "RH", time: 0,   urgent: true,  prio: "TAKE NOW", ready: true },
  { id: "voidcrab", name: "Void Crab",    desc: "Vision + minor gold",            iconBg: "oklch(0.40 0.14 295)", glyph: "VC", time: 38,  urgent: false, prio: "MED" },
  { id: "baron",    name: "Ancient Baron",desc: "Empowers minions, late-game pivot", iconBg: "oklch(0.45 0.14 75)",  glyph: "AB", time: 318, urgent: false, prio: "LOW" },
];

// Sparkline data — winrate over last 30 days
const SPARK_DATA = [52, 48, 51, 55, 58, 54, 60, 59, 62, 65, 61, 64, 68, 66, 70, 72, 69, 73, 71, 74, 72, 76, 74, 78, 75, 79, 77, 81, 79, 82];

// Summary stats
const PLAYER = {
  handle: "Wraithcaller",
  tag: "EUW",
  level: 287,
  rank: { tier: "Diamond", division: "II", lp: 64 },
  region: "Europe West",
  mainRole: "MID",
  winrate: 58,
  games: 142,
  streak: 3,
  hours: 412,
};

// Make global
Object.assign(window, {
  ROLES, CHAMPIONS, champById, ITEMS, MATCHES, LIVE_OBJECTIVES, SPARK_DATA, PLAYER
});
