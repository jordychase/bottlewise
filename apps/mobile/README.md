# @bottlewise/mobile

Bottlewise app — Expo Router (web/PWA first, iOS/Android wrappers when web is validated).

Implements the three anchor screens from `packages/design-system/ui_kits/app/anchor-screens.html` as real React Native components, with design tokens ported from `packages/design-system/tokens.json` into [src/theme/tokens.ts](src/theme/tokens.ts).

## Run

```bash
pnpm install
pnpm --filter @bottlewise/mobile run web      # http://localhost:8081
pnpm --filter @bottlewise/mobile run ios      # requires Xcode
pnpm --filter @bottlewise/mobile run android  # requires Android SDK
```

## Routes

| Path | File | Purpose |
|---|---|---|
| `/` | `app/index.tsx` | Welcome — value prop, flow picker |
| `/intake` | `app/intake.tsx` | One-question-per-screen intake (step 2 of 4 anchor) |
| `/recommendations` | `app/recommendations.tsx` | 3 picks + avoid-for-now panel |

## Architecture

- **Tokens**: [src/theme/tokens.ts](src/theme/tokens.ts) mirrors `tokens.json`. Single source for colors / type / spacing / radii / motion.
- **Components**: `src/components/` — Button, Card, Chip, RadioCard, FormulaCard, ScreenFrame, Eyebrow, Wordmark. RN-first; web parity via `react-native-web`.
- **Fonts**: Newsreader + Hanken Grotesk via `@expo-google-fonts`. Loaded in [`app/_layout.tsx`](app/_layout.tsx); root view waits for `useFonts` to resolve before rendering.
- **No NativeWind** in v1 — keeps the build simple. Components use `StyleSheet`-style inline objects against `tokens.ts`. Converting to NativeWind is mechanical if the tradeoff makes sense later.

## What's not here yet

- Safety interstitial component (recall, allergic-reaction) — needs the trigger pipeline (PRD § Safety) before its containing flow is real.
- Substitution / "find next closest" cascade — needs adapter-fed stock data.
- Supabase auth + persistence — schema is deployable (`/supabase/migrations`), connecting via `@supabase/supabase-js` is the next phase.
- Real product photography — design system uses neutral `[ tin ]` placeholders.
