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
- `src/pages/StravaPage.tsx` — leaderboard + daily roast UI
- `functions/api/strava/auth.ts` — redirects to Strava OAuth
- `functions/api/strava/callback.ts` — exchanges code, stores tokens in KV
- `functions/api/strava/athletes.ts` — fetches all athletes' stats (refreshes tokens on demand)
- `functions/api/strava/roast.ts` — generates daily AI roast via Cloudflare AI, cached in KV

**Onboarding:** each person visits `/strava` and clicks "+ connect" once. OAuth stores their tokens in KV permanently.

**KV keys:**
- `athlete_ids` — JSON array of connected athlete IDs
- `athlete:{id}` — `{ access_token, refresh_token, expires_at, athlete: { id, firstname, lastname, profile } }`
- `roast_cache` — `{ roast, generated_at }` — regenerated once per 24h (first page load of the day triggers it)
- `roast_prompt` — optional custom system prompt for the roast (falls back to default if not set)

**Cloudflare bindings required** (set in Pages project settings):
- KV namespace: `STRAVA_KV` (id: `b3039d030a994346bb7b165dcbd86140`)
- AI binding: `AI`
- Env vars: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`

**Local dev:**
- `pnpm build && pnpm pages:dev` — builds frontend then serves via wrangler on localhost:8788
- `.env.local` must have `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`
- OAuth callback goes to prod (`slum-vibes.abhay.fyi`) — test OAuth on deployed site, everything else locally

**Useful KV commands:**
```bash
# Set a custom roast prompt
npx wrangler kv key put --binding=STRAVA_KV roast_prompt "your prompt here"
# Reset to default prompt
npx wrangler kv key delete --binding=STRAVA_KV roast_prompt
# Force-clear the roast cache (next page load regenerates)
npx wrangler kv key delete --binding=STRAVA_KV roast_cache
# List all KV keys
npx wrangler kv key list --binding=STRAVA_KV
```

**AI model:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (Cloudflare AI free tier, hits remote even in local dev)

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
