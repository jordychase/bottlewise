import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Button } from "./Button";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import type { FormulaProduct } from "@/data/formula-catalog";

export interface SwitchChoice {
  makeCurrent: boolean;
  watchForRestock: boolean;
  /** When true, the parent considers the previous formula still
   *  available; just keeping it as a comparison rather than a watch. */
  permanent: boolean;
}

interface Props {
  visible: boolean;
  baseline: FormulaProduct;
  substitute: FormulaProduct;
  babyNameFirst: string;
  reason: "out_of_stock" | "recalled" | "too_expensive" | "not_tolerated" | "similar";
  onChoose: (choice: SwitchChoice) => void;
  onCancel: () => void;
}

/**
 * Shown after the parent taps a substitute formula. Asks two
 * questions: should this be the active formula, and should we watch
 * the original for restock / resolution.
 */
export function SwitchSubstituteModal({
  visible,
  baseline,
  substitute,
  babyNameFirst,
  reason,
  onChoose,
  onCancel,
}: Props) {
  const [watch, setWatch] = useState(reason === "out_of_stock");
  const [permanent, setPermanent] = useState(
    reason === "not_tolerated" || reason === "recalled",
  );

  const watchableReasons = ["out_of_stock", "too_expensive"];
  const canWatch = watchableReasons.includes(reason);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.scrim,
          justifyContent: "center",
          padding: spacing.s4,
        }}
      >
        <View
          style={{
            backgroundColor: colors.oat,
            borderRadius: radii.r5,
            padding: spacing.s5,
            gap: spacing.s4,
          }}
        >
          <View style={{ gap: spacing.s2 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink, letterSpacing: -0.4, lineHeight: 26 }}>
              Switching {babyNameFirst} to {substitute.brandName}?
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink2, lineHeight: 21 }}>
              We'll update {babyNameFirst}'s current formula and remember the switch.
            </Text>
          </View>

          {canWatch && (
            <Pressable
              onPress={() => setWatch((v) => !v)}
              style={{
                backgroundColor: watch ? colors.sageSoft : colors.paper,
                borderColor: watch ? colors.sage : colors.mist,
                borderWidth: watch ? 2 : 1,
                borderRadius: radii.r3,
                padding: spacing.s4,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: spacing.s2,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: watch ? colors.sage : colors.borderStrong,
                  backgroundColor: watch ? colors.sage : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {watch && (
                  <Text style={{ color: colors.paper, fontSize: 12, lineHeight: 12, fontFamily: fonts.bodyBold }}>
                    ✓
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>
                  Watch {baseline.brandName} for restock
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 17 }}>
                  We'll surface a banner the moment {baseline.brandName} is back in stock so you can switch back if you want.
                </Text>
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={() => setPermanent((v) => !v)}
            style={{
              backgroundColor: permanent ? colors.sageSoft : colors.paper,
              borderColor: permanent ? colors.sage : colors.mist,
              borderWidth: permanent ? 2 : 1,
              borderRadius: radii.r3,
              padding: spacing.s4,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: spacing.s2,
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: permanent ? colors.sage : colors.borderStrong,
                backgroundColor: permanent ? colors.sage : "transparent",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {permanent && (
                <Text style={{ color: colors.paper, fontSize: 12, lineHeight: 12, fontFamily: fonts.bodyBold }}>
                  ✓
                </Text>
              )}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>
                Permanent switch — don't track the previous formula
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 17 }}>
                {reason === "recalled"
                  ? "We won't suggest going back to the recalled formula."
                  : reason === "not_tolerated"
                    ? "We won't bring up the formula that wasn't working."
                    : "We'll stop tracking the previous formula's status."}
              </Text>
            </View>
          </Pressable>

          <View style={{ flexDirection: "row", gap: spacing.s2, marginTop: spacing.s2 }}>
            <View style={{ flex: 1 }}>
              <Button variant="secondary" full onPress={onCancel}>
                Cancel
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                full
                onPress={() =>
                  onChoose({
                    makeCurrent: true,
                    watchForRestock: canWatch && watch && !permanent,
                    permanent,
                  })
                }
              >
                Confirm switch
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
