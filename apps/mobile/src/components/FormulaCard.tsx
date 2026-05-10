import { Pressable, Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { Chip } from "./Chip";

export type StockStatus = "in_stock" | "low" | "oos" | "unknown";

export interface Formula {
  id: string;
  brand: string;
  name: string;
  perOz: string;
  stock: StockStatus;
  stockAgo?: string;
  origin?: "us" | "european";
  tags?: string[];
  reason?: string;
  tinAccent?: string;
}

interface FormulaCardProps {
  formula: Formula;
  eyebrow?: string;
  onPress?: () => void;
  compact?: boolean;
}

function Tin({ size = 72, accent }: { size?: number; accent?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.r3,
        backgroundColor: accent ?? colors.mist,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.ink2 }}>[ tin ]</Text>
    </View>
  );
}

function StockBadge({ status, ago }: { status: StockStatus; ago?: string }) {
  if (status === "in_stock")
    return <Chip tone="success" dot>{`In stock${ago ? ` — ${ago}` : ""}`}</Chip>;
  if (status === "low") return <Chip tone="warn" dot>Low stock locally</Chip>;
  if (status === "oos") return <Chip tone="danger" dot>Out of stock</Chip>;
  return <Chip tone="neutral" dot>Stock unknown</Chip>;
}

export function FormulaCard({ formula, eyebrow, onPress, compact }: FormulaCardProps) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper
      onPress={onPress}
      style={{
        backgroundColor: colors.paper,
        borderColor: colors.mist,
        borderWidth: 1,
        borderRadius: radii.r4,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: "row", gap: 14 }}>
        <Tin accent={formula.tinAccent} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.s2 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              {eyebrow && (
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 10,
                    color: colors.sageDeep,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {eyebrow}
                </Text>
              )}
              <Text style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.ink }}>
                {formula.name}
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, marginTop: 2 }}>
                {formula.brand}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink, letterSpacing: -0.3 }}>
                ${formula.perOz}
              </Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.ink2 }}>
                /oz
              </Text>
            </View>
          </View>
        </View>
      </View>

      {!compact && formula.reason && (
        <Text
          style={{
            color: colors.ink2,
            fontFamily: fonts.body,
            fontSize: 14,
            lineHeight: 21,
            marginTop: spacing.s3,
          }}
        >
          {formula.reason}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: spacing.s3 }}>
        <StockBadge status={formula.stock} ago={formula.stockAgo} />
        {formula.origin === "european" && <Chip tone="honey">European import</Chip>}
        {formula.tags?.map((t) => (
          <Chip key={t} tone="neutral">{t}</Chip>
        ))}
      </View>
    </Wrapper>
  );
}
