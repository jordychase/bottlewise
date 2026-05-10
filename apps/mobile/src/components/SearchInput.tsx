import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

interface Props extends Omit<TextInputProps, "style"> {
  autoFocus?: boolean;
}

export function SearchInput(props: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        backgroundColor: colors.paper,
        borderColor: focused ? colors.sage : colors.borderStrong,
        borderWidth: focused ? 2 : 1,
        borderRadius: radii.r3,
        paddingHorizontal: spacing.s4,
        paddingVertical: spacing.s3,
      }}
    >
      <TextInput
        autoCorrect={false}
        autoCapitalize="none"
        placeholderTextColor={colors.ink3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.ink,
          padding: 0,
          margin: 0,
          // @ts-expect-error react-native-web supports outlineStyle
          outlineStyle: "none",
        }}
        {...props}
      />
    </View>
  );
}
