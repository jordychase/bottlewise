import { Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { Chip } from "./Chip";
import { IngredientScoreBadge } from "./IngredientScoreBadge";
import {
  type ScoreBreakdown,
  SEVERITY_TONES,
} from "@/lib/ingredient-score";

interface Props {
  breakdown: ScoreBreakdown;
  ingredients: string[];
}

export function IngredientReview({ breakdown, ingredients }: Props) {
  const concernByIdx = new Map<number, typeof breakdown.concerns[number]>();
  breakdown.concerns.forEach((c) => concernByIdx.set(c.positionInList, c));

  return (
    <View style={{ gap: spacing.s5 }}>
      <View
        style={{
          backgroundColor: colors.paper,
          borderColor: colors.mist,
          borderWidth: 1,
          borderRadius: radii.r4,
          padding: spacing.s5,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.s5,
        }}
      >
        <IngredientScoreBadge grade={breakdown.grade} score={breakdown.finalScore} size="lg" />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 11,
              color: colors.ink2,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Bottlewise ingredient score
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 20 }}>
            {breakdown.verdict}
          </Text>
        </View>
      </View>

      {breakdown.personalNotes.length > 0 && (
        <View
          style={{
            backgroundColor: colors.sageSoft,
            borderRadius: radii.r3,
            padding: spacing.s4,
            gap: spacing.s2,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 11,
              color: colors.sageInk,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            What you'd want to know
          </Text>
          {breakdown.personalNotes.map((note, i) => (
            <Text key={i} style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
              {note}
            </Text>
          ))}
        </View>
      )}

      {breakdown.concerns.length > 0 && (
        <View style={{ gap: spacing.s2 }}>
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 11,
              color: colors.ink2,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Ingredients to know about
          </Text>
          {breakdown.concerns.map((hit, i) => (
            <View
              key={`${hit.concern.match}-${i}`}
              style={{
                backgroundColor: colors.paper,
                borderColor: colors.mist,
                borderWidth: 1,
                borderRadius: radii.r3,
                padding: spacing.s4,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
                  {hit.concern.display}
                </Text>
                <Chip tone={SEVERITY_TONES[hit.concern.severity]}>
                  {hit.concern.severity === "significant"
                    ? "Significant"
                    : hit.concern.severity === "moderate"
                      ? "Moderate"
                      : "Watch"}
                </Chip>
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
                {hit.concern.reason}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.ink3, lineHeight: 16, marginTop: 2 }}>
                Source · {hit.concern.source}
              </Text>
            </View>
          ))}
        </View>
      )}

      {breakdown.positives.length > 0 && (
        <View style={{ gap: spacing.s2 }}>
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 11,
              color: colors.sageInk,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            What's working for you
          </Text>
          {breakdown.positives.map((hit, i) => (
            <View
              key={`${hit.marker.match}-${i}`}
              style={{
                backgroundColor: colors.paper,
                borderColor: colors.mist,
                borderWidth: 1,
                borderRadius: radii.r3,
                padding: spacing.s4,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
                  {hit.marker.display}
                </Text>
                <Chip tone="success" dot>
                  Positive
                </Chip>
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
                {hit.marker.reason}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ gap: spacing.s2 }}>
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 11,
            color: colors.ink2,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          Full ingredient list
        </Text>
        <View
          style={{
            backgroundColor: colors.paper,
            borderColor: colors.mist,
            borderWidth: 1,
            borderRadius: radii.r3,
            padding: spacing.s4,
            gap: 6,
          }}
        >
          {ingredients.map((ing, idx) => {
            const hit = concernByIdx.get(idx);
            const tone = hit ? SEVERITY_TONES[hit.concern.severity] : null;
            return (
              <View
                key={`${ing}-${idx}`}
                style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodySemi,
                    fontSize: 11,
                    color: colors.ink3,
                    minWidth: 16,
                    marginTop: 2,
                  }}
                >
                  {idx + 1}.
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: colors.ink,
                    lineHeight: 20,
                    flex: 1,
                  }}
                >
                  {ing}
                </Text>
                {tone && (
                  <View style={{ marginTop: 1 }}>
                    <Chip tone={tone}>
                      {hit!.concern.severity === "significant" ? "Flag" : hit!.concern.severity === "moderate" ? "Watch" : "Note"}
                    </Chip>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 11,
          color: colors.ink2,
          lineHeight: 16,
          marginTop: spacing.s1,
        }}
      >
        Bottlewise reads the printed ingredient list against published nutrition and regulatory positions.
        We do not make medical claims. Talk to your pediatrician before changing formulas.
      </Text>
    </View>
  );
}
