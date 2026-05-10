import { Pressable, Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

interface Props {
  selected?: boolean;
  onPress: () => void;
  title: string;
  hint?: string;
}

export function RadioCard({ selected, onPress, title, hint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.paper,
        borderColor: selected ? colors.sage : colors.mist,
        borderWidth: selected ? 2 : 1,
        borderRadius: radii.r4,
        padding: 18,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.s3,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 16, color: colors.ink, lineHeight: 22 }}>
          {title}
        </Text>
        {hint && (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.ink2,
              marginTop: 4,
              lineHeight: 21,
            }}
          >
            {hint}
          </Text>
        )}
      </View>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: selected ? colors.sage : colors.borderStrong,
          backgroundColor: selected ? colors.sage : "transparent",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
        }}
      >
        {selected && <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.paper }} />}
      </View>
    </Pressable>
  );
}
