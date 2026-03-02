# cuisine explorer — Global Cuisines Map

## Commands
- `npm run dev` — Start dev server (localhost:5173)
- `npm run build` — Type-check + production build
- `npm run preview` — Preview production build
- `python3 scripts/fetch-images.py` — Fetch Unsplash images for a batch of countries

## Architecture
Single-page app: interactive SVG world map with 12 culinary regions. No backend, no routing, all data hardcoded.

### Stack
Vite + React 18 + TypeScript + TailwindCSS v3 + react-simple-maps + framer-motion + shadcn/ui

### Key files
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

### Map data
- TopoJSON from `cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`
- Country IDs are ISO 3166-1 numeric codes (e.g. `'840'` = USA)
- Map fills use `withAlpha(hex, alpha)` over a `var(--ocean)` SVG rect background

### Images
- Stored as flat `images[]` on each country (up to 25 per country)
- Fetched via Unsplash API (`"{country} food"` query, 25 results)
- `scripts/fetch-images.py` handles batch fetching — update `BATCH` dict and run
- 32 countries still have no images (low Unsplash coverage for obscure nations)
- Gallery hidden automatically when `images.length === 0`

### Deployment
- Cloudflare Pages: build command `npm run build`, output dir `dist`, install command `npm install`
- Repo: https://github.com/hayabhay/vibe-cuisine
- Live: https://vibe-cuisine.abhay.fyi
- OG image: `public/og.png` (1200×630, generated with Pillow, regenerate via `python3 scripts/gen-og.py`)
- OG URLs are hardcoded as absolute URLs to `vibe-cuisine.abhay.fyi` in `index.html`

## Conventions
- Use `import type` for type-only imports (verbatimModuleSyntax is enabled)
- Region colors defined in `regions.ts`
- Ocean color shared via CSS var `--ocean` between header bg and SVG rect
- `[&_svg]:size-auto` needed on Button when overriding icon size (shadcn forces `size-4` on all SVGs)
