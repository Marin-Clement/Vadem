# Vadem — VPS Backend Architecture

> **Scope**: everything that does NOT run locally on the player's machine.
> Local: ONNX win inference, LoL Live Client polling (127.0.0.1:2999), keyboard hooks, summoner spell timers.
> Backend: everything else — Riot API bridge, match storage, aggregated stats, AI coach, builds DB, user accounts.

---

## Stack decision

| Layer         | Choice             | Why                                                                                  |
|---------------|--------------------|--------------------------------------------------------------------------------------|
| API server    | **Rust + Axum**    | Same language as Tauri client, near-zero overhead, fearless concurrency, strong type guarantees for LoL data shapes |
| Database      | **PostgreSQL**     | Relational model fits match/player/champion data; JSONB for flexible event payloads  |
| Cache         | **Redis**          | Hot data: champion stats, builds, patch info, session tokens — sub-ms reads          |
| Job queue     | **Tokio tasks** (in-process) → upgrade to **PostgreSQL + SKIP LOCKED** for durability | Avoids extra infra for v1; scales to a proper queue when needed |
| AI Coach LLM  | **Anthropic Claude API** (claude-haiku-4-5 for latency, claude-sonnet-4-6 for deep analysis) | Best reasoning, structured output, prompt caching cuts cost |
| Auth          | **Riot OAuth 2.0 + JWT (RS256)** | Users log in with their Riot account; no passwords to store |
| CDN / assets  | **Bunny CDN** (or Cloudflare R2 + CDN) | Serve champion images, patch assets globally |
| VPS           | **4 vCPU / 8 GB RAM / NVMe SSD** (Hetzner CX41 or Contabo VPS L) | ~€15/mo, enough for 500 concurrent users comfortably |

---

## High-level architecture

```
┌─────────────────────────────────────────────────────────┐
│  Tauri Client (player's PC)                             │
│  ─ Local ONNX model                                     │
│  ─ LoL Live Client poller (127.0.0.1:2999)             │
│  ─ Rust Tauri commands                                  │
│  ─ React dashboard                                      │
└────────────────────┬────────────────────────────────────┘
                     │  HTTPS (REST + WebSocket)
                     ▼
┌─────────────────────────────────────────────────────────┐
│  VPS — Vadem API  (Axum, port 443 via nginx)            │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Auth module │  │ Riot API     │  │ AI Coach       │ │
│  │ (OAuth2/JWT)│  │ bridge       │  │ (Claude API)   │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Match store │  │ Build engine │  │ Draft advisor  │ │
│  │ + analytics │  │ (aggregator) │  │ (ML service)   │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐                     │
│  │ Settings    │  │ Patch / data │                     │
│  │ sync        │  │ dragon sync  │                     │
│  └─────────────┘  └──────────────┘                     │
│                                                         │
│       PostgreSQL ◄──────────────────► Redis            │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
              Riot Games API
         (api.riotgames.com — production key)
```

---

## API surface

Base URL: `https://api.vadem.gg/v1`

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/auth/riot/authorize` | Redirect to Riot OAuth login |
| `GET`  | `/auth/riot/callback`  | Exchange code → access token, issue JWT |
| `POST` | `/auth/refresh`        | Refresh JWT (7-day sliding window) |
| `DELETE` | `/auth/session`      | Logout / revoke token |

The client stores the JWT in Tauri's secure store. All subsequent calls include `Authorization: Bearer <jwt>`.

---

  ### Player / Profile

  | Method | Path | Description |
  |--------|------|-------------|
  | `GET`  | `/players/me`               | Current player profile (summoner info, rank, region) |
  | `GET`  | `/players/me/summary`       | Aggregated stats (winrate, avg KDA, CS/min, LP trend) |
  | `GET`  | `/players/me/champion-pool` | Per-champion stats for the last 30/60/90 days |
  | `GET`  | `/players/me/role-dist`     | Role distribution + winrate per role |
  | `POST` | `/players/me/sync`          | Trigger a full match history pull from Riot API |
  | `GET`  | `/players/{puuid}/profile`  | Another player's public profile (for comparison) |

---

### Match history & analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/matches?limit=20&queue=ranked_solo&champion=Noctis` | Paginated match history with filters |
| `GET`  | `/matches/{matchId}` | Full match detail (timeline events, team stats) |
| `GET`  | `/matches/{matchId}/analysis` | AI Coach analysis of this specific match |
| `POST` | `/matches/ingest`    | Internal endpoint — job worker calls this to store a fetched match |

