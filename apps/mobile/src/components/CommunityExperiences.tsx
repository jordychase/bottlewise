import { Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { Chip } from "./Chip";
import type { AggregateOutcome, CommunityExperience } from "@/lib/community";

interface Props {
  experiences: CommunityExperience[];
  aggregate: AggregateOutcome;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const TOLERANCE_LABEL = {
  well: "Going well",
  mixed: "Mixed",
  poor: "Not great",
  severe_reaction: "Severe reaction",
};
const TOLERANCE_TONE = {
  well: "success",
  mixed: "warn",
  poor: "danger",
  severe_reaction: "danger",
} as const;

export function CommunityExperiences({ experiences, aggregate }: Props) {
  return (
    <View style={{ gap: spacing.s3 }}>
      <Text
        style={{
          fontFamily: fonts.bodyBold,
          fontSize: 11,
          color: colors.ink2,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        Community experiences
      </Text>

      {aggregate.total > 0 && (
        <View
          style={{
            backgroundColor: colors.paper,
            borderColor: colors.mist,
            borderWidth: 1,
            borderRadius: radii.r3,
            padding: spacing.s4,
            gap: spacing.s2,
          }}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
            {aggregate.total} parents shared what happened on this formula.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {aggregate.well > 0 && <Chip tone="success" dot>Well · {aggregate.well}</Chip>}
            {aggregate.mixed > 0 && <Chip tone="warn" dot>Mixed · {aggregate.mixed}</Chip>}
            {aggregate.poor > 0 && <Chip tone="danger" dot>Not great · {aggregate.poor}</Chip>}
            {aggregate.severe > 0 && <Chip tone="danger" dot>Severe · {aggregate.severe}</Chip>}
          </View>
          {aggregate.topIssues.length > 0 && (
            <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.ink3, lineHeight: 18, marginTop: 2 }}>
              Most-mentioned: {aggregate.topIssues.map((i) => `${i.issue.replace("_", " ")} (${i.count})`).join(" · ")}
            </Text>
          )}
        </View>
      )}

      {experiences.length === 0 ? (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
          No experiences yet. Be the first to share.
        </Text>
      ) : (
        experiences.map((e) => {
          const isMine = e.id.startsWith("local-");
          return (
            <View
              key={e.id}
              style={{
                backgroundColor: colors.paper,
                borderColor: isMine ? colors.sage : colors.mist,
                borderWidth: isMine ? 2 : 1,
                borderRadius: radii.r3,
                padding: spacing.s4,
                gap: spacing.s2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.s2 }}>
                  <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink }}>
                    {isMine
                      ? "Your experience"
                      : e.consent === "first_name" && e.displayName
                        ? e.displayName
                        : "Anonymous parent"}
                  </Text>
                  <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.ink3 }}>
                    · {timeAgo(e.createdAt)}
                  </Text>
                </View>
                <Chip tone={TOLERANCE_TONE[e.tolerance]} dot>
                  {TOLERANCE_LABEL[e.tolerance]}
                </Chip>
              </View>
              {e.notes && (
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 21 }}>
                  "{e.notes}"
                </Text>
              )}
              {e.issuesObserved.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {e.issuesObserved.map((i) => (
                    <Chip key={i} tone="neutral">
                      {i.replace("_", " ")}
                    </Chip>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}
