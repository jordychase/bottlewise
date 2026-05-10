import { Pressable, Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { Chip } from "./Chip";
import type { FormulaProduct } from "@/data/formula-catalog";

interface Props {
  formula: FormulaProduct;
  onPress: () => void;
}

function TinThumb({ accent }: { accent: string }) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: radii.r2,
        backgroundColor: accent,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 9, color: colors.ink2 }}>tin</Text>
    </View>
  );
}

export function FormulaSearchResult({ formula, onPress }: Props) {
  const isImport = formula.segments.includes("european_import");
  const isPrivateLabel = formula.segments.includes("private_label");
  const isSpecialty =
    formula.segments.includes("specialty_hypoallergenic") ||
    formula.segments.includes("specialty_amino_acid");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.sageSoft : colors.paper,
        borderColor: colors.mist,
        borderWidth: 1,
        borderRadius: radii.r3,
        padding: spacing.s3,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.s3,
      })}
    >
      <TinThumb accent={formula.tinAccent} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, lineHeight: 20 }}
          numberOfLines={1}
        >
          {formula.fullName}
        </Text>
        <Text
          style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 18 }}
          numberOfLines={1}
        >
          {formula.tagline}
        </Text>
        {(isImport || isPrivateLabel || isSpecialty) && (
          <View style={{ flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            {isImport && <Chip tone="honey">European import</Chip>}
            {isPrivateLabel && <Chip tone="info">Store brand</Chip>}
            {isSpecialty && <Chip tone="warn">Specialty</Chip>}
          </View>
        )}
      </View>
    </Pressable>
  );
}
