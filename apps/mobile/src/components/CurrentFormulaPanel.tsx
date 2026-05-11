import { Pressable, Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { Chip } from "./Chip";
import type { FormulaProduct } from "@/data/formula-catalog";
import type { StockStatus } from "@/state/stock";

interface Props {
  current: FormulaProduct;
  watched?: FormulaProduct;
  watchedStockStatus?: StockStatus;
  babyNameFirst: string;
  onOpenCurrent: () => void;
  onOpenWatched?: () => void;
}

const WATCHED_STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: "Back in stock",
  low: "Low stock — watching",
  oos: "Still out of stock — watching",
};

const WATCHED_STATUS_TONE: Record<
  StockStatus,
  "success" | "warn" | "danger"
> = {
  in_stock: "success",
  low: "warn",
  oos: "danger",
};

/**
 * Compact panel surfaced at the top of the Welcome screen when the
 * parent has set a current formula. Shows what's active + an optional
 * watched-for-restock row beneath.
 */
export function CurrentFormulaPanel({
  current,
  watched,
  watchedStockStatus,
  babyNameFirst,
  onOpenCurrent,
  onOpenWatched,
}: Props) {
  return (
    <View style={{ gap: spacing.s2 }}>
      <Pressable
        onPress={onOpenCurrent}
        style={{
          backgroundColor: colors.paper,
          borderColor: colors.mist,
          borderWidth: 1,
          borderRadius: radii.r4,
          padding: spacing.s5,
          flexDirection: "row",
          gap: spacing.s3,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radii.r3,
            backgroundColor: current.tinAccent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 10, color: colors.ink2 }}>tin</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 10,
              color: colors.sageDeep,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {babyNameFirst} is on
          </Text>
          <Text
            style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, lineHeight: 22 }}
            numberOfLines={1}
          >
            {current.fullName}
          </Text>
          <Text
            style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 17 }}
            numberOfLines={1}
          >
            {current.tagline}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 18, color: colors.ink3 }}>›</Text>
      </Pressable>

      {watched && watchedStockStatus && (
        <Pressable
          onPress={onOpenWatched}
          style={{
            backgroundColor: colors.paper,
            borderColor: colors.mist,
            borderWidth: 1,
            borderRadius: radii.r3,
            paddingVertical: spacing.s3,
            paddingHorizontal: spacing.s4,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.s3,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: 10,
                color: colors.ink2,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Watching for restock
            </Text>
            <Text
              style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}
              numberOfLines={1}
            >
              {watched.fullName}
            </Text>
          </View>
          <Chip tone={WATCHED_STATUS_TONE[watchedStockStatus]} dot>
            {WATCHED_STATUS_LABEL[watchedStockStatus]}
          </Chip>
        </Pressable>
      )}
    </View>
  );
}
