import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import type { FormulaProduct } from "@/data/formula-catalog";
import {
  BUFFER_MAX_DAYS,
  SUPPLY_OPTIONS,
  defaultOzPerDayForAgeMonths,
  suggestQuantity,
} from "@/lib/quantity-math";

interface Props {
  formula: FormulaProduct;
  /** Baby age in months — drives the default oz/day if the user doesn't
   *  override. Optional; falls back to 28 oz/day (3 mo default). */
  ageMonths?: number;
}

/**
 * Inline ordering helper on the formula detail page.
 *
 * Voice rules: never "stock up." Buffer language only. Cap at 10 days
 * to avoid the hoarding pattern that broke the 2022 crisis.
 */
export function QuantitySuggester({ formula, ageMonths = 3 }: Props) {
  const [ozPerDay, setOzPerDay] = useState<number>(defaultOzPerDayForAgeMonths(ageMonths));
  const [daysOfSupply, setDaysOfSupply] = useState<(typeof SUPPLY_OPTIONS)[number]>(14);
  const [bufferDays, setBufferDays] = useState<number>(3);

  const result = suggestQuantity(formula, { ozPerDay, daysOfSupply, bufferDays });

  return (
    <View
      style={{
        backgroundColor: colors.paper,
        borderColor: colors.mist,
        borderWidth: 1,
        borderRadius: radii.r4,
        padding: spacing.s5,
        gap: spacing.s4,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 11,
            color: colors.ink2,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          How much should I order?
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
          A small calculator, not a stocking-up tool. Buffer capped at {BUFFER_MAX_DAYS} days on purpose.
        </Text>
      </View>

      <View style={{ gap: spacing.s2 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
          Daily intake
        </Text>
        <View
          style={{
            backgroundColor: colors.oat,
            borderColor: colors.mist,
            borderWidth: 1,
            borderRadius: radii.r3,
            paddingHorizontal: spacing.s4,
            paddingVertical: spacing.s2,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.s2,
          }}
        >
          <TextInput
            value={String(ozPerDay)}
            onChangeText={(t) => {
              const n = parseInt(t, 10);
              setOzPerDay(Number.isFinite(n) ? Math.max(0, Math.min(48, n)) : 0);
            }}
            keyboardType="numeric"
            style={{
              fontFamily: fonts.display,
              fontSize: 22,
              color: colors.ink,
              minWidth: 50,
              padding: 0,
              // @ts-expect-error react-native-web supports outlineStyle
              outlineStyle: "none",
            }}
          />
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink2 }}>oz per day</Text>
          <Pressable
            onPress={() => setOzPerDay(defaultOzPerDayForAgeMonths(ageMonths))}
            style={{ marginLeft: "auto" }}
          >
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.sageDeep }}>
              Reset to typical
            </Text>
          </Pressable>
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.ink3, lineHeight: 16 }}>
          Typical {ageMonths}-month range: {defaultOzPerDayForAgeMonths(ageMonths) - 4}–{defaultOzPerDayForAgeMonths(ageMonths) + 4} oz/day per AAP guidance.
        </Text>
      </View>

      <View style={{ gap: spacing.s2 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
          Cover how many days?
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.s2 }}>
          {SUPPLY_OPTIONS.map((d) => {
            const active = daysOfSupply === d;
            return (
              <Pressable
                key={d}
                onPress={() => setDaysOfSupply(d)}
                style={{
                  flex: 1,
                  paddingVertical: spacing.s3,
                  borderRadius: radii.r3,
                  backgroundColor: active ? colors.sage : colors.oat,
                  borderColor: active ? colors.sage : colors.mist,
                  borderWidth: 1,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodySemi,
                    fontSize: 14,
                    color: active ? colors.onPrimary : colors.ink,
                  }}
                >
                  {d} days
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: spacing.s2 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
          Safety buffer
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.s2 }}>
          {[0, 3, 7, 10].map((d) => {
            const active = bufferDays === d;
            return (
              <Pressable
                key={d}
                onPress={() => setBufferDays(d)}
                style={{
                  flex: 1,
                  paddingVertical: spacing.s3,
                  borderRadius: radii.r3,
                  backgroundColor: active ? colors.sageSoft : colors.oat,
                  borderColor: active ? colors.sage : colors.mist,
                  borderWidth: 1,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodySemi,
                    fontSize: 13,
                    color: active ? colors.sageInk : colors.ink,
                  }}
                >
                  +{d}d
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={{
          backgroundColor: colors.sageSoft,
          borderRadius: radii.r3,
          padding: spacing.s4,
          gap: spacing.s2,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 11,
            color: colors.sageInk,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          Order
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.s2 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 42, color: colors.ink, letterSpacing: -1 }}>
            {result.packageCount}
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.ink2 }}>
            {result.packageCount === 1 ? "can" : "cans"}{formula.packageSize ? ` · ${formula.packageSize}` : ""}
          </Text>
        </View>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
          {result.rationale}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 17 }}>
          That covers about <Text style={{ fontFamily: fonts.bodySemi }}>{result.daysCovered} days</Text> at {ozPerDay} oz/day.
        </Text>
      </View>
    </View>
  );
}
