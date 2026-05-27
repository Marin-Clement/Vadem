// =========================================================
// YuumiPal — mock data (real LoL champion/item names)
// Will be replaced by live Riot API data once backend is up
// =========================================================

export interface Champion {
  id: string;
  name: string;
  role: "TOP" | "JNG" | "MID" | "BOT" | "SUP";
  initials: string;
  tags: string[];
}

export interface Item {
  id: string;
  name: string;
  glyph: string;
  tier: "mythic" | "legendary" | "boots" | "component";
  desc: string;
}

export interface MatchMoment {
  t: string;
  text: string;
}

export interface Match {
  id: string;
  result: "win" | "loss";
  queue: string;
  duration: string;
  timestamp: string;
  champion: string;
  role: string;
  kda: { k: number; d: number; a: number };
  cs: number;
  csPerMin: number;
  gold: number;
  damage: number;
  vision: number;
  items: (string | null)[];
  prediction: { pre: number; peak: number };
  ally: string[];
  enemy: string[];
  moments: MatchMoment[];
  rating: { value: number; label: string };
}

export interface LiveObjective {
  id: string;
  name: string;
  desc: string;
  iconBg: string;
  glyph: string;
  time: number;
  urgent: boolean;
  prio: string;
  ready?: boolean;
}

export interface Player {
  handle: string;
  tag: string;
  level: number;
  rank: { tier: string; division: string; lp: number };
  region: string;
  mainRole: string;
  winrate: number;
  games: number;
  streak: number;
  hours: number;
}

export const CHAMPIONS: Champion[] = [
  // TOP
  { id: "darius",    name: "Darius",    role: "TOP", initials: "DA", tags: ["Fighter","Bruiser"] },
  { id: "malphite",  name: "Malphite",  role: "TOP", initials: "MP", tags: ["Tank","Engage"] },
  { id: "fiora",     name: "Fiora",     role: "TOP", initials: "FI", tags: ["Skirmisher","Duelist"] },
  { id: "camille",   name: "Camille",   role: "TOP", initials: "CM", tags: ["Skirmisher","Dive"] },
  { id: "ksante",    name: "K'Sante",   role: "TOP", initials: "KS", tags: ["Tank","Bruiser"] },
  // JNG
  { id: "vi",        name: "Vi",        role: "JNG", initials: "VI", tags: ["Fighter","Dive"] },
  { id: "leesin",    name: "Lee Sin",   role: "JNG", initials: "LS", tags: ["Skirmisher","Assassin"] },
  { id: "hecarim",   name: "Hecarim",   role: "JNG", initials: "HE", tags: ["Skirmisher","Engage"] },
  { id: "amumu",     name: "Amumu",     role: "JNG", initials: "AM", tags: ["Tank","CC"] },
  { id: "khazix",    name: "Kha'Zix",   role: "JNG", initials: "KZ", tags: ["Assassin","Burst"] },
  // MID
  { id: "syndra",    name: "Syndra",    role: "MID", initials: "SY", tags: ["Mage","Burst"] },
  { id: "ahri",      name: "Ahri",      role: "MID", initials: "AH", tags: ["Mage","Assassin"] },
  { id: "zed",       name: "Zed",       role: "MID", initials: "ZD", tags: ["Assassin","Burst"] },
  { id: "viktor",    name: "Viktor",    role: "MID", initials: "VT", tags: ["Mage","Control"] },
  { id: "orianna",   name: "Orianna",   role: "MID", initials: "OR", tags: ["Mage","Control"] },
  // BOT
  { id: "jinx",      name: "Jinx",      role: "BOT", initials: "JX", tags: ["ADC","Hyper"] },
  { id: "caitlyn",   name: "Caitlyn",   role: "BOT", initials: "CL", tags: ["ADC","Lane"] },
  { id: "ezreal",    name: "Ezreal",    role: "BOT", initials: "EZ", tags: ["ADC","Mobile"] },
  { id: "kaisa",     name: "Kai'Sa",    role: "BOT", initials: "KA", tags: ["ADC","Dive"] },
  { id: "jhin",      name: "Jhin",      role: "BOT", initials: "JH", tags: ["ADC","Burst"] },
  // SUP
  { id: "lulu",      name: "Lulu",      role: "SUP", initials: "LU", tags: ["Enchanter","Support"] },
  { id: "thresh",    name: "Thresh",    role: "SUP", initials: "TH", tags: ["Engage","Hook"] },
  { id: "nautilus",  name: "Nautilus",  role: "SUP", initials: "NT", tags: ["Tank","Engage"] },
  { id: "soraka",    name: "Soraka",    role: "SUP", initials: "SO", tags: ["Enchanter","Healer"] },
  { id: "leona",     name: "Leona",     role: "SUP", initials: "LN", tags: ["Tank","Engage"] },
];

