import { router } from "expo-router";
import { Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { RadioCard } from "@/components/RadioCard";
import { Wordmark } from "@/components/Wordmark";
import { colors, fonts, spacing } from "@/theme/tokens";

export default function WelcomeScreen() {
  return (
    <ScreenFrame>
      <View style={{ paddingTop: spacing.s6, gap: spacing.s3 }}>
        <Wordmark />
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 34,
            lineHeight: 38,
            color: colors.ink,
            letterSpacing: -0.7,
            marginTop: spacing.s4,
          }}
        >
          The calmest place to make the most stressful decision of new parenthood.
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 22,
            color: colors.ink2,
            marginTop: spacing.s1,
          }}
        >
          Three picks for your baby — with the reasons, the cost, and what's actually in stock today.
        </Text>
      </View>

      <View style={{ gap: spacing.s2, marginTop: spacing.s6 }}>
        <Eyebrow>Where are you starting?</Eyebrow>
        <RadioCard
          title="New to formula"
          hint="Help me pick a first formula based on my baby's profile."
          onPress={() => router.push("/intake")}
        />
        <RadioCard
          title="On formula, need help"
          hint="Stock issue, tolerance issue, or trying to find something gentler."
          onPress={() => router.push("/troubleshoot")}
        />
      </View>

      <View style={{ marginTop: spacing.s6, alignItems: "center" }}>
        <Button variant="primary" full onPress={() => router.push("/intake")}>
          Find my baby's match
        </Button>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.ink2,
            marginTop: spacing.s4,
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          Information &amp; decision-support, not medical advice.
        </Text>
      </View>
    </ScreenFrame>
  );
}
