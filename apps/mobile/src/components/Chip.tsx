import { Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

export type ChipTone = "neutral" | "success" | "warn" | "danger" | "info" | "honey" | "sage";

export interface ChipProps {
  tone?: ChipTone;
  dot?: boolean;
  children: React.ReactNode;
}

const toneStyles: Record<ChipTone, { bg: string; fg: string; border: string; dot: string }> = {
  neutral: { bg: colors.paper,      fg: colors.ink2,    border: colors.mist,     dot: colors.ink3 },
  success: { bg: colors.sageSoft,   fg: colors.sageInk, border: "transparent",   dot: "#5C8A6E"   },
  warn:    { bg: colors.claySoft,   fg: colors.clayInk, border: "transparent",   dot: colors.clay },
  danger:  { bg: colors.dangerSoft, fg: colors.dangerInk, border: "transparent", dot: colors.danger },
  info:    { bg: colors.infoSoft,   fg: colors.infoInk, border: "transparent",   dot: colors.info },
  honey:   { bg: colors.honeySoft,  fg: colors.honeyInk, border: "transparent",  dot: colors.honey },
  sage:    { bg: colors.sageSoft,   fg: colors.sageInk, border: "transparent",   dot: colors.sage },
};

export function Chip({ tone = "neutral", dot, children }: ChipProps) {
  const t = toneStyles[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: t.bg,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: radii.pill,
        paddingHorizontal: 11,
        paddingVertical: 5,
        alignSelf: "flex-start",
      }}
    >
      {dot && (
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: t.dot }} />
      )}
      <Text style={{ color: t.fg, fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 14 }}>
        {children}
      </Text>
    </View>
  );
}
