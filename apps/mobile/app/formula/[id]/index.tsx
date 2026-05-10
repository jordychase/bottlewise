import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { Chip } from "@/components/Chip";
import { IngredientReview } from "@/components/IngredientReview";
import { QuantitySuggester } from "@/components/QuantitySuggester";
import { ExperienceModal } from "@/components/ExperienceModal";
import { CommunityExperiences } from "@/components/CommunityExperiences";
import { Button } from "@/components/Button";
import { findFormulaById } from "@/data/formula-catalog";
import { scoreFormula } from "@/lib/ingredient-score";
import { narrate, type NarrationOutput } from "@/lib/narrator";
import { aggregateForFormula, getDisplayedExperiencesForFormula } from "@/lib/community";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

// Demo profile for the personalized notes layer. Until we wire the
// real onboarding state, this stub demonstrates the surface.
const DEMO_PROFILE = {
  babyNameFirst: "Maya",
  babyAgeMonths: 3,
  familySoyAllergy: false,
  familyEczema: true,
  familyCmpa: false,
  preemie: false,
};

export default function FormulaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const formula = id ? findFormulaById(id) : undefined;

  const [narration, setNarration] = useState<NarrationOutput | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [communityVersion, setCommunityVersion] = useState(0);

  const hasIngredients =
    formula && Array.isArray(formula.ingredients) && formula.ingredients.length > 0;
  const breakdown =
    formula && hasIngredients
      ? scoreFormula({
          ingredients: formula.ingredients!,
          attributes: formula.attributes ?? [],
          babyProfile: DEMO_PROFILE,
        })
      : null;

  useEffect(() => {
    if (!formula || !breakdown) return;
    let cancelled = false;
    narrate({ breakdown, formula, profile: DEMO_PROFILE }).then((out) => {
      if (!cancelled) setNarration(out);
    });
    return () => {
      cancelled = true;
    };
  }, [formula?.id]);

  if (!formula) {
    return (
      <ScreenFrame disclaimer>
        <View style={{ paddingTop: spacing.s10, gap: spacing.s3, alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink }}>
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

  const experiences = getDisplayedExperiencesForFormula(formula.id);
  const aggregate = aggregateForFormula(formula.id);
  // Read once so the linter sees it; the state triggers re-render on submit.
  void communityVersion;

  return (
    <ScreenFrame disclaimer>
      <Pressable onPress={() => router.back()} style={{ paddingVertical: spacing.s2 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.sageDeep }}>
          ← Back
        </Text>
      </Pressable>

      <View style={{ flexDirection: "row", gap: spacing.s4, alignItems: "flex-start" }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: radii.r3,
            backgroundColor: formula.tinAccent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.ink2 }}>tin</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Eyebrow tone="sage">{formula.brandName}</Eyebrow>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 26,
              lineHeight: 30,
              color: colors.ink,
              letterSpacing: -0.5,
            }}
          >
            {formula.productName}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink2, lineHeight: 21 }}>
            {formula.tagline}
          </Text>
          {formula.packageSize && (
            <View style={{ flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              <Chip tone="neutral">{formula.packageSize}</Chip>
              {formula.segments.includes("european_import") && (
                <Chip tone="honey">European import</Chip>
              )}
              {formula.segments.includes("private_label") && (
                <Chip tone="info">Store brand</Chip>
              )}
              {formula.segments.includes("specialty_hypoallergenic") && (
                <Chip tone="warn">Hypoallergenic</Chip>
              )}
              {formula.segments.includes("specialty_amino_acid") && (
                <Chip tone="warn">Amino acid</Chip>
              )}
            </View>
          )}
        </View>
      </View>

      {narration && (
        <View
          style={{
            backgroundColor: colors.sageSoft,
            borderRadius: radii.r4,
            padding: spacing.s5,
            gap: spacing.s2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
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
              A note for {DEMO_PROFILE.babyNameFirst}
            </Text>
            <Chip tone={narration.source === "claude" ? "sage" : "neutral"}>
              {narration.source === "claude" ? "Personalized" : "Templated"}
            </Chip>
          </View>
          {narration.sentences.map((s, i) => (
            <Text
              key={i}
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.ink,
                lineHeight: 21,
              }}
            >
              {s}
            </Text>
          ))}
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.ink2,
              lineHeight: 17,
              marginTop: 4,
            }}
          >
            Talk to your pediatrician before changing formulas.
          </Text>
        </View>
      )}

      {breakdown ? (
        <IngredientReview breakdown={breakdown} ingredients={formula.ingredients!} />
      ) : (
        <View
          style={{
            backgroundColor: colors.paper,
            borderColor: colors.mist,
            borderWidth: 1,
            borderRadius: radii.r4,
            padding: spacing.s5,
            gap: spacing.s2,
          }}
        >
          <Eyebrow>Ingredient analysis</Eyebrow>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, lineHeight: 22 }}>
            Pending data from this brand.
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
            Bottlewise reads ingredient panels from brand sources. We haven't
            transcribed this one yet; the next scraper run will fill it in.
          </Text>
        </View>
      )}

      <View
        style={{
          backgroundColor: colors.sageSoft,
          borderRadius: radii.r4,
          padding: spacing.s5,
          gap: spacing.s3,
        }}
      >
        <Eyebrow tone="sage">If this isn't working</Eyebrow>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
          Out of stock locally? Cost a concern? Not tolerated? Bottlewise can show the closest matches with the same protein profile.
        </Text>
        <Button
          variant="primary"
          full
          onPress={() =>
            router.push(`/formula/${formula.id}/substitutes?reason=out_of_stock`)
          }
        >
          Find next closest
        </Button>
      </View>

      <QuantitySuggester formula={formula} ageMonths={DEMO_PROFILE.babyAgeMonths} />

      <View style={{ gap: spacing.s3 }}>
        <CommunityExperiences experiences={experiences} aggregate={aggregate} />
        <Button variant="secondary" full onPress={() => setModalOpen(true)}>
          Share what happened for {DEMO_PROFILE.babyNameFirst}
        </Button>
      </View>

      <ExperienceModal
        formulaId={formula.id}
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => setCommunityVersion((v) => v + 1)}
      />
    </ScreenFrame>
  );
}
