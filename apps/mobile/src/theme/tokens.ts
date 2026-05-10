/**
 * Bottlewise design tokens, ported from packages/design-system/tokens.json.
 *
 * Pure constants — no platform-specific code. Components consume from here
 * via StyleSheet. When tokens.json changes, mirror those changes here in
 * lockstep (see design system README for the contract).
 */

export const colors = {
  // Surfaces
  oat: "#F6F1E8",
  paper: "#FBF7EE",
  mist: "#E6DFCF",
  // Ink scale
  ink: "#1F2A26",
  ink2: "#5A6862",
  ink3: "#94A09B",
  // Primary
  sage: "#6B8E7F",
  sageDeep: "#4A6B5D",
  sageSoft: "#DCE6DF",
  sageInk: "#3D6651",
  // Accents
  clay: "#C77E5C",
  claySoft: "#F2DECE",
  clayInk: "#8C4A2D",
  honey: "#D4A24C",
  honeySoft: "#F1E2BD",
  honeyInk: "#7C5B1A",
  info: "#5C7A8A",
  infoSoft: "#D6DEE3",
  infoInk: "#3F5663",
  // Safety — never used outside recalls, allergic reactions, pediatrician interstitials
  danger: "#A94B3B",
  dangerDeep: "#8C3829",
  dangerSoft: "#ECCFC8",
  dangerInk: "#7E2E22",
  // Misc
  borderStrong: "#C9C0AB",
  onPrimary: "#FBF7EE",
  scrim: "rgba(31, 42, 38, 0.32)",
} as const;

export const spacing = {
  s0: 0, s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24,
  s8: 32, s10: 40, s14: 56, s18: 72, s24: 96,
} as const;

export const radii = {
  r1: 2, r2: 8, r3: 12, r4: 16, r5: 24, pill: 999,
} as const;

export const fonts = {
  display: "Newsreader_600SemiBold",
  displayRegular: "Newsreader_400Regular",
  body: "HankenGrotesk_400Regular",
  bodyMedium: "HankenGrotesk_500Medium",
  bodySemi: "HankenGrotesk_600SemiBold",
  bodyBold: "HankenGrotesk_700Bold",
} as const;

export const type = {
  display1: { fontFamily: fonts.display, fontSize: 56, lineHeight: 60, letterSpacing: -1.1 },
  display2: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, letterSpacing: -0.8 },
  h1:       { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  h2:       { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  h3:       { fontFamily: fonts.bodySemi, fontSize: 18, lineHeight: 24 },
  h4:       { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20 },
  lead:     { fontFamily: fonts.body, fontSize: 18, lineHeight: 27 },
  body:     { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  small:    { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  caption:  { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  micro:    { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
  eyebrow:  { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, letterSpacing: 1, textTransform: "uppercase" as const },
  numeric:  { fontFamily: fonts.display, fontSize: 22, lineHeight: 24, letterSpacing: -0.3 },
} as const;

export const elevation = {
  e1: { borderBottomColor: colors.mist, borderBottomWidth: 1 },
  // RN doesn't render true CSS shadows on web parity well; web layer overrides if needed.
  e2: { shadowColor: "#1F2A26", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
  e3: { shadowColor: "#1F2A26", shadowOpacity: 0.24, shadowRadius: 48, shadowOffset: { width: 0, height: 24 } },
} as const;

export const motion = {
  durationFast: 120,
  durationBase: 200,
  durationSlow: 320,
} as const;

export const layout = {
  columnMin: 360,
  columnMax: 480,
  gutter: 20,
} as const;
