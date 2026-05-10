import { Pressable, Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import type { ActiveRecall, FormulaProduct } from "@/data/formula-catalog";

interface Props {
  formula: FormulaProduct;
  recall: ActiveRecall;
  onAcknowledge: () => void;
  onCallPediatrician: () => void;
  onShowAlternatives: () => void;
}

const CLASSIFICATION_COPY: Record<ActiveRecall["classification"], string> = {
  class_i: "Class I — a reasonable probability that use will cause serious adverse health consequences.",
  class_ii: "Class II — use may cause temporary or medically reversible adverse health consequences; remote chance of serious consequences.",
  class_iii: "Class III — use is unlikely to cause adverse health consequences.",
};

/**
 * The recall surface. Distinct from the pediatrician interstitial.
 * Per docs/DATA_SOURCING.md § 6, Class I recalls auto-fire this and
 * the recommendation engine downranks the formula to score 0 while
 * the recall is active.
 *
 * Voice rules (BRAND_RATIONALE.md): calm but unmistakable. The danger
 * red is reserved for safety surfaces — it's used here as intended.
 */
export function SafetyInterstitial({
  formula,
  recall,
  onAcknowledge,
  onCallPediatrician,
  onShowAlternatives,
}: Props) {
  return (
    <View style={{ gap: spacing.s5 }}>
      <View
        style={{
          backgroundColor: colors.dangerSoft,
          borderColor: colors.danger,
          borderWidth: 2,
          borderRadius: radii.r4,
          padding: spacing.s5,
          gap: spacing.s3,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 12,
            color: colors.dangerInk,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Active recall · {recall.classification.toUpperCase().replace("_", " ")}
        </Text>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 22,
            lineHeight: 26,
            color: colors.ink,
            letterSpacing: -0.4,
          }}
        >
          {formula.fullName} is under an active recall.
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
          {recall.reason}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
          Initiated {recall.recallDate} · {recall.recallNumber}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 18, marginTop: 4 }}>
          {CLASSIFICATION_COPY[recall.classification]}
        </Text>
      </View>

      <View style={{ gap: spacing.s3 }}>
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 11,
            color: colors.ink2,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          What we suggest
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
          Stop using this formula. Call your pediatrician today — not tomorrow — so they can review what your baby has been taking and recommend a switch.
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 20 }}>
          When you're ready, Bottlewise can show you alternatives with the same protein profile that are not affected.
        </Text>
      </View>

      <View style={{ gap: spacing.s2 }}>
        <Pressable
          onPress={onCallPediatrician}
          style={{
            backgroundColor: colors.danger,
            borderRadius: radii.r3,
            paddingVertical: spacing.s4,
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.onPrimary }}>
            Call my pediatrician
          </Text>
        </Pressable>
        <Pressable
          onPress={onShowAlternatives}
          style={{
            borderColor: colors.borderStrong,
            borderWidth: 1,
            borderRadius: radii.r3,
            paddingVertical: spacing.s4,
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
            Show me alternatives
          </Text>
        </Pressable>
        <Pressable onPress={onAcknowledge} style={{ alignItems: "center", paddingVertical: spacing.s3 }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink2 }}>
            I've already spoken to my pediatrician
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 11,
          color: colors.ink2,
          lineHeight: 16,
          marginTop: spacing.s2,
        }}
      >
        Recall data sourced from the FDA's openFDA food enforcement feed. Recall status is verified hourly.
      </Text>
    </View>
  );
}
