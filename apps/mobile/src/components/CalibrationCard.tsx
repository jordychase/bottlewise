import { Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "@/theme/tokens";
import { Chip } from "./Chip";
import type { CalibrationEntry } from "@/data/calibration";
import type { PrepMethod } from "@/state/baby-profile";

const PREP_LABEL: Record<PrepMethod, string> = {
  hand: "Hand-measure",
  baby_brezza: "Baby Brezza Formula Pro",
  tommee_tippee: "Tommee Tippee Perfect Prep",
  dr_browns: "Dr. Brown's Insta-Feed",
  other: "Other dispenser",
};

interface Props {
  prepMethod: PrepMethod;
  entry?: CalibrationEntry;
  /** If true, we have a prep method but no calibration entry — render a
   *  "we don't have a setting for this combo" state. */
  noEntry?: boolean;
}

export function CalibrationCard({ prepMethod, entry, noEntry }: Props) {
  if (prepMethod === "hand") {
    return (
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
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 11,
            color: colors.ink2,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          Preparing this formula
        </Text>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, lineHeight: 22 }}>
          Hand-measure using the included scoop.
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
          Follow the ratio printed on the tin — typically one level scoop per two ounces of water. Watch baby's stool, weight, and feeding cues; adjust with your pediatrician.
        </Text>
      </View>
    );
  }

  if (noEntry || !entry) {
    return (
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
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 11,
            color: colors.ink2,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {PREP_LABEL[prepMethod]} setting
        </Text>
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, lineHeight: 22 }}>
          No published setting for this combination yet.
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
          When a Bottlewise parent verifies a working setting, it shows up here. Until then, hand-measure using the ratio on the tin and watch baby's cues.
        </Text>
      </View>
    );
  }

  const notRecommended = entry.settingLabel === "Not recommended";

  return (
    <View
      style={{
        backgroundColor: colors.paper,
        borderColor: notRecommended ? colors.danger : colors.mist,
        borderWidth: notRecommended ? 2 : 1,
        borderRadius: radii.r4,
        padding: spacing.s5,
        gap: spacing.s3,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 11,
            color: notRecommended ? colors.dangerInk : colors.ink2,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {PREP_LABEL[prepMethod]} setting
        </Text>
        {entry.verifiedByUserCount > 0 && (
          <Chip tone="success" dot>
            {`Verified by ${entry.verifiedByUserCount}`}
          </Chip>
        )}
      </View>

      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 22,
          lineHeight: 26,
          color: notRecommended ? colors.dangerInk : colors.ink,
          letterSpacing: -0.4,
        }}
      >
        {entry.settingLabel}
      </Text>

      {!notRecommended && (
        <View style={{ gap: 6 }}>
          <Row label="Scoop" value={entry.scoopType} />
          <Row label="Ratio" value={entry.waterToPowderRatio} />
        </View>
      )}

      {entry.notes && (
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink2, lineHeight: 19 }}>
          {entry.notes}
        </Text>
      )}

      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 11,
          color: colors.ink2,
          lineHeight: 16,
          marginTop: 4,
        }}
      >
        Manufacturer setting — observe your baby's stool, weight, and feeding cues and adjust with your pediatrician if needed.
      </Text>
    </View>
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
          width: 56,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
      <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 20 }}>
        {value}
      </Text>
    </View>
  );
}
