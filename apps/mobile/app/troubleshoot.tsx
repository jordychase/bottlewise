import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { SearchInput } from "@/components/SearchInput";
import { FormulaSearchResult } from "@/components/FormulaSearchResult";
import { searchFormulas } from "@/lib/search";
import { FORMULA_CATALOG } from "@/data/formula-catalog";
import { colors, fonts, spacing } from "@/theme/tokens";

/**
 * Flow B step 1: identify the current formula.
 *
 * The lookup is the moment the troubleshoot flow earns its right to exist.
 * Without knowing what's in their hand, "On formula, need help" is just a
 * less-personal version of the new-parent intake.
 */
export default function TroubleshootScreen() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchFormulas(query, 8), [query]);
  const showHints = query.trim().length === 0;

  return (
    <ScreenFrame disclaimer>
      <View style={{ paddingTop: spacing.s5, gap: spacing.s2 }}>
        <Eyebrow tone="sage">Step 1 of 3 · troubleshoot</Eyebrow>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 28,
            lineHeight: 32,
            color: colors.ink,
            letterSpacing: -0.5,
            marginTop: spacing.s1,
          }}
        >
          What are you using today?
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            lineHeight: 21,
            color: colors.ink2,
            marginTop: spacing.s2,
          }}
        >
          Type the brand, the product, or whatever's on the tin. "The orange Similac" works. "WIC formula" works.
        </Text>
      </View>

      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search formulas"
        autoFocus
      />

      {showHints ? (
        <View style={{ gap: spacing.s3 }}>
          <Eyebrow>Try searching</Eyebrow>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 }}>
            {["Similac Pro-Advance", "Bobbie", "Kendamil", "Parent's Choice", "Nutramigen", "WIC formula", "Kabrita goat", "Dutch HiPP"].map(
              (hint) => (
                <Pressable
                  key={hint}
                  onPress={() => setQuery(hint)}
                  style={{
                    backgroundColor: colors.sageSoft,
                    borderRadius: 999,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.sageInk }}>
                    {hint}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: 12,
              color: colors.ink2,
              marginTop: spacing.s2,
            }}
          >
            Indexing {FORMULA_CATALOG.length} formulas across mass-market, store brands, premium, European imports, and specialty.
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.paper,
            borderColor: colors.mist,
            borderWidth: 1,
            borderRadius: 12,
            padding: spacing.s5,
            gap: spacing.s2,
          }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
            We don't recognize that formula yet.
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
            If you can read the tin to us, we can add it. For now, try a partial brand name — Similac, Enfamil, Kendamil, Parent's Choice.
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.s2 }}>
          {results.map(({ formula }) => (
            <FormulaSearchResult
              key={formula.id}
              formula={formula}
              onPress={() => router.push(`/recommendations?currentFormula=${formula.id}`)}
            />
          ))}
        </View>
      )}

      <Pressable
        onPress={() => router.push("/recommendations")}
        style={{
          alignItems: "center",
          paddingVertical: spacing.s3,
          marginTop: spacing.s2,
        }}
      >
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink2 }}>
          Skip — I don't see my formula
        </Text>
      </Pressable>
    </ScreenFrame>
  );
}