**Match ingest pipeline**:
1. `POST /matches/ingest` is called by a background Tokio task after Riot API fetch
2. Raw match JSON stored in `matches.raw_data` (JSONB)
3. Computed columns extracted synchronously: KDA, CS, damage, gold, vision, duration
4. Async task queued: AI Coach analysis (Claude) — stored when ready
5. Async task queued: aggregate stats update (champion pool, role stats)

---

### Builds

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/builds/{championId}?vs={enemyChampionId}&patch=14.9` | Best builds for champion, optionally vs a specific matchup |
| `GET`  | `/builds/{championId}/skill-order` | Recommended skill order |
| `GET`  | `/builds/{championId}/runes` | Recommended runes |
| `GET`  | `/builds/{championId}/counters` | Strong vs / weak vs matchup list |

Build data is **not** computed in real-time — it is pre-aggregated nightly from:
- A curated set of high-ELO matches pulled from Riot API (using production key's higher rate limits)
- Stored in `build_aggregates` table with P10/P50/P90 win rates per build path

**Refresh strategy**: cron job runs every patch day (∼14 days), pulls the last 48h of high-ELO games, recomputes aggregates, writes to DB, invalidates Redis cache.

---

### Draft assistant

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/draft/analyze` | Body: `{ blue_picks, red_picks, blue_bans, red_bans, your_role }` → returns win%, suggestions, confidence |
| `GET`  | `/draft/synergies/{championId}` | Champions that synergize with this pick |
| `GET`  | `/draft/counters/{championId}`  | Champions this pick counters / is countered by |

The draft analyzer uses a **pre-computed composition matrix** stored in PostgreSQL:
- For each pair of champions (A vs B), we store `games_played`, `a_wins`, `patch`
- At query time, the Rust service computes a composition score by summing pair-wise advantages
- Response includes `predicted_win_pct`, `confidence` (sample size), and top 3 pick suggestions

---

### AI Coach

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/coach/post-game` | Body: `{ match_id }` → async; client polls or uses WebSocket for result |
| `POST` | `/coach/draft`     | Body: draft state → returns coaching note for the draft |
| `POST` | `/coach/live`      | Body: current game state snapshot → real-time suggestion (used by macro screen) |
| `GET`  | `/coach/insights`  | Weekly pattern digest: "You die between 18-24 min in 73% of games" |

**Claude integration detail**:
- Post-game analysis: `claude-sonnet-4-6` — rich analysis, player-performance breakdown, drill recommendations
- Draft / live: `claude-haiku-4-5` — low latency, structured suggestions
- All prompts use **prompt caching** (system + champion data as cached prefix) to cut costs by ~85%
- Coach "voice" setting (coach / data / hybrid) maps to a system prompt variant stored in the DB

**Rate control**: AI coach calls are debounced per-user (max 1 post-game analysis per 2 minutes, live suggestions max 1 per 10s per game).

---

### Champion data

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/champions`               | Full champion list with roles, tags, abilities summary |
| `GET`  | `/champions/{id}`          | Single champion detail |
| `GET`  | `/champions/{id}/stats`    | Current patch stats: winrate, pickrate, banrate (all ELOs + Diamond+) |
| `GET`  | `/patch/current`           | Current patch version + changelist |
| `GET`  | `/patch/deltas`            | Champions with biggest WR delta vs previous patch |

Champion data syncs from **Riot Data Dragon** on patch day + our own match aggregate stats.

---

