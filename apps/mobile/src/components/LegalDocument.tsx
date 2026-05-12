import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import type { LegalDocument as LegalDocumentType } from "@/data/legal-text";

interface Props {
  document: LegalDocumentType;
}

export function LegalDocumentScreen({ document }: Props) {
  return (
    <ScreenFrame disclaimer>
      <Pressable onPress={() => router.back()} style={{ paddingVertical: spacing.s2 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.sageDeep }}>
          ← Back
        </Text>
      </Pressable>

      <View style={{ paddingTop: spacing.s2, gap: spacing.s2 }}>
        <Eyebrow tone="sage">Bottlewise</Eyebrow>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 32,
            lineHeight: 36,
            color: colors.ink,
            letterSpacing: -0.6,
          }}
        >
          {document.title}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2 }}>
          Effective {document.effectiveDate}
        </Text>
      </View>

      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
        {document.intro}
      </Text>

      {document.sections.map((section, idx) => (
        <View
          key={idx}
          style={{
            backgroundColor: colors.paper,
            borderColor: colors.mist,
            borderWidth: 1,
            borderRadius: radii.r3,
            padding: spacing.s5,
            gap: spacing.s3,
          }}
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.ink, letterSpacing: -0.3, lineHeight: 24 }}>
            {section.heading}
          </Text>
          {section.paragraphs.map((p, j) => (
            <Text
              key={j}
              style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 22 }}
            >
              {p}
            </Text>
          ))}
        </View>
      ))}

      <View
        style={{
          backgroundColor: colors.sageSoft,
          borderRadius: radii.r3,
          padding: spacing.s5,
          gap: spacing.s2,
        }}
      >
        <Eyebrow tone="sage">Contact</Eyebrow>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 20 }}>
          {document.contact}
        </Text>
      </View>

      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.ink2, lineHeight: 17 }}>
        This document is reviewed before every public release. The full canonical text lives in the Bottlewise repository.
      </Text>
    </ScreenFrame>
  );
}
