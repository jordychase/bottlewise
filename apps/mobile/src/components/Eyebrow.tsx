import { Text } from "react-native";
import { colors, fonts } from "@/theme/tokens";

export function Eyebrow({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "sage" | "clay" }) {
  const color = tone === "sage" ? colors.sageDeep : tone === "clay" ? colors.clayInk : colors.ink2;
  return (
    <Text
      style={{
        fontFamily: fonts.bodyBold,
        fontSize: 12,
        color,
        letterSpacing: 1,
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}