### Settings sync

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/settings` | Fetch cloud-synced settings |
| `PUT`  | `/settings` | Upsert settings (theme, AI voice, overlay position, etc.) |

The Tauri client merges cloud settings with local settings on startup (local wins on conflict to avoid jarring overrides while in-game).

---

## PostgreSQL schema (key tables)

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  riot_puuid  TEXT UNIQUE NOT NULL,
  gamename    TEXT NOT NULL,
  tagline     TEXT NOT NULL,
  region      TEXT NOT NULL,    -- EUW1, NA1, etc.
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Matches (raw + computed)
CREATE TABLE matches (
  id               TEXT PRIMARY KEY,  -- Riot match ID
  user_id          UUID REFERENCES users(id),
  played_at        TIMESTAMPTZ NOT NULL,
  queue_id         INTEGER NOT NULL,
  patch            TEXT NOT NULL,
  duration_secs    INTEGER NOT NULL,
  champion_id      TEXT NOT NULL,
  role             TEXT NOT NULL,
  result           BOOLEAN NOT NULL,  -- true = win
  kills            SMALLINT, deaths SMALLINT, assists SMALLINT,
  cs               INTEGER,
  gold             INTEGER,
  damage           INTEGER,
  vision_score     INTEGER,
  prediction_pre   SMALLINT,  -- % at draft time (from AI)
  prediction_peak  SMALLINT,  -- peak % during game
  ai_analysis      JSONB,     -- Claude output: insights, moments, rating
  raw_data         JSONB,     -- Full Riot API response (compressed JSONB)
  indexed_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON matches (user_id, played_at DESC);
CREATE INDEX ON matches (user_id, champion_id, played_at DESC);

-- Champion aggregate stats (recomputed nightly)
CREATE TABLE champion_stats (
  champion_id   TEXT NOT NULL,
  patch         TEXT NOT NULL,
  rank_bucket   TEXT NOT NULL,  -- 'all', 'diamond_plus', 'master_plus'
  role          TEXT NOT NULL,
  games         INTEGER NOT NULL,
  wins          INTEGER NOT NULL,
  picks         INTEGER NOT NULL,
  bans          INTEGER NOT NULL,
  avg_kda       NUMERIC(5,2),
  avg_cs_min    NUMERIC(5,2),
  PRIMARY KEY (champion_id, patch, rank_bucket, role)
);

-- Build aggregates (recomputed on patch day)
CREATE TABLE build_aggregates (
  champion_id   TEXT NOT NULL,
  vs_champion   TEXT,  -- NULL = general
  patch         TEXT NOT NULL,
  rank_bucket   TEXT NOT NULL,
  item_path     TEXT[] NOT NULL,  -- ordered item IDs
  rune_primary  TEXT NOT NULL,
  games         INTEGER NOT NULL,
  wins          INTEGER NOT NULL,
  pick_pct      NUMERIC(5,2),
  PRIMARY KEY (champion_id, patch, rank_bucket, item_path, rune_primary)
);

-- Draft composition matrix
CREATE TABLE draft_matchups (
  champion_a    TEXT NOT NULL,
  champion_b    TEXT NOT NULL,
  patch         TEXT NOT NULL,
  games         INTEGER NOT NULL,
  a_wins        INTEGER NOT NULL,
  PRIMARY KEY (champion_a, champion_b, patch)
);

-- User settings
CREATE TABLE user_settings (
  user_id         UUID PRIMARY KEY REFERENCES users(id),
  theme           TEXT DEFAULT 'dark',
  ai_voice        TEXT DEFAULT 'coach',
  overlay_pos     TEXT DEFAULT 'bottom-right',
  show_win_prob   BOOLEAN DEFAULT true,
  show_timers     BOOLEAN DEFAULT true,
  tts_enabled     BOOLEAN DEFAULT false,
  confidence_min  SMALLINT DEFAULT 72,
  extra           JSONB DEFAULT '{}'::jsonb,  -- future-proof overflow
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Patch log
CREATE TABLE patches (
  version     TEXT PRIMARY KEY,
  released_at DATE NOT NULL,
  changelist  JSONB  -- champion buffs/nerfs extracted from patch notes
);

-- Rate limiting (simple token bucket in Redis, but fallback in PG)
CREATE TABLE rate_limits (
  user_id    UUID REFERENCES users(id),
  endpoint   TEXT,
  window_end TIMESTAMPTZ,
  count      INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, endpoint, window_end)
);
```

---

## Redis key patterns

```
vadem:session:{jwt_jti}               → user_id (TTL = token expiry)
vadem:champ_stats:{patch}:{rank}      → JSON blob (TTL = 24h)
vadem:build:{champion}:{patch}:{rank} → JSON blob (TTL = 24h, invalidated on patch)
vadem:draft_matrix:{patch}            → serialized lookup table (TTL = 14d)
vadem:ratelimit:{user_id}:coach:live  → count (TTL = 10s sliding)
vadem:ratelimit:{user_id}:coach:post  → count (TTL = 2m sliding)
vadem:player_summary:{puuid}          → JSON (TTL = 5min — freshness vs cost tradeoff)
```

---

## Background jobs (Tokio tasks + cron)

