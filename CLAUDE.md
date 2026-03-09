# slum vibes — a collection of silly little apps

## Vision
Personal vibe-coded project hub. Each app is a small, opinionated, fun thing — built fast, with personality. The index page is a mood board / personal homepage that reflects the vibe of the crew behind it.

## Commands
- `pnpm dev` — Start dev server (localhost:5173)
- `pnpm build` — Type-check + production build
- `pnpm preview` — Preview production build
- `python3 scripts/fetch-images.py` — Fetch Unsplash images for a batch of countries (cuisine app)

## Architecture
Multi-app site with React Router. Each app lives at its own route. Index page at `/` lists all apps.

**Previously**: single-page cuisine explorer at `vibe-cuisine.abhay.fyi` (repo: `vibe-cuisine`). Migrated to `slum-vibes` monorepo with multi-app routing. Cuisine now lives at `/cuisine`. Old domain redirects there on Cloudflare.

### Stack
Vite + React 19 + TypeScript + TailwindCSS v3 + React Router v7 + framer-motion + shadcn/ui

### Routing
- `src/main.tsx` — BrowserRouter + Routes setup
- `src/pages/IndexPage.tsx` — Home launcher with photo strips + app cards
- `src/pages/CuisinePage.tsx` — Route wrapper for `/cuisine`
- Add new apps as: `src/pages/NewAppPage.tsx` + route in `main.tsx` + entry in `IndexPage.tsx` apps array

### Index page (`/`)
Dark ambient homepage with dual infinite-scrolling polaroid film strips (personal photos).
- Top strip scrolls left (32s), bottom strip scrolls right (28s)
- Polaroids: white border + pb-8 for the classic polaroid look, subtle drop shadow, deterministic tilts
- Seamless loop: each strip's image list is duplicated, animation runs `-50%` translateX
- Edge fades via gradient overlays (left/right sides of each strip)
- Keyframes in `src/index.css`: `scroll-left` / `scroll-right`
- Photos live in `assets/` (originals, EXIF-stripped, scrambled filenames) and `public/vibes/` (800px web thumbnails)
- To add photos: run `python3 -c "..."` to resize to 800px longest-side → `public/vibes/`, add filename to STRIP_1 or STRIP_2 arrays in IndexPage.tsx

### Cuisine app (`/cuisine`)
- `src/App.tsx` — Root cuisine component
- `src/data/countries.ts` — 158 countries, each with description, keyIngredients, signatureDishes, images, funFact
- `src/data/countryRegionMap.ts` — ISO numeric country code → culinary region ID
- `src/data/regions.ts` — 12 culinary regions with name and color
- `src/components/WorldMap.tsx` — SVG map via react-simple-maps, geoNaturalEarth1 projection
- `src/components/RegionModal.tsx` — Country detail modal (dishes, ingredients, gallery, fun fact)
- `src/components/Sidebar.tsx` — Left drawer with search + region-grouped country list
- `src/components/Header.tsx` — Title bar with sidebar toggle (left) and theme toggle (right)
- `src/hooks/useMapInteraction.ts` — selected/hovered country state
- `src/hooks/useScrollDrag.ts` — drag-to-pan on the map container
- `src/hooks/useTheme.ts` — dark/light mode with localStorage persistence

### Map data (cuisine)
- TopoJSON from `cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`
- Country IDs are ISO 3166-1 numeric codes (e.g. `'840'` = USA)
- Map fills use `withAlpha(hex, alpha)` over a `var(--ocean)` SVG rect background

### Images (cuisine)
- Stored as flat `images[]` on each country (up to 25 per country)
- Fetched via Unsplash API (`"{country} food"` query, 25 results)
- `scripts/fetch-images.py` handles batch fetching — update `BATCH` dict and run
- 32 countries still have no images (low Unsplash coverage for obscure nations)
- Gallery hidden automatically when `images.length === 0`

### Strava app (`/strava`)
- `src/pages/StravaPage.tsx` — activity feed (primary) + leaderboard tabs, localStorage caching
- `functions/api/strava/_shared.ts` — shared `parseRoasts` helper
- `functions/api/strava/activities.ts` — returns `club_activities` KV
- `functions/api/strava/athletes.ts` — returns `club_scraped` KV
- `functions/api/strava/activity-roasts.ts` — per-activity AI roasts, batched + cached in KV
- `functions/api/strava/roast.ts` — per-person AI roasts, cached in KV
- `scripts/sync-strava-club.mjs` — daily sync: fetches club members + activities, writes KV
- `.github/workflows/sync-strava.yml` — cron at 6am UTC, runs sync script

