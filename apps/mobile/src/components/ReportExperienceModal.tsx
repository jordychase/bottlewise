import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { Button } from "./Button";
import {
  addReport,
  REPORT_REASON_HINT,
  REPORT_REASON_LABEL,
  type ReportReason,
} from "@/lib/reports";

interface Props {
  visible: boolean;
  experienceId: string;
  onClose: () => void;
  onReported: () => void;
}

const REASONS: ReportReason[] = [
  "medical_misinformation",
  "personal_info",
  "abusive",
  "spam_or_promo",
  "other",
];

export function ReportExperienceModal({
  visible,
  experienceId,
  onClose,
  onReported,
}: Props) {
  const [reason, setReason] = useState<ReportReason>("medical_misinformation");
  const [detail, setDetail] = useState("");
  const [hideLocally, setHideLocally] = useState(true);

  const submit = () => {
    addReport({
      experienceId,
      reason,
      detail: detail.trim() || undefined,
      hideLocally,
    });
    setDetail("");
    setReason("medical_misinformation");
    setHideLocally(true);
    onReported();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
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
            maxHeight: "92%",
            overflow: "hidden",
          }}
        >
          <ScrollView contentContainerStyle={{ padding: spacing.s5, gap: spacing.s4 }}>
            <View style={{ gap: spacing.s2 }}>
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 22,
                  color: colors.ink,
                  letterSpacing: -0.4,
                  lineHeight: 26,
                }}
              >
                Report this experience
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 13,
                  color: colors.ink2,
                  lineHeight: 19,
                }}
              >
                Reports go to a moderation queue. We commit to reviewing within 72 hours per the Terms of Service.
              </Text>
            </View>

            <View style={{ gap: spacing.s2 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                What's the issue?
              </Text>
              {REASONS.map((r) => {
                const active = reason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setReason(r)}
                    style={{
                      backgroundColor: colors.paper,
                      borderColor: active ? colors.sage : colors.mist,
                      borderWidth: active ? 2 : 1,
                      borderRadius: radii.r3,
                      padding: spacing.s4,
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: spacing.s2,
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        borderWidth: 1.5,
                        borderColor: active ? colors.sage : colors.borderStrong,
                        backgroundColor: active ? colors.sage : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {active && (
                        <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: colors.paper }} />
                      )}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>
                        {REPORT_REASON_LABEL[r]}
                      </Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 17 }}>
                        {REPORT_REASON_HINT[r]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ gap: spacing.s2 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                Anything we should know? (optional)
              </Text>
              <View
                style={{
                  backgroundColor: colors.paper,
                  borderColor: colors.mist,
                  borderWidth: 1,
                  borderRadius: radii.r3,
                  paddingHorizontal: spacing.s4,
                  paddingVertical: spacing.s3,
                }}
              >
                <TextInput
                  value={detail}
                  onChangeText={setDetail}
                  multiline
                  numberOfLines={3}
                  placeholder="Brief context for the moderator."
                  placeholderTextColor={colors.ink3}
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: colors.ink,
                    lineHeight: 21,
                    minHeight: 60,
                    textAlignVertical: "top",
                    // @ts-expect-error react-native-web supports outlineStyle
                    outlineStyle: "none",
                  }}
                />
              </View>
            </View>

            <Pressable
              onPress={() => setHideLocally((v) => !v)}
              style={{
                backgroundColor: hideLocally ? colors.sageSoft : colors.paper,
                borderColor: hideLocally ? colors.sage : colors.mist,
                borderWidth: hideLocally ? 2 : 1,
                borderRadius: radii.r3,
                padding: spacing.s4,
                flexDirection: "row",
                alignItems: "flex-start",
                gap: spacing.s2,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  borderWidth: 1.5,
                  borderColor: hideLocally ? colors.sage : colors.borderStrong,
                  backgroundColor: hideLocally ? colors.sage : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {hideLocally && (
                  <Text style={{ color: colors.paper, fontSize: 12, lineHeight: 12, fontFamily: fonts.bodyBold }}>
                    ✓
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>
                  Hide this from me while it's being reviewed
                </Text>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 17 }}>
                  This experience won't appear on your device until the moderation team makes a decision.
                </Text>
              </View>
            </Pressable>

            <View style={{ flexDirection: "row", gap: spacing.s2, marginTop: spacing.s2 }}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" full onPress={onClose}>
                  Cancel
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="primary" full onPress={submit}>
                  Submit report
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
