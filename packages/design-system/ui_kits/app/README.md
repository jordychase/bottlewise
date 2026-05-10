# Bottlewise app — UI kit

A first-pass, click-through, mostly-cosmetic recreation of the Bottlewise mobile/PWA surface. Built mobile-first (480px column on a soft-letterboxed oat background). Components are intentionally simple — no real auth, no real data, no real similarity engine — just enough to communicate the visual register and the canonical screen patterns.

> The Bottlewise repo is pre-implementation as of May 2026, so nothing here is "copied from production" — it's an opinionated design starting point grounded in the PRD (`docs/PRD.md`) and CLAUDE.md. Treat the screens as proposals, not fixtures.

## Open `index.html` to see the click-through

Drives through:

1. **Welcome / pick a flow** — "New to formula" vs "On formula, need help"
2. **Intake** — baby profile, allergy history, budget — Flow A
3. **Recommendations** — three picks, reasons, stock and cost surfaced inline
4. **Formula detail** — ingredients, cost breakdown including landed cost, formula-maker calibration
5. **Out-of-stock cascade** — the killer feature; "next closest available" with the substitution reasoning
6. **Chat** — bounded AI surface with safety pre-screen demo
7. **Safety interstitial** — non-dismissable

## Components in this kit

| File | Component | Purpose |
|---|---|---|
| `Primitives.jsx` | `Button`, `Chip`, `Card`, `IconBox`, `Field`, `Toggle`, `Radio`, `Checkbox` | Building blocks |
| `Shell.jsx` | `AppShell`, `TopBar`, `TabBar`, `DisclaimerFooter` | Layout chrome |
| `Formula.jsx` | `FormulaCard`, `StockBadge`, `OriginBadge`, `CostBlock` | The recommendation primitive |
| `Screens.jsx` | `WelcomeScreen`, `IntakeScreen`, `RecommendationsScreen`, `DetailScreen`, `OOSScreen`, `ChatScreen`, `SafetyScreen` | Full screens |
| `app.jsx` | `App` | Router / state machine |

## What was NOT recreated

- Real auth flow (Supabase magic link). Sign-in is a single fake button.
- Real data — formulas, prices, stock all baked-in mocks.
- The full intake state machine (Flow A and Flow B as separate trees per PRD § 3.1) is collapsed into a representative single screen.
- Native iOS/Android-specific UI. This is the web/PWA register; native shells would tweak chrome.

## Notes for production engineers

- All visual tokens come from `../../colors_and_type.css`. Don't fork.
- Buttons are 12px-radius, 1.5px-icon-stroke (Lucide), and use the sage primary. Hover/press states are documented in the README.
- The "not medical advice" disclaimer is **always rendered** at the bottom of any recommendation surface. It is not a setting.
- Safety interstitial routes are non-dismissable; the only way past is to acknowledge the action explicitly.
