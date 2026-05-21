import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FeedbackModal } from "./FeedbackModal";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

/**
 * Floating beta-feedback button. Surfaces on every screen so testers
 * can report inline without navigating back. Quiet enough not to
 * compete with primary UI — sage outline, small, lower-right.
 *
 * Production removes this. Beta only.
 */
export function FeedbackButton({ currentRoute }: { currentRoute: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          right: spacing.s4,
          bottom: spacing.s4,
          zIndex: 50,
        }}
      >
        <Pressable
          onPress={() => setOpen(true)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.sage : colors.sageSoft,
            borderColor: colors.sage,
            borderWidth: 1.5,
            borderRadius: radii.pill,
            paddingHorizontal: spacing.s4,
            paddingVertical: spacing.s2,
            shadowColor: colors.ink,
            shadowOpacity: 0.15,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          })}
        >
          <Text
            style={{
              fontFamily: fonts.bodySemi,
              fontSize: 12,
              color: colors.sageInk,
              letterSpacing: 0.4,
            }}
          >
            Beta feedback
          </Text>
        </Pressable>
      </View>

      <FeedbackModal
        visible={open}
        currentRoute={currentRoute}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
