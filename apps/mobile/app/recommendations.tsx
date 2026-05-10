import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { FormulaCard, type Formula } from "@/components/FormulaCard";
import { findFormulaById } from "@/data/formula-catalog";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

const FORMULAS: Formula[] = [
  {
    id: "bobbie-original",
    brand: "Bobbie",
    name: "Original Infant Formula",
    perOz: "1.78",
    stock: "in_stock",
    stockAgo: "6h ago",
    origin: "us",
    tinAccent: colors.mist,
    tags: ["Organic", "No palm oil"],
    reason:
      "Cow milk, organic, no palm oil. Matches the gentle-introduction profile you flagged. The most expensive of your three matches, but the only one without palm oil at this stage.",
  },
  {
    id: "byheart-whole-nutrition",
    brand: "ByHeart",
    name: "Whole Nutrition Infant Formula",
    perOz: "1.62",
    stock: "in_stock",
    stockAgo: "2h ago",
    origin: "us",
    tinAccent: colors.honeySoft,
    tags: ["No palm oil", "A2 protein"],
    reason:
      "Same protein source as Bobbie with broader stock and a slightly cheaper per-ounce price. A2-only protein may be gentler on digestion.",
  },
  {
    id: "kendamil-classic-stage-1",
    brand: "Kendamil",
    name: "Organic First Infant Milk",
    perOz: "1.94",
    stock: "low",
    origin: "european",
    tinAccent: colors.sageSoft,
    tags: ["Organic", "European"],
    reason:
      "Whole-milk fat blend (no palm oil). Imported — expect 2-week clearance and ~12% landed-cost overhead. Worth considering if availability holds.",
  },
];

export default function RecommendationsScreen() {
  const { currentFormula } = useLocalSearchParams<{ currentFormula?: string }>();
  const current = currentFormula ? findFormulaById(currentFormula) : undefined;

  const eyebrow = current ? `Alternatives to ${current.brandName}` : "Three picks for Maya";
  const headline = current
    ? `Closest matches if ${current.brandName} isn't working for Maya.`
    : "Based on what you told us — gentle introduction, family eczema, no soy concern.";

  return (
    <ScreenFrame disclaimer>
      <View style={{ paddingTop: spacing.s5, gap: spacing.s1 }}>
        <Eyebrow tone="sage">{eyebrow}</Eyebrow>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 24,
            lineHeight: 28,
            color: colors.ink,
            letterSpacing: -0.4,
            marginTop: spacing.s1,
          }}
        >
          {headline}
        </Text>
        {current && (
          <View
            style={{
              backgroundColor: colors.sageSoft,
              borderRadius: 12,
              padding: spacing.s4,
              marginTop: spacing.s3,
              gap: 4,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: colors.sageInk, letterSpacing: 1, textTransform: "uppercase" }}>
              Your current formula
            </Text>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
              {current.fullName}
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
              {current.tagline}
            </Text>
          </View>
        )}
      </View>

      <FormulaCard formula={FORMULAS[0]} eyebrow="Best match" onPress={() => router.push(`/formula/bobbie-original`)} />
      <FormulaCard formula={FORMULAS[1]} eyebrow="Close runner-up" onPress={() => router.push(`/formula/byheart-whole-nutrition`)} />
      <FormulaCard formula={FORMULAS[2]} eyebrow="Worth knowing" onPress={() => router.push(`/formula/kendamil-classic-stage-1`)} />

      <View style={{ marginTop: spacing.s2, gap: spacing.s2 }}>
        <Eyebrow tone="clay">Avoid for now</Eyebrow>
        <View
          style={{
            backgroundColor: colors.paper,
            borderColor: colors.mist,
            borderWidth: 1,
            borderRadius: radii.r3,
            padding: 16,
            gap: 4,
          }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
            Similac Pro-Advance
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink2 }}>
            Family eczema history + intact cow-milk protein at this stage. Reconsider after 6 months.
          </Text>
        </View>
      </View>
    </ScreenFrame>
  );
}
