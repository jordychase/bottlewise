import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Newsreader_400Regular,
  Newsreader_600SemiBold,
} from "@expo-google-fonts/newsreader";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import { View, Text } from "react-native";
import { colors } from "@/theme/tokens";
import { BabyProfileProvider } from "@/state/baby-profile";
import { StockProvider } from "@/state/stock";
import { FeedbackButton } from "@/components/FeedbackButton";

function RootLayoutInner() {
  const pathname = usePathname();
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.oat },
          animation: "fade",
        }}
      />
      <FeedbackButton currentRoute={pathname || "/"} />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.oat }}>
        <Text style={{ color: colors.ink2 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <BabyProfileProvider>
      <StockProvider>
        <RootLayoutInner />
      </StockProvider>
    </BabyProfileProvider>
  );
}