| Job | Schedule | Description |
|-----|----------|-------------|
| **Match puller** | Every 5 min | For each active user, check for new matches since last pull; call Riot API; store raw; trigger analysis |
| **Stats aggregator** | Nightly 03:00 UTC | Recompute `champion_stats` from matches table; update Redis |
| **Build aggregator** | Patch day + 6h | Pull high-ELO matches from Riot API for the new patch; compute build win rates; write `build_aggregates` |
| **Patch scraper** | Patch day | Fetch LoL patch notes, extract champion changes with structured LLM call, store in `patches` |
| **Rank syncer** | Every 30 min (when user active) | Re-fetch summoner rank from Riot API (LP fluctuates during sessions) |
| **AI analysis queue** | Continuous worker | Dequeue pending match analysis requests; call Claude; update `matches.ai_analysis` |
| **Cleanup** | Weekly | Archive matches older than 90 days (compress JSONB raw_data) |

---

## Riot API rate limit strategy

Production API key limits: ~20 req/s per region, 100 req/2min.

- Use **per-region rate limiters** (Rust `governor` crate — token bucket)
- Match history: fetch max 20 matches per user sync, prioritize most recent
- Champion stats: batch all champion IDs into one timeline request where possible
- Circuit breaker: if Riot API returns 429, back off exponentially, serve cached data
- All Riot responses cached in Redis for 5 minutes before re-fetching

---

## Security

- **TLS everywhere**: nginx terminates TLS; HTTP/2; HSTS
- **JWT RS256**: asymmetric keys; public key published at `/.well-known/jwks.json`
- **Input validation**: all API inputs validated via `serde` + custom validators in Rust (no raw SQL strings)
- **SQL injection**: impossible — all queries use `sqlx`'s compile-time checked parameterized queries
- **Riot API key**: stored in environment variable, never logged, rotated on key compromise
- **Claude API key**: same as above, wrapped in a Rust service layer; clients never touch it
- **Rate limiting**: per-user, per-endpoint in Redis; hard cap on AI coach calls to control cost
- **CORS**: allowlist only the Tauri app origin (`tauri://localhost`)
- **Secrets**: managed via `.env` file on VPS + HashiCorp Vault (or Infisical) for production

---

## VPS deployment

```
/srv/vadem/
├── api           # Compiled Rust binary (cross-compiled or built on VPS)
├── .env          # Secrets (not in git)
└── migrations/   # SQL migrations (sqlx-cli)

/etc/nginx/sites-enabled/vadem
/etc/systemd/system/vadem-api.service
```

**Deploy flow**:
```
git push → GitHub Actions CI:
  1. cargo test --workspace
  2. cargo build --release --target x86_64-unknown-linux-gnu
  3. scp binary to VPS
  4. systemctl restart vadem-api
  5. sqlx migrate run (zero-downtime with backward-compatible migrations)
```

**Monitoring**: `systemd` journal + Prometheus metrics endpoint (`/metrics`) scraped by a Grafana Cloud free tier.

---

## Feature flag: what requires backend vs what's local

| Feature | Where | Notes |
|---------|-------|-------|
| Win probability (ONNX) | **Local** | Model runs in Rust process, no network |
| Live game polling (2999) | **Local** | Only accessible from player's machine |
| TAB overlay / timers | **Local** | OS-level rendering, no backend needed |
| Spell cooldown tracker | **Local** | In-memory Rust state |
| Keyboard hook | **Local** | `rdev` OS hook |
| Match history | **Backend** | Fetched from Riot API, stored in PG |
| Champion/build data | **Backend** | Aggregated from millions of games |
| Draft advisor | **Backend** | Pre-computed matrix + real-time scoring |
| AI Coach post-game | **Backend** | Claude API call |
| AI Coach live hints | **Backend** | Claude haiku, fast path |
| Ranked snapshot (LP) | **Backend** | Riot API |
| Champion pool stats | **Backend** | Computed from stored matches |
| Patch deltas | **Backend** | Scraped + aggregated |
| Settings sync | **Backend** | PG + Redis |
| Profile comparison | **Backend** | Cross-user Riot API lookup |

---

## Cost estimate (at 500 active users/day)

| Service | Est. cost/month |
|---------|----------------|
| VPS (Hetzner CX41) | ~€16 |
| PostgreSQL (managed, Supabase free / Hetzner DB) | €0–25 |
| Redis (Upstash free tier → Pro at scale) | €0–10 |
| Anthropic Claude (haiku: live/draft; sonnet: post-game) | ~€20–60 depending on usage |
| Bunny CDN (assets) | ~€5 |
| **Total** | **€40–115/month** |

Claude cost breakdown:
- Post-game analysis (sonnet): ~1500 tokens in, 500 out × 500 analyses/day = ~$1.50/day cached
- Live hints (haiku): ~300 tokens × 2000 calls/day = ~$0.20/day
- Prompt caching cuts input costs by ~85% (system prompt + champion data cached per session)
