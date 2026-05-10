import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

const ISSUES = [
  { id: "gas", label: "Gas" },
  { id: "reflux", label: "Reflux / spit-up" },
  { id: "fussy", label: "Fussy after feeds" },
  { id: "stools", label: "Hard or infrequent stools" },
  { id: "eczema", label: "Eczema or skin issue" },
  { id: "allergic", label: "Allergic reaction", safety: true },
  { id: "none", label: "None of the above", exclusive: true },
];

export default function IntakeScreen() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["reflux", "fussy"]));

  const toggle = (id: string, exclusive?: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (exclusive) return new Set(next.has(id) ? [] : [id]);
      next.delete("none");
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <ScreenFrame disclaimer>
      <View style={{ paddingTop: spacing.s5, gap: spacing.s2 }}>
        <Eyebrow>About Maya · Step 2 of 4</Eyebrow>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            lineHeight: 30,
            color: colors.ink,
            letterSpacing: -0.4,
            marginTop: spacing.s1,
          }}
        >
          What's Maya dealing with right now?
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
          Pick anything that fits — or skip if nothing applies. We won't diagnose anything; this just helps us narrow.
        </Text>
      </View>

      <View style={{ gap: spacing.s2, marginTop: spacing.s3 }}>
        {ISSUES.map((issue) => {
          const isSelected = selected.has(issue.id);
          return (
            <Pressable
              key={issue.id}
              onPress={() => toggle(issue.id, issue.exclusive)}
              style={{
                backgroundColor: colors.paper,
                borderColor: isSelected ? colors.sage : colors.mist,
                borderWidth: isSelected ? 2 : 1,
                borderRadius: radii.r3,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink }}>
                {issue.label}
              </Text>
              {isSelected && (
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    backgroundColor: colors.sage,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.paper, fontSize: 14, lineHeight: 14, fontFamily: fonts.bodyBold }}>
                    ✓
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: spacing.s3, marginTop: spacing.s4 }}>
        <Button variant="primary" full onPress={() => router.push("/recommendations")}>
          Continue
        </Button>
        <Pressable onPress={() => router.push("/recommendations")} style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink2 }}>
            Skip — none of the above
          </Text>
        </Pressable>
      </View>
    </ScreenFrame>
  );
}
