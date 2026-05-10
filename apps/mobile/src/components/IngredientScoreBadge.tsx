import { Text, View } from "react-native";
import { colors, fonts, radii } from "@/theme/tokens";
import type { LetterGrade } from "@/lib/ingredient-score";

const GRADE_COLOR: Record<LetterGrade, { bg: string; fg: string; border: string }> = {
  A: { bg: colors.sageSoft, fg: colors.sageInk, border: colors.sage },
  B: { bg: colors.sageSoft, fg: colors.sageInk, border: colors.sage },
  C: { bg: colors.honeySoft, fg: colors.honeyInk, border: colors.honey },
  D: { bg: colors.claySoft, fg: colors.clayInk, border: colors.clay },
  F: { bg: colors.dangerSoft, fg: colors.dangerInk, border: colors.danger },
};

interface Props {
  grade: LetterGrade;
  score?: number;
  size?: "sm" | "md" | "lg";
}

export function IngredientScoreBadge({ grade, score, size = "md" }: Props) {
  const palette = GRADE_COLOR[grade];
  const dim = size === "lg" ? 64 : size === "md" ? 44 : 32;
  const fontSize = size === "lg" ? 32 : size === "md" ? 22 : 16;
  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <View
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: fonts.display, fontSize, color: palette.fg, letterSpacing: -0.5 }}>
          {grade}
        </Text>
      </View>
      {score !== undefined && size !== "sm" && (
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink2 }}>
          {score}/100
        </Text>
      )}
    </View>
  );
}

export function IngredientScoreInlineBadge({ grade }: { grade: LetterGrade }) {
  const palette = GRADE_COLOR[grade];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: radii.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: 14, color: palette.fg, letterSpacing: -0.3 }}>
        {grade}
      </Text>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 11, color: palette.fg, letterSpacing: 0.4, textTransform: "uppercase" }}>
        Ingredients
      </Text>
    </View>
  );
}
