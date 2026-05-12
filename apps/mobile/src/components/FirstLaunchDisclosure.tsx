import { Modal, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "./Button";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

interface Props {
  visible: boolean;
  onAccept: () => void;
}

/**
 * Apple Guideline 1.4 / Play Health Apps policy alignment.
 *
 * A health-adjacent app gets faster review and clearer compliance posture
 * with an explicit, one-time disclosure on first launch that:
 *   - States the app is decision-support, not medical advice
 *   - Names the data we collect about the baby
 *   - Surfaces the safety-trigger routing (pediatrician interstitial)
 *   - Links to the full Privacy Policy + Terms of Service
 *   - Requires the parent to explicitly consent before proceeding
 *
 * The acceptance flag is persisted on the baby profile so the modal
 * never reappears for that user.
 */
export function FirstLaunchDisclosure({ visible, onAccept }: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.scrim,
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.oat,
            borderTopLeftRadius: radii.r5,
            borderTopRightRadius: radii.r5,
            padding: spacing.s6,
            gap: spacing.s4,
            maxHeight: "92%",
          }}
        >
          <View style={{ gap: spacing.s2 }}>
            <Text
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: 11,
                color: colors.sageInk,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Before we start
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 26,
                lineHeight: 30,
                color: colors.ink,
                letterSpacing: -0.4,
              }}
            >
              Bottlewise is decision-support, not medical advice.
            </Text>
          </View>

          <View style={{ gap: spacing.s3 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
              Bottlewise helps you find a formula that fits your baby's profile, your family's history, and your budget. We don't diagnose, we don't treat, we don't replace your pediatrician.
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
              We collect what we need to do the job: your baby's age and family allergy history, the formula you're on, and what you've observed. None of it leaves your device unless you choose to share it.
            </Text>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
              If you mention an allergic reaction, blood in stool, severe vomiting, dehydration, or any safety concern, Bottlewise routes you to your pediatrician before any formula content shows.
            </Text>
            <Text
              style={{
                fontFamily: fonts.bodySemi,
                fontSize: 14,
                color: colors.ink,
                lineHeight: 21,
              }}
            >
              Always confirm with your pediatrician before any feeding change.
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.s3, marginTop: spacing.s2 }}>
            <Pressable onPress={() => router.push("/legal/privacy" as never)}>
              <Text
                style={{
                  fontFamily: fonts.bodySemi,
                  fontSize: 13,
                  color: colors.sageDeep,
                  textDecorationLine: "underline",
                }}
              >
                Privacy Policy
              </Text>
            </Pressable>
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2 }}>·</Text>
            <Pressable onPress={() => router.push("/legal/terms" as never)}>
              <Text
                style={{
                  fontFamily: fonts.bodySemi,
                  fontSize: 13,
                  color: colors.sageDeep,
                  textDecorationLine: "underline",
                }}
              >
                Terms of Service
              </Text>
            </Pressable>
          </View>

          <Button variant="primary" full onPress={onAccept}>
            I understand — continue
          </Button>
        </View>
      </View>
    </Modal>
  );
}
