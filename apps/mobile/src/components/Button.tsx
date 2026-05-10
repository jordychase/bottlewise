import { Pressable, Text, View, type ViewStyle } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "tertiary" | "danger" | "sageSoft";
type Size = "sm" | "md";

export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { bg: string; fg: string; bgPressed: string; border: string }> = {
  primary:   { bg: colors.sage,      fg: colors.onPrimary, bgPressed: colors.sageDeep, border: "transparent" },
  secondary: { bg: "transparent",    fg: colors.ink,       bgPressed: colors.mist,     border: colors.borderStrong },
  tertiary:  { bg: "transparent",    fg: colors.sageDeep,  bgPressed: colors.sageSoft, border: "transparent" },
  danger:    { bg: colors.danger,    fg: colors.onPrimary, bgPressed: colors.dangerDeep, border: "transparent" },
  sageSoft:  { bg: colors.sageSoft,  fg: colors.sageInk,   bgPressed: "#C8D8CC",       border: "transparent" },
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  disabled,
  onPress,
  children,
  style,
}: ButtonProps) {
  const v = variantStyles[variant];
  const isSm = size === "sm";
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          backgroundColor: disabled ? "#C5D2C9" : pressed ? v.bgPressed : v.bg,
          borderColor: v.border,
          borderWidth: 1,
          borderRadius: isSm ? radii.r2 : radii.r3,
          paddingVertical: isSm ? spacing.s2 : spacing.s3,
          paddingHorizontal: isSm ? spacing.s3 : spacing.s5,
          alignSelf: full ? "stretch" : "flex-start",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.s2,
        },
        full ? { alignSelf: "stretch" } : null,
        style,
      ]}
    >
      <Text
        style={{
          color: v.fg,
          fontFamily: fonts.bodySemi,
          fontSize: isSm ? 13 : 15,
          lineHeight: isSm ? 16 : 18,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
