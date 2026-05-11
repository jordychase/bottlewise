import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { FormulaCard, type Formula } from "@/components/FormulaCard";
import { Chip } from "@/components/Chip";
import { findFormulaById } from "@/data/formula-catalog";
import { recommend, type Recommendation } from "@/lib/recommendation";
import { useBabyProfile } from "@/state/baby-profile";
import { useStock, statusOf, type StockStatus } from "@/state/stock";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

function statusForCard(s: StockStatus): Formula["stock"] {
  if (s === "in_stock") return "in_stock";
  if (s === "low") return "low";
  return "oos";
}

function recommendationToCardFormula(
  rec: Recommendation,
  stockStatus: StockStatus,
): Formula {
  // Per-oz cost is a placeholder until the adapter pipeline writes
  // observed prices into `prices`. Use cost-band heuristics for now.
  const segment = rec.formula.segments[0] ?? "mass_market";
  const perOz =
    segment === "private_label"
      ? "0.59"
      : segment === "mass_market"
        ? "0.99"
        : segment === "premium_dtc"
          ? "1.78"
          : segment === "european_import"
            ? "1.94"
            : "2.45";
  return {
    id: rec.formula.id,
    brand: rec.formula.brandName,
    name: rec.formula.productName,
    perOz,
    stock: statusForCard(stockStatus),
    stockAgo: stockStatus === "in_stock" ? "live" : undefined,
    origin: rec.formula.segments.includes("european_import") ? "european" : "us",
    tinAccent: rec.formula.tinAccent,
    tags: [],
    reason: rec.summary,
  };
}

export default function RecommendationsScreen() {
  const { currentFormula } = useLocalSearchParams<{ currentFormula?: string }>();
  const overrideCurrent = currentFormula ? findFormulaById(currentFormula) : undefined;
  const { profile } = useBabyProfile();
  const stock = useStock();

  const result = useMemo(() => recommend(profile), [profile]);

  const current =
    overrideCurrent ??
    (profile.currentFormulaId ? findFormulaById(profile.currentFormulaId) : undefined);

  const eyebrow = current ? `Alternatives to ${current.brandName}` : `Three picks for ${profile.babyNameFirst}`;
  const headlineBase = result.confident
    ? `Based on what you told us — ${describeProfile(profile)}.`
    : `We can give you starting points, but we don't have a confident match given what you've told us. Talk to your pediatrician before changing.`;
  const headline = current
    ? `Closest matches if ${current.brandName} isn't working for ${profile.babyNameFirst}.`
    : headlineBase;

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
            <Text
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: 10,
                color: colors.sageInk,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
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

      {result.picks.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.paper,
            borderColor: colors.mist,
            borderWidth: 1,
            borderRadius: radii.r3,
            padding: spacing.s5,
            gap: spacing.s2,
          }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
            No eligible matches.
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
            That's unusual — the filters ruled everything out. Most likely a combination of family allergy flags. Talk to your pediatrician about the right next step.
          </Text>
        </View>
      ) : (
        result.picks.map((pick) => {
          const cardFormula = recommendationToCardFormula(
            pick,
            statusOf(stock.status, pick.formula.id),
          );
          return (
            <View key={pick.formula.id} style={{ gap: spacing.s3 }}>
              <FormulaCard
                formula={cardFormula}
                eyebrow={pick.eyebrow}
                onPress={() => router.push(`/formula/${pick.formula.id}`)}
              />
              {pick.reasons.filter((r) => r.weight > 0).length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: -spacing.s2 }}>
                  {pick.reasons
                    .filter((r) => r.weight > 0)
                    .slice(0, 4)
                    .map((r) => (
                      <Chip key={r.key} tone={r.weight >= 20 ? "sage" : "neutral"}>
                        {r.label}
                      </Chip>
                    ))}
                </View>
              )}
            </View>
          );
        })
      )}

      {result.avoid.length > 0 && (
        <View style={{ marginTop: spacing.s2, gap: spacing.s2 }}>
          <Eyebrow tone="clay">Avoid for now</Eyebrow>
          {result.avoid.map((entry, idx) => (
            <View
              key={`${entry.formulaId ?? entry.display}-${idx}`}
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
                {entry.display}
              </Text>
              <Text
                style={{ fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink2 }}
              >
                {entry.reasonText}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScreenFrame>
  );
}

function describeProfile(profile: ReturnType<typeof useBabyProfile>["profile"]): string {
  const fragments: string[] = [];
  if (profile.preemie) fragments.push("preemie discharge profile");
  if (profile.familyCmpa) fragments.push("CMPA in the family");
  if (profile.familyEczema) fragments.push("family eczema");
  if (profile.familySoyAllergy) fragments.push("soy avoidance");
  if (profile.issuesObserved.includes("reflux")) fragments.push("reflux / spit-up");
  if (profile.issuesObserved.includes("fussy")) fragments.push("fussiness after feeds");
  if (profile.issuesObserved.includes("gas")) fragments.push("gas");
  if (profile.issuesObserved.includes("stools")) fragments.push("hard stools");
  if (fragments.length === 0) fragments.push(`a ${profile.babyAgeMonths}-month-old baseline`);
  if (fragments.length === 1) return fragments[0]!;
  if (fragments.length === 2) return `${fragments[0]} and ${fragments[1]}`;
  return `${fragments.slice(0, -1).join(", ")}, and ${fragments[fragments.length - 1]}`;
}
