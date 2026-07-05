import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useGoalsStore } from "../src/store/useGoalsStore";
import { useTheme } from "../src/theme/useTheme";

SplashScreen.preventAutoHideAsync().catch(() => {
  // no-op — kalau gagal (misal dipanggil dobel saat fast refresh), aman diabaikan
});

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const hasHydrated = useGoalsStore((state) => state.hasHydrated);

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [hasHydrated]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="goal/[id]"
            options={{
              headerShown: true,
              title: "",
              headerTransparent: true,
              headerTintColor: colors.textPrimary,
            }}
          />
          <Stack.Screen
            name="goal/add"
            options={{
              presentation: "modal",
              headerShown: true,
              title: "Goal Baru",
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.textPrimary,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
