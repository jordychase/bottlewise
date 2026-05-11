import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ScreenFrame } from "@/components/ScreenFrame";
import { Button } from "@/components/Button";
import { Eyebrow } from "@/components/Eyebrow";
import { RadioCard } from "@/components/RadioCard";
import { Wordmark } from "@/components/Wordmark";
import { CurrentFormulaPanel } from "@/components/CurrentFormulaPanel";
import { RestockBanner } from "@/components/RestockBanner";
import { findFormulaById } from "@/data/formula-catalog";
import { useBabyProfile } from "@/state/baby-profile";
import { statusOf, useStock } from "@/state/stock";
import { colors, fonts, radii, spacing } from "@/theme/tokens";

export default function WelcomeScreen() {
  const { profile, update } = useBabyProfile();
  const stock = useStock();

  const current = profile.currentFormulaId ? findFormulaById(profile.currentFormulaId) : undefined;
  const watched =
    profile.watchForRestock && profile.previousFormulaId
      ? findFormulaById(profile.previousFormulaId)
      : undefined;
  const watchedStatus = profile.previousFormulaId
    ? statusOf(stock.status, profile.previousFormulaId)
    : undefined;
  const restockReady =
    profile.watchForRestock &&
    profile.previousFormulaId &&
    watchedStatus === "in_stock";

  const acceptSwitchBack = () => {
    if (!profile.previousFormulaId) return;
    update({
      currentFormulaId: profile.previousFormulaId,
      previousFormulaId: undefined,
      switchedAt: new Date().toISOString(),
      switchedDueTo: undefined,
      watchForRestock: false,
    });
  };

  const dismissRestock = () => {
    update({
      previousFormulaId: undefined,
      switchedDueTo: undefined,
      watchForRestock: false,
    });
  };

  return (
    <ScreenFrame>
      <View style={{ paddingTop: spacing.s6, gap: spacing.s3 }}>
        <Wordmark />
        {!current && (
          <>
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
          </>
        )}
      </View>

      {current && restockReady && watched && (
        <RestockBanner
          watchedFormula={watched}
          currentFormula={current}
          onSwitchBack={acceptSwitchBack}
          onStayWithCurrent={dismissRestock}
        />
      )}

      {current && (
        <CurrentFormulaPanel
          current={current}
          watched={watched}
          watchedStockStatus={watchedStatus}
          babyNameFirst={profile.babyNameFirst}
          onOpenCurrent={() => router.push(`/formula/${current.id}`)}
          onOpenWatched={watched ? () => router.push(`/formula/${watched.id}`) : undefined}
        />
      )}

      <View style={{ gap: spacing.s2, marginTop: current ? spacing.s4 : spacing.s6 }}>
        <Eyebrow>{current ? "What do you want to do?" : "Where are you starting?"}</Eyebrow>
        {!current && (
          <RadioCard
            title="New to formula"
            hint="Help me pick a first formula based on my baby's profile."
            onPress={() => router.push("/intake")}
          />
        )}
        <RadioCard
          title={current ? "Find an alternative" : "On formula, need help"}
          hint={
            current
              ? `If ${current.brandName} is out of stock or not working, see the closest matches.`
              : "Stock issue, tolerance issue, or trying to find something gentler."
          }
          onPress={() =>
            current
              ? router.push(`/formula/${current.id}/substitutes?reason=out_of_stock`)
              : router.push("/troubleshoot")
          }
        />
        {current && (
          <RadioCard
            title="Look up a different formula"
            hint="Search the catalog by brand, product, or 'WIC formula'."
            onPress={() => router.push("/troubleshoot")}
          />
        )}
      </View>

      {/* Demo controls — simulated stock events. Replaced by real
          stock_signals Realtime subscription in production. */}
      {profile.watchForRestock && profile.previousFormulaId && !restockReady && watched && (
        <Pressable
          onPress={() => stock.simulateRestock(profile.previousFormulaId!)}
          style={{
            backgroundColor: colors.honeySoft,
            borderRadius: radii.r3,
            paddingVertical: spacing.s3,
            paddingHorizontal: spacing.s4,
            alignItems: "center",
            borderColor: colors.honey,
            borderWidth: 1,
            borderStyle: "dashed" as const,
          }}
        >
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color: colors.honeyInk }}>
            Demo: simulate {watched.brandName} back in stock
          </Text>
        </Pressable>
      )}

      <View style={{ marginTop: current ? spacing.s2 : spacing.s6, alignItems: "center" }}>
        {!current && (
          <Button variant="primary" full onPress={() => router.push("/intake")}>
            Find my baby's match
          </Button>
        )}
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 12,
            color: colors.ink2,
            marginTop: current ? spacing.s2 : spacing.s4,
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