**Data flow:** No OAuth connect flow. One account (athlete `199191837`) is pre-authorized.
GitHub Actions syncs daily using stored tokens + Strava club API (club `1954938`).
Frontend reads from KV, caches in localStorage with versioned keys.

**KV keys:**
- `athlete:199191837` — stored OAuth token for the sync account
- `club_scraped` — `{ scraped_at, athletes[] }` — leaderboard data (stats.totals shape)
- `club_activities` — `{ updated_at, activities[] }` — full activity list (up to 600)
- `activity_roasts` — `{ [activityId]: roastString }` — per-activity roast cache
- `roast_cache` — `{ roasts: { [firstname]: string }, generated_at }` — per-person roast cache
- `roast_prompt` — optional custom system prompt (shared by both roast endpoints)

**Cloudflare bindings required** (set in Pages project settings):
- KV namespace: `STRAVA_KV` (id: `b3039d030a994346bb7b165dcbd86140`)
- AI binding: `AI`
- Env vars: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`

**Local dev:**
- `pnpm dev:full` — vite watch + wrangler pages dev on localhost:8788
- Seed local KV before testing: `LOCAL=1 STRAVA_CLUB_ID=1954938 STRAVA_ATHLETE_ID=199191837 node scripts/sync-strava-club.mjs`
- CF Workers AI returns 502 in local dev — roasts won't generate locally, test on deployed site
- To give a collaborator Cloudflare access: dash.cloudflare.com → API Tokens → "Edit Cloudflare Workers" template → add `CLOUDFLARE_API_TOKEN=xxx` to their `.env.local`

**GitHub Actions secrets required:** `CF_API_TOKEN`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`
- `CF_API_TOKEN` — create at dash.cloudflare.com → API Tokens → "Edit Cloudflare Workers" template
- Wrangler in CI reads it as `CLOUDFLARE_API_TOKEN` env var automatically

**Useful KV commands:**
```bash
# Seed local KV for dev
LOCAL=1 STRAVA_CLUB_ID=1954938 STRAVA_ATHLETE_ID=199191837 node scripts/sync-strava-club.mjs
# Seed remote KV manually (same as GitHub Actions)
STRAVA_CLUB_ID=1954938 STRAVA_ATHLETE_ID=199191837 node scripts/sync-strava-club.mjs
# Set a custom roast prompt
npx wrangler kv key put --remote --namespace-id=b3039d030a994346bb7b165dcbd86140 roast_prompt "your prompt"
# Force-clear roast caches
npx wrangler kv key delete --remote --namespace-id=b3039d030a994346bb7b165dcbd86140 roast_cache
npx wrangler kv key delete --remote --namespace-id=b3039d030a994346bb7b165dcbd86140 activity_roasts
# List all KV keys
npx wrangler kv key list --remote --namespace-id=b3039d030a994346bb7b165dcbd86140
```

**AI model:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (Cloudflare AI free tier, hits remote even in local dev)

**Strava API gotchas:**
- Club activities (`/clubs/{id}/activities`) return `ClubActivity` — no `start_date`, no athlete ID, lastname truncated to initial (e.g. `"K."`)
- Match activities to members by `firstname + lastname[0]` — build a `Map` for O(n) lookup, not O(n×m) filter
- Sandbox limit (1 connected athlete) bypassed by using club endpoints with one pre-authorized member account

**Wrangler gotchas:**
- `wrangler pages dev` does NOT support `--remote` flag (v4) — local KV is always a simulation
- `wrangler kv key get/put` without `--remote` targets local simulation, not production — always pass `--remote` for prod
- localStorage cache keys must be versioned (e.g. `sv_athletes_v2`) when data shape changes — stale cache causes runtime crashes

### Deployment
- Cloudflare Pages: build command `pnpm build`, output dir `dist`, install command `pnpm install`
- Repo: https://github.com/hayabhay/slum-vibes
- Live: https://slum-vibes.abhay.fyi
- Cuisine was previously at `vibe-cuisine.abhay.fyi` — reroute to `/cuisine` on Cloudflare

## Conventions
- Use `import type` for type-only imports (verbatimModuleSyntax is enabled)
- Package manager: pnpm (not npm)
- Region colors defined in `regions.ts`
- Ocean color shared via CSS var `--ocean` between header bg and SVG rect
- `[&_svg]:size-auto` needed on Button when overriding icon size (shadcn forces `size-4` on all SVGs)
- Personal photos: always EXIF-strip and scramble filenames before committing (see assets/ workflow above)
