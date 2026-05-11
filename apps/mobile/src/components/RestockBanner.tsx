import { Pressable, Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import type { FormulaProduct } from "@/data/formula-catalog";

interface Props {
  watchedFormula: FormulaProduct;
  currentFormula: FormulaProduct;
  onSwitchBack: () => void;
  onStayWithCurrent: () => void;
}

/**
 * Surfaces when a previously-out-of-stock formula returns and the
 * parent is watching it. Calm but unmistakable — sage primary action,
 * neutral secondary, never red (this is good news, not a safety
 * surface).
 */
export function RestockBanner({
  watchedFormula,
  currentFormula,
  onSwitchBack,
  onStayWithCurrent,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.sageSoft,
        borderColor: colors.sage,
        borderWidth: 2,
        borderRadius: radii.r4,
        padding: spacing.s5,
        gap: spacing.s3,
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
        Back in stock
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
        {watchedFormula.brandName} is available again.
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
        You switched to {currentFormula.brandName} while {watchedFormula.brandName} was out. You can switch back now or keep going with {currentFormula.brandName} — whichever has been working for your baby.
      </Text>

      <View style={{ gap: spacing.s2, marginTop: spacing.s1 }}>
        <Pressable
          onPress={onSwitchBack}
          style={{
            backgroundColor: colors.sage,
            borderRadius: radii.r3,
            paddingVertical: spacing.s4,
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.onPrimary }}>
            Switch back to {watchedFormula.brandName}
          </Text>
        </Pressable>
        <Pressable
          onPress={onStayWithCurrent}
          style={{
            borderColor: colors.borderStrong,
            borderWidth: 1,
            borderRadius: radii.r3,
            paddingVertical: spacing.s4,
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
            Stay with {currentFormula.brandName}
          </Text>
        </Pressable>
      </View>

      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.ink2, lineHeight: 16 }}>
        Switching back transitions are common to upset stomach for a few feeds. Watch your baby's cues; ramp over 2–3 days if you can.
      </Text>
    </View>
  );
}
