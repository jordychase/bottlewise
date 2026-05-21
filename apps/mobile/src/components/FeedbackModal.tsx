import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Button } from "./Button";
import { Eyebrow } from "./Eyebrow";
import { useBabyProfile } from "@/state/baby-profile";
import {
  CATEGORY_LABEL,
  submitFeedback,
  type FeedbackCategory,
  type SubmitResult,
} from "@/lib/feedback";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

interface Props {
  visible: boolean;
  currentRoute: string;
  onClose: () => void;
}

const CATEGORIES: FeedbackCategory[] = [
  "bug",
  "confusing",
  "missing_feature",
  "love_it",
  "general",
];

export function FeedbackModal({ visible, currentRoute, onClose }: Props) {
  const { profile } = useBabyProfile();
  const [category, setCategory] = useState<FeedbackCategory>("confusing");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);

  const close = () => {
    setMessage("");
    setEmail("");
    setCategory("confusing");
    setResult(null);
    onClose();
  };

  const submit = () => {
    if (!message.trim()) return;
    const r = submitFeedback({
      category,
      message: message.trim(),
      route: currentRoute,
      profile,
      email: email.trim() || undefined,
    });
    setResult(r);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
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
            {!result ? (
              <>
                <View style={{ gap: spacing.s2 }}>
                  <Eyebrow tone="sage">Beta · we want to know</Eyebrow>
                  <Text
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 22,
                      color: colors.ink,
                      letterSpacing: -0.4,
                      lineHeight: 26,
                    }}
                  >
                    What's on your mind?
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 13,
                      color: colors.ink2,
                      lineHeight: 19,
                    }}
                  >
                    Tester notes go straight to the build team. We attach the route you're on and a sanitized snapshot of your demo profile so we can repro. Nothing about your baby is shared.
                  </Text>
                </View>

                <View style={{ gap: spacing.s2 }}>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                    What kind of feedback?
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 }}>
                    {CATEGORIES.map((c) => {
                      const active = category === c;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => setCategory(c)}
                          style={{
                            backgroundColor: active ? colors.sage : colors.paper,
                            borderColor: active ? colors.sage : colors.mist,
                            borderWidth: 1,
                            borderRadius: radii.pill,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: fonts.bodySemi,
                              fontSize: 13,
                              color: active ? colors.onPrimary : colors.ink,
                            }}
                          >
                            {CATEGORY_LABEL[c]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={{ gap: spacing.s2 }}>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                    Tell us
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
                      value={message}
                      onChangeText={setMessage}
                      multiline
                      numberOfLines={5}
                      placeholder="What broke, what confused you, what you wish it did. Whatever's most useful."
                      placeholderTextColor={colors.ink3}
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 14,
                        color: colors.ink,
                        lineHeight: 21,
                        minHeight: 90,
                        textAlignVertical: "top",
                        // @ts-expect-error rn-web supports outlineStyle
                        outlineStyle: "none",
                      }}
                    />
                  </View>
                </View>

                <View style={{ gap: spacing.s2 }}>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                    Email (optional)
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
                      value={email}
                      onChangeText={setEmail}
                      placeholder="If you want a reply."
                      placeholderTextColor={colors.ink3}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 14,
                        color: colors.ink,
                        // @ts-expect-error rn-web supports outlineStyle
                        outlineStyle: "none",
                      }}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: spacing.s2, marginTop: spacing.s2 }}>
                  <View style={{ flex: 1 }}>
                    <Button variant="secondary" full onPress={close}>
                      Cancel
                    </Button>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button variant="primary" full onPress={submit}>
                      Send feedback
                    </Button>
                  </View>
                </View>
              </>
            ) : (
              <ResultPanel result={result} onClose={close} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ResultPanel({ result, onClose }: { result: SubmitResult; onClose: () => void }) {
  if (result.kind === "mailto_opened") {
    return (
      <View style={{ gap: spacing.s3 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink, letterSpacing: -0.4 }}>
          Thanks. Your email client is opening.
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
          Hit send when you're ready. We read every note within 48 hours.
        </Text>
        <Button variant="primary" full onPress={onClose}>
          Back to Bottlewise
        </Button>
      </View>
    );
  }
  if (result.kind === "clipboard") {
    return (
      <View style={{ gap: spacing.s3 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink, letterSpacing: -0.4 }}>
          Couldn't open your mail client.
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
          We copied your feedback to your clipboard. Open any email app and paste into a new email to feedback@bottlewise.app.
        </Text>
        <Button variant="primary" full onPress={onClose}>
          Got it
        </Button>
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.s3 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.dangerInk, letterSpacing: -0.4 }}>
        Something went sideways.
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
        We couldn't deliver your note: {result.reason}. Email feedback@bottlewise.app directly with what you wanted to say.
      </Text>
      <Button variant="primary" full onPress={onClose}>
        Close
      </Button>
    </View>
  );
}
