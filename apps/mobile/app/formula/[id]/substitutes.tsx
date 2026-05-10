import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { Chip } from "@/components/Chip";
import { Button } from "@/components/Button";
import { IngredientScoreInlineBadge } from "@/components/IngredientScoreBadge";
import { findFormulaById } from "@/data/formula-catalog";
import { scoreSummary } from "@/lib/ingredient-score";
import {
  findSubstitutes,
  SUBSTITUTION_REASON_COPY,
  type SimilarityMatch,
  type SubstitutionReason,
} from "@/lib/similarity";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

const REASON_TABS: { id: SubstitutionReason; label: string }[] = [
  { id: "out_of_stock", label: "If it's unavailable" },
  { id: "too_expensive", label: "If cost is the issue" },
  { id: "not_tolerated", label: "If it's not working" },
];

const VALID_REASONS: SubstitutionReason[] = [
  "recalled",
  "out_of_stock",
  "too_expensive",
  "not_tolerated",
  "similar",
];

export default function SubstitutesScreen() {
  const { id, reason: reasonParam } = useLocalSearchParams<{
    id: string;
    reason?: string;
  }>();
  const baseline = id ? findFormulaById(id) : undefined;

  const initialReason: SubstitutionReason =
    reasonParam && VALID_REASONS.includes(reasonParam as SubstitutionReason)
      ? (reasonParam as SubstitutionReason)
      : "out_of_stock";
  const [reason, setReason] = useState<SubstitutionReason>(initialReason);

  const matches = useMemo(
    () => (baseline ? findSubstitutes(baseline, { reason, limit: 3 }) : []),
    [baseline?.id, reason],
  );

  if (!baseline) {
    return (
      <ScreenFrame disclaimer>
        <View style={{ paddingTop: spacing.s10, alignItems: "center", gap: spacing.s3 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>
            Formula not found
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.sageDeep }}>
              ← Back
            </Text>
          </Pressable>
        </View>
      </ScreenFrame>
    );
  }

  const copy = SUBSTITUTION_REASON_COPY[reason];
  const isRecallContext = reason === "recalled";
  const wasRecalled = baseline.activeRecall?.status === "ongoing";

  return (
    <ScreenFrame disclaimer>
      <Pressable onPress={() => router.back()} style={{ paddingVertical: spacing.s2 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.sageDeep }}>
          ← Back
        </Text>
      </Pressable>

      <View style={{ gap: spacing.s2 }}>
        <Eyebrow tone={isRecallContext ? "clay" : "sage"}>
          Alternatives to {baseline.brandName}
        </Eyebrow>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            lineHeight: 30,
            color: colors.ink,
            letterSpacing: -0.5,
          }}
        >
          {copy.eyebrow}.
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            lineHeight: 21,
            color: colors.ink2,
            marginTop: spacing.s1,
          }}
        >
          {copy.lead}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: wasRecalled ? colors.dangerSoft : colors.sageSoft,
          borderRadius: radii.r3,
          padding: spacing.s4,
          gap: 4,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 10,
            color: wasRecalled ? colors.dangerInk : colors.sageInk,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {wasRecalled ? "What you're switching from (recalled)" : "What you're switching from"}
        </Text>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
          {baseline.fullName}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
          {baseline.tagline}
        </Text>
      </View>

      {!isRecallContext && (
        <View style={{ gap: spacing.s2 }}>
          <Eyebrow>Switch the reason</Eyebrow>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 }}>
            {REASON_TABS.map((tab) => {
              const active = reason === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setReason(tab.id)}
                  style={{
                    backgroundColor: active ? colors.sage : colors.paper,
                    borderColor: active ? colors.sage : colors.mist,
                    borderWidth: 1,
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bodySemi,
                      fontSize: 13,
                      color: active ? colors.onPrimary : colors.ink,
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {matches.length === 0 ? (
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
            We don't have a close match yet.
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
            That's rare for the formulas in our index — usually it means the baseline has a highly specialized profile (severe-allergy amino-acid, for example). Talk to your pediatrician about the right next step.
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.s3 }}>
          {matches.map((match, idx) => (
            <MatchCard key={match.formula.id} match={match} rank={idx + 1} />
          ))}
        </View>
      )}

      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.ink2, lineHeight: 16 }}>
        Bottlewise excludes formulas with active recalls from substitution
        suggestions automatically. Always talk to your pediatrician before
        switching, especially for hypoallergenic or amino-acid formulas.
      </Text>
    </ScreenFrame>
  );
}

function MatchCard({ match, rank }: { match: SimilarityMatch; rank: number }) {
  const score = scoreSummary(match.formula.ingredients, match.formula.attributes);
  return (
    <Pressable
      onPress={() => router.push(`/formula/${match.formula.id}`)}
      style={{
        backgroundColor: colors.paper,
        borderColor: colors.mist,
        borderWidth: 1,
        borderRadius: radii.r4,
        padding: spacing.s5,
        gap: spacing.s3,
      }}
    >
      <View style={{ flexDirection: "row", gap: spacing.s3 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radii.r3,
            backgroundColor: match.formula.tinAccent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.ink2 }}>tin</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 10,
              color: colors.sageDeep,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {match.eyebrow}
          </Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.ink }}>
            {match.formula.fullName}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
            {match.formula.tagline}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {score && <IngredientScoreInlineBadge grade={score.grade} />}
            <Chip tone="neutral">{`Match ${Math.round(match.score)}/100`}</Chip>
          </View>
        </View>
      </View>

      {match.matched.length > 0 && (
        <View style={{ gap: 4 }}>
          {match.matched.slice(0, 3).map((m, i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.s2, alignItems: "flex-start" }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.sageInk, marginTop: 1 }}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                  {m.label}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 17 }}>
                  {m.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {match.differed.length > 0 && (
        <View style={{ gap: 4, marginTop: 4 }}>
          {match.differed.slice(0, 2).map((m, i) => (
            <View key={i} style={{ flexDirection: "row", gap: spacing.s2, alignItems: "flex-start" }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.clayInk, marginTop: 1 }}>·</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                  {m.label}
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 17 }}>
                  {m.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ marginTop: 4 }}>
        <Button variant="sageSoft" size="sm">
          See full breakdown →
        </Button>
      </View>
    </Pressable>
  );
}
