import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { initDatabase } from "../src/db/client";
import { migrateFromAsyncStorageIfNeeded } from "../src/db/legacyMigration";
import { useReducedMotion } from "../src/hooks/useReducedMotion";
import { useGoalsStore } from "../src/store/useGoalsStore";
import { useHabitsStore } from "../src/store/useHabitsStore";
import { useSettingsStore } from "../src/store/useSettingsStore";
import { useTodosStore } from "../src/store/useTodosStore";
import { useTheme } from "../src/theme/useTheme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RootLayoutContent />
    </ErrorBoundary>
  );
}

function RootLayoutContent() {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const [bootError, setBootError] = useState<unknown>(null);

  const goalsHydrated = useGoalsStore((state) => state.hasHydrated);
  const hydrateGoals = useGoalsStore((state) => state.hydrate);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const habitsHydrated = useHabitsStore((state) => state.hasHydrated);
  const hydrateHabits = useHabitsStore((state) => state.hydrate);
  const todosHydrated = useTodosStore((state) => state.hasHydrated);
  const hydrateTodos = useTodosStore((state) => state.hydrate);

  const ready =
    goalsHydrated && settingsHydrated && habitsHydrated && todosHydrated;

  // Urutan WAJIB: tabel harus ada dulu (initDatabase) sebelum migrasi baca-
  // tulis ke tabel itu, dan migrasi harus selesai dulu sebelum hydrate baca
  // data final (kalau ada data lama yang perlu dipindah).
  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await migrateFromAsyncStorageIfNeeded();
        await Promise.all([
          hydrateGoals(),
          hydrateSettings(),
          hydrateHabits(),
          hydrateTodos(),
        ]);
      } catch (error) {
        setBootError(error);
      }
    })();
  }, [hydrateGoals, hydrateSettings, hydrateHabits, hydrateTodos]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  // Dilempar pas render (bukan cuma di-log) — supaya ErrorBoundary di
  // `RootLayout` (parent component ini) yang nangkep. Bootstrap DB gagal
  // itu fatal, gak masuk akal nerusin app tanpa data ke-load.
  if (bootError) {
    throw bootError;
  }

  if (!ready) {
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
              // Reduce Motion aktif -> gak ada transisi geser sama sekali.
              // Kalau enggak: masuk dari bawah (full-screen dialog M3).
              animation: reducedMotion ? "none" : "slide_from_bottom",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}