export const champById = (id: string): Champion | undefined =>
  CHAMPIONS.find(c => c.id === id);

export const ITEMS: Record<string, Item> = {
  ludens:       { id: "ludens",       name: "Luden's Tempest",     glyph: "LT", tier: "mythic",    desc: "Ability power, haste, magic pen. Echo: Q/W/E/R hits echo on nearby enemies." },
  shadowflame:  { id: "shadowflame",  name: "Shadowflame",         glyph: "SF", tier: "mythic",    desc: "Ability power, magic pen. Cinderbloom: spells deal bonus damage on shields and low-HP enemies." },
  triforce:     { id: "triforce",     name: "Trinity Force",       glyph: "TF", tier: "mythic",    desc: "AD, attack speed, haste. Spellblade: next auto after spell deals bonus damage." },
  rabadons:     { id: "rabadons",     name: "Rabadon's Deathcap",  glyph: "RD", tier: "legendary", desc: "Massive AP boost. Increases total ability power by 35%." },
  zhonyas:      { id: "zhonyas",      name: "Zhonya's Hourglass",  glyph: "ZH", tier: "legendary", desc: "Ability power, armor. Stasis: become invulnerable for 2.5s." },
  voidstaff:    { id: "voidstaff",    name: "Void Staff",          glyph: "VS", tier: "legendary", desc: "Ability power, 45% magic penetration." },
  infinityedge: { id: "infinityedge", name: "Infinity Edge",       glyph: "IE", tier: "legendary", desc: "Attack damage, crit. Critical strikes deal 40% bonus damage." },
  mortal:       { id: "mortal",       name: "Mortal Reminder",     glyph: "MO", tier: "legendary", desc: "Attack damage, armor pen, grevious wounds on hit." },
  warmogs:      { id: "warmogs",      name: "Warmog's Armor",      glyph: "WA", tier: "legendary", desc: "HP, regeneration. Regen 5% max HP every 5s out of combat." },
  sorcshoes:    { id: "sorcshoes",    name: "Sorcerer's Shoes",    glyph: "SS", tier: "boots",     desc: "Boots — magic penetration." },
  tabis:        { id: "tabis",        name: "Plated Steelcaps",    glyph: "TC", tier: "boots",     desc: "Boots — armor, reduces auto attack damage taken by 12%." },
  blasting:     { id: "blasting",     name: "Blasting Wand",       glyph: "BW", tier: "component", desc: "Component — ability power." },
  serrated:     { id: "serrated",     name: "Serrated Dirk",       glyph: "SD", tier: "component", desc: "Component — attack damage, lethality." },
};

