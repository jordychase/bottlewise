import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { Chip } from "@/components/Chip";
import { IngredientReview } from "@/components/IngredientReview";
import { findFormulaById } from "@/data/formula-catalog";
import { scoreFormula } from "@/lib/ingredient-score";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

// Demo profile for the personalized notes layer. Until we wire the
// real onboarding state, this stub demonstrates the surface.
const DEMO_PROFILE = { familySoyAllergy: false, familyEczema: true };

export default function FormulaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const formula = id ? findFormulaById(id) : undefined;

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

  const hasIngredients = Array.isArray(formula.ingredients) && formula.ingredients.length > 0;
  const breakdown = hasIngredients
    ? scoreFormula({
        ingredients: formula.ingredients!,
        attributes: formula.attributes ?? [],
        babyProfile: DEMO_PROFILE,
      })
    : null;

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
    </ScreenFrame>
  );
}
