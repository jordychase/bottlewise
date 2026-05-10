import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { SafetyInterstitial } from "@/components/SafetyInterstitial";
import { findFormulaById } from "@/data/formula-catalog";
import { colors, fonts, spacing } from "@/theme/tokens";

export default function RecallSafetyScreen() {
  const { formulaId } = useLocalSearchParams<{ formulaId: string }>();
  const formula = formulaId ? findFormulaById(formulaId) : undefined;

  if (!formula?.activeRecall) {
    return (
      <ScreenFrame disclaimer>
        <View style={{ paddingTop: spacing.s10, gap: spacing.s3, alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>
            No active recall on file.
          </Text>
        </View>
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame disclaimer>
      <View style={{ paddingTop: spacing.s5 }}>
        <SafetyInterstitial
          formula={formula}
          recall={formula.activeRecall}
          onAcknowledge={() => router.push(`/formula/${formula.id}`)}
          onCallPediatrician={() => {
            // Real impl would use Linking.openURL('tel:...') with a stored
            // pediatrician number. For demo, just acknowledge.
          }}
          onShowAlternatives={() =>
            router.push(`/formula/${formula.id}/substitutes?reason=recalled`)
          }
        />
      </View>
    </ScreenFrame>
  );
}
