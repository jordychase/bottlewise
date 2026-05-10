import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, layout, spacing } from "@/theme/tokens";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  /** Show the "not medical advice" disclaimer at the bottom. */
  disclaimer?: boolean;
}

/**
 * Centers content in a 360–480px column on top of the oat background,
 * matching the design system layout rules. Pads for safe area top + bottom.
 */
export function ScreenFrame({ children, scroll = true, disclaimer = false }: Props) {
  const inner = (
    <View
      style={{
        width: "100%",
        maxWidth: layout.columnMax,
        minWidth: 0,
        paddingHorizontal: layout.gutter,
        paddingBottom: spacing.s10,
        gap: spacing.s5,
      }}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.oat }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            paddingTop: spacing.s5,
          }}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, alignItems: "center", paddingTop: spacing.s5 }}>
          {inner}
        </View>
      )}
      {disclaimer && <DisclaimerFooter />}
    </SafeAreaView>
  );
}

export function DisclaimerFooter() {
  return (
    <View
      style={{
        borderTopColor: colors.mist,
        borderTopWidth: 1,
        backgroundColor: colors.oat,
        paddingVertical: spacing.s3,
        paddingHorizontal: spacing.s5,
        alignItems: "center",
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, textAlign: "center" }}>
        Decision-support, not medical advice. <Text style={{ color: colors.ink, fontFamily: fonts.bodySemi }}>Confirm with your pediatrician.</Text>
      </Text>
    </View>
  );
}
