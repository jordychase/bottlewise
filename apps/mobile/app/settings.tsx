import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Eyebrow } from "@/components/Eyebrow";
import { Button } from "@/components/Button";
import { useBabyProfile } from "@/state/baby-profile";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

export default function SettingsScreen() {
  const { profile, deleteAllLocalData } = useBabyProfile();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [step, setStep] = useState<"warning" | "final">("warning");

  const performDelete = () => {
    deleteAllLocalData();
    setConfirmOpen(false);
    setStep("warning");
    // Navigate to root — the empty profile will surface the first-time UX.
    router.replace("/");
  };

  return (
    <ScreenFrame>
      <Pressable onPress={() => router.back()} style={{ paddingVertical: spacing.s2 }}>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.sageDeep }}>
          ← Back
        </Text>
      </Pressable>

      <View style={{ gap: spacing.s2 }}>
        <Eyebrow tone="sage">Settings</Eyebrow>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 28,
            lineHeight: 32,
            color: colors.ink,
            letterSpacing: -0.5,
          }}
        >
          Your account and data
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.paper,
          borderColor: colors.mist,
          borderWidth: 1,
          borderRadius: radii.r4,
          padding: spacing.s5,
          gap: spacing.s2,
        }}
      >
        <Eyebrow>Profile summary</Eyebrow>
        <Row label="Baby's name" value={profile.babyNameFirst || "Not set"} />
        <Row label="Age (months)" value={String(profile.babyAgeMonths)} />
        <Row label="Prep method" value={prepLabel(profile.prepMethod)} />
        <Row
          label="Current formula"
          value={profile.currentFormulaId ?? "None set"}
        />
        <Row
          label="Watching for restock"
          value={profile.watchForRestock ? "Yes" : "No"}
        />
      </View>

      <View style={{ gap: spacing.s3 }}>
        <Eyebrow>Legal</Eyebrow>
        <LinkRow
          label="Privacy Policy"
          onPress={() => router.push("/legal/privacy" as never)}
        />
        <LinkRow
          label="Terms of Service"
          onPress={() => router.push("/legal/terms" as never)}
        />
      </View>

      <View
        style={{
          backgroundColor: colors.dangerSoft,
          borderColor: colors.danger,
          borderWidth: 1,
          borderRadius: radii.r4,
          padding: spacing.s5,
          gap: spacing.s3,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 11,
            color: colors.dangerInk,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          Delete my account
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 20 }}>
          Wipes your baby profile, every trial outcome you logged, every recommendation you saw, every Community Experience you submitted with Private consent, and every Report you made — all from this device, immediately.
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 18 }}>
          Community Experiences you submitted with Anonymous or First name consent stay in the public dataset because they have no identifier tied back to you. To remove a specific submission, email privacy@bottlewise.app with the submission ID.
        </Text>
        <Button variant="danger" full onPress={() => setConfirmOpen(true)}>
          Delete everything
        </Button>
      </View>

      <Modal visible={confirmOpen} animationType="fade" transparent onRequestClose={() => setConfirmOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.scrim,
            justifyContent: "center",
            padding: spacing.s4,
          }}
        >
          <View
            style={{
              backgroundColor: colors.oat,
              borderRadius: radii.r5,
              padding: spacing.s5,
              gap: spacing.s4,
            }}
          >
            {step === "warning" ? (
              <>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 22,
                    color: colors.ink,
                    letterSpacing: -0.4,
                    lineHeight: 26,
                  }}
                >
                  This can't be undone.
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
                  Every trace of {profile.babyNameFirst || "your baby"}'s profile on this device will be removed. Are you sure?
                </Text>
                <View style={{ flexDirection: "row", gap: spacing.s2 }}>
                  <View style={{ flex: 1 }}>
                    <Button variant="secondary" full onPress={() => setConfirmOpen(false)}>
                      Cancel
                    </Button>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button variant="danger" full onPress={() => setStep("final")}>
                      Continue
                    </Button>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 22,
                    color: colors.dangerInk,
                    letterSpacing: -0.4,
                    lineHeight: 26,
                  }}
                >
                  Tap to confirm.
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
                  Bottlewise will return you to the welcome screen with an empty profile.
                </Text>
                <View style={{ flexDirection: "row", gap: spacing.s2 }}>
                  <View style={{ flex: 1 }}>
                    <Button variant="secondary" full onPress={() => { setConfirmOpen(false); setStep("warning"); }}>
                      Back
                    </Button>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button variant="danger" full onPress={performDelete}>
                      Yes, delete everything
                    </Button>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", gap: spacing.s2 }}>
      <Text
        style={{
          fontFamily: fonts.bodySemi,
          fontSize: 12,
          color: colors.ink2,
          width: 110,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 20 }}>
        {value}
      </Text>
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.paper,
        borderColor: colors.mist,
        borderWidth: 1,
        borderRadius: radii.r3,
        paddingVertical: spacing.s4,
        paddingHorizontal: spacing.s5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.ink3 }}>›</Text>
    </Pressable>
  );
}

function prepLabel(prep: string): string {
  return (
    {
      hand: "Hand-measure with the scoop",
      baby_brezza: "Baby Brezza Formula Pro",
      tommee_tippee: "Tommee Tippee Perfect Prep",
      dr_browns: "Dr. Brown's Insta-Feed",
      other: "Other",
    } as Record<string, string>
  )[prep] ?? prep;
}
