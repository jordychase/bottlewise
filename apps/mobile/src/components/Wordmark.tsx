import { Text, View } from "react-native";
import { colors, fonts } from "@/theme/tokens";

/**
 * Bottlewise wordmark — placeholder using the type system until the
 * real logo lands. The little sage dot stands in for the bottle-drop
 * glyph from the SVG asset.
 */
export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: size + 6,
          height: size + 6,
          borderRadius: 999,
          backgroundColor: colors.sageSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: colors.sage,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: size,
          color: colors.ink,
          letterSpacing: -0.5,
        }}
      >
        Bottlewise
      </Text>
    </View>
  );
}
