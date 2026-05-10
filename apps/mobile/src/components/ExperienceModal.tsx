import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { addExperience, type ConsentLevel, type Tolerance } from "@/lib/community";

interface Props {
  formulaId: string;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const TOLERANCE_CHIPS: { id: Tolerance; label: string }[] = [
  { id: "well", label: "Going well" },
  { id: "mixed", label: "Mixed" },
  { id: "poor", label: "Not great" },
  { id: "severe_reaction", label: "Severe reaction" },
];

const ISSUE_CHIPS = [
  { id: "gas", label: "Gas" },
  { id: "reflux", label: "Reflux" },
  { id: "constipation", label: "Constipation" },
  { id: "spit_up", label: "Spit-up" },
  { id: "fussy", label: "Fussy" },
  { id: "rash", label: "Rash" },
  { id: "allergic_reaction", label: "Allergic reaction" },
  { id: "feeding_refusal", label: "Feeding refusal" },
];

const CONSENT_OPTIONS: { id: ConsentLevel; title: string; hint: string }[] = [
  {
    id: "anonymous",
    title: "Share anonymously",
    hint: "Other parents see your note. Your name and account info are never shared.",
  },
  {
    id: "first_name",
    title: "Share with my first name",
    hint: "Other parents see your first name next to your note. Last name, location, and account info are never shared.",
  },
  {
    id: "private",
    title: "Keep it private",
    hint: "Saved to your trial history only. No other parent ever sees this.",
  },
];

export function ExperienceModal({ formulaId, visible, onClose, onSaved }: Props) {
  const [tolerance, setTolerance] = useState<Tolerance>("well");
  const [issues, setIssues] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState<ConsentLevel>("anonymous");
  const [displayName, setDisplayName] = useState("");

  const toggleIssue = (id: string) => {
    setIssues((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    addExperience({
      formulaId,
      tolerance,
      issuesObserved: Array.from(issues),
      notes: notes.trim(),
      consent,
      displayName: consent === "first_name" ? displayName.trim() || undefined : undefined,
    });
    setNotes("");
    setIssues(new Set());
    setDisplayName("");
    setConsent("anonymous");
    setTolerance("well");
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: "center", padding: spacing.s4 }}>
        <View
          style={{
            backgroundColor: colors.oat,
            borderRadius: radii.r5,
            maxHeight: "92%",
            overflow: "hidden",
          }}
        >
          <ScrollView contentContainerStyle={{ padding: spacing.s5, gap: spacing.s5 }}>
            <View style={{ gap: spacing.s2 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, letterSpacing: -0.4, lineHeight: 28 }}>
                Share what happened.
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink2, lineHeight: 21 }}>
                Other parents weighing this same formula will read this. Be honest — mixed and not-great experiences help more than perfect ones.
              </Text>
            </View>

            <View style={{ gap: spacing.s2 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                How is it going?
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 }}>
                {TOLERANCE_CHIPS.map((t) => {
                  const active = tolerance === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setTolerance(t.id)}
                      style={{
                        backgroundColor: active ? colors.sage : colors.paper,
                        borderColor: active ? colors.sage : colors.mist,
                        borderWidth: 1,
                        borderRadius: 999,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: active ? colors.onPrimary : colors.ink }}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: spacing.s2 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                Anything you noticed? (optional)
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 }}>
                {ISSUE_CHIPS.map((issue) => {
                  const active = issues.has(issue.id);
                  return (
                    <Pressable
                      key={issue.id}
                      onPress={() => toggleIssue(issue.id)}
                      style={{
                        backgroundColor: active ? colors.sageSoft : colors.paper,
                        borderColor: active ? colors.sage : colors.mist,
                        borderWidth: 1,
                        borderRadius: 999,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: active ? colors.sageInk : colors.ink2 }}>
                        {issue.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: spacing.s2 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                In your words
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
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={5}
                  placeholder="What worked, what didn't, what you'd tell another parent considering this."
                  placeholderTextColor={colors.ink3}
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: colors.ink,
                    lineHeight: 21,
                    minHeight: 80,
                    textAlignVertical: "top",
                    // @ts-expect-error react-native-web supports outlineStyle
                    outlineStyle: "none",
                  }}
                />
              </View>
              <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.ink3, lineHeight: 16 }}>
                We don't store your baby's name, your DOB, or anything from your profile in this note.
              </Text>
            </View>

            <View style={{ gap: spacing.s2 }}>
              <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                Who can see this?
              </Text>
              {CONSENT_OPTIONS.map((opt) => {
                const active = consent === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setConsent(opt.id)}
                    style={{
                      backgroundColor: colors.paper,
                      borderColor: active ? colors.sage : colors.mist,
                      borderWidth: active ? 2 : 1,
                      borderRadius: radii.r3,
                      padding: spacing.s4,
                      gap: 4,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s2 }}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          borderWidth: 1.5,
                          borderColor: active ? colors.sage : colors.borderStrong,
                          backgroundColor: active ? colors.sage : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {active && <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: colors.paper }} />}
                      </View>
                      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink }}>
                        {opt.title}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink2, lineHeight: 18, marginLeft: 28 }}>
                      {opt.hint}
                    </Text>
                  </Pressable>
                );
              })}
              {consent === "first_name" && (
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
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="First name"
                    placeholderTextColor={colors.ink3}
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 14,
                      color: colors.ink,
                      // @ts-expect-error react-native-web supports outlineStyle
                      outlineStyle: "none",
                    }}
                  />
                </View>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: spacing.s2, marginTop: spacing.s2 }}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" full onPress={onClose}>
                  Cancel
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="primary" full onPress={handleSave}>
                  Save experience
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