export const MATCHES: Match[] = [
  {
    id: "m-2034", result: "win", queue: "Ranked Solo", duration: "32:41", timestamp: "2h ago",
    champion: "syndra", role: "MID", kda: { k: 11, d: 3, a: 7 },
    cs: 268, csPerMin: 8.2, gold: 14820, damage: 38420, vision: 21,
    items: ["ludens", "sorcshoes", "rabadons", "voidstaff", "zhonyas", "blasting"],
    prediction: { pre: 56, peak: 88 },
    ally:  ["darius",   "vi",      "syndra", "jinx",    "lulu"],
    enemy: ["malphite", "hecarim", "ahri",   "caitlyn", "thresh"],
    moments: [
      { t: "06:12", text: "Solo kill on Ahri at lvl 4 — Q-E stun into all-in" },
      { t: "14:30", text: "Roamed bot, 2-for-0 secured Infernal Dragon" },
      { t: "23:58", text: "Caught Caitlyn in river, opened Baron pit" },
    ],
    rating: { value: 9.2, label: "S+" },
  },
  {
    id: "m-2033", result: "loss", queue: "Ranked Solo", duration: "28:14", timestamp: "3h ago",
    champion: "syndra", role: "MID", kda: { k: 5, d: 8, a: 4 },
    cs: 189, csPerMin: 6.7, gold: 9210, damage: 21300, vision: 14,
    items: ["ludens", "sorcshoes", "blasting", null, null, null],
    prediction: { pre: 49, peak: 51 },
    ally:  ["ksante",   "khazix", "syndra", "ezreal", "nautilus"],
    enemy: ["darius",   "amumu",  "zed",    "jhin",   "leona"],
    moments: [
      { t: "08:45", text: "Mid lane gank failed, gave first blood to Zed" },
      { t: "18:22", text: "Lost mid outer turret while bot was diving" },
    ],
    rating: { value: 5.4, label: "B" },
  },
  {
    id: "m-2032", result: "win", queue: "Ranked Flex", duration: "41:09", timestamp: "1d ago",
    champion: "orianna", role: "MID", kda: { k: 7, d: 4, a: 18 },
    cs: 241, csPerMin: 5.9, gold: 13240, damage: 28100, vision: 38,
    items: ["ludens", "sorcshoes", "rabadons", "shadowflame", "warmogs", "blasting"],
    prediction: { pre: 62, peak: 79 },
    ally:  ["camille",  "hecarim", "orianna", "jinx",  "soraka"],
    enemy: ["darius",   "vi",      "viktor",  "kaisa", "thresh"],
    moments: [
      { t: "12:00", text: "Setup Rift Herald with vision + Command: Shockwave on 3" },
      { t: "32:14", text: "Game-winning R on 4 targets in Baron pit" },
    ],
    rating: { value: 8.1, label: "S" },
  },
  {
    id: "m-2031", result: "win", queue: "Ranked Solo", duration: "26:55", timestamp: "1d ago",
    champion: "viktor", role: "MID", kda: { k: 14, d: 2, a: 6 },
    cs: 215, csPerMin: 8.0, gold: 13900, damage: 31280, vision: 16,
    items: ["ludens", "sorcshoes", "rabadons", "voidstaff", null, null],
    prediction: { pre: 52, peak: 91 },
    ally:  ["malphite", "vi",    "viktor", "caitlyn", "lulu"],
    enemy: ["ksante",   "amumu", "ahri",   "ezreal",  "nautilus"],
    moments: [
      { t: "02:40", text: "First blood on invade with Vi" },
      { t: "11:15", text: "Solo kill on Ahri at lvl 6 with Death Ray + W stun" },
    ],
    rating: { value: 9.6, label: "S+" },
  },
  {
    id: "m-2030", result: "loss", queue: "Ranked Solo", duration: "35:22", timestamp: "2d ago",
    champion: "syndra", role: "MID", kda: { k: 8, d: 6, a: 9 },
    cs: 256, csPerMin: 7.3, gold: 13120, damage: 33450, vision: 22,
    items: ["ludens", "sorcshoes", "rabadons", "voidstaff", null, null],
    prediction: { pre: 51, peak: 64 },
    ally:  ["darius",   "leesin", "syndra", "jinx",    "thresh"],
    enemy: ["malphite", "khazix", "viktor", "caitlyn", "soraka"],
    moments: [
      { t: "20:30", text: "Threw Infernal Drake fight, caught out 1v3 in river" },
    ],
    rating: { value: 6.8, label: "A" },
  },
  {
    id: "m-2029", result: "win", queue: "Normal", duration: "23:18", timestamp: "2d ago",
    champion: "ahri", role: "MID", kda: { k: 9, d: 1, a: 5 },
    cs: 184, csPerMin: 7.9, gold: 11430, damage: 24780, vision: 12,
    items: ["shadowflame", "sorcshoes", "rabadons", null, null, null],
    prediction: { pre: 58, peak: 95 },
    ally:  ["darius",  "hecarim", "ahri",   "jhin",    "lulu"],
    enemy: ["camille", "khazix",  "syndra", "caitlyn", "leona"],
    moments: [
      { t: "09:30", text: "5/0 by 10 minutes — Spirit Rush roam into bot net 2 kills" },
    ],
    rating: { value: 8.8, label: "S" },
  },
];

export const LIVE_OBJECTIVES: LiveObjective[] = [
  { id: "dragon",  name: "Infernal Dragon",  desc: "Stacks bonus AD and AP permanently",           iconBg: "oklch(0.45 0.18 25)",  glyph: "DR", time: 92,  urgent: true,  prio: "HIGH" },
  { id: "herald",  name: "Rift Herald",      desc: "Pushes lanes and destroys turrets fast",       iconBg: "oklch(0.45 0.16 295)", glyph: "RH", time: 0,   urgent: true,  prio: "TAKE NOW", ready: true },
  { id: "grub",    name: "Void Grub",        desc: "Voidmite siege damage + Baron empowerment",    iconBg: "oklch(0.40 0.14 295)", glyph: "VG", time: 38,  urgent: false, prio: "MED" },
  { id: "baron",   name: "Baron Nashor",     desc: "Empowers minions, massive late-game swing",    iconBg: "oklch(0.45 0.14 75)",  glyph: "BN", time: 318, urgent: false, prio: "LOW" },
];

export const SPARK_DATA = [52, 48, 51, 55, 58, 54, 60, 59, 62, 65, 61, 64, 68, 66, 70, 72, 69, 73, 71, 74, 72, 76, 74, 78, 75, 79, 77, 81, 79, 82];

export const PLAYER: Player = {
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
