import { Tabs, usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fab } from "../../src/components/Fab";
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN, FloatingTabBar } from "../../src/components/FloatingTabBar";
import { UndoSnackbar } from "../../src/components/UndoSnackbar";
import { spacing } from "../../src/theme/colors";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const bottomOffset = insets.bottom + FLOATING_TAB_BAR_MARGIN + FLOATING_TAB_BAR_HEIGHT + spacing.sm;

  // FAB berubah tujuan/label tergantung tab aktif — Today nambah habit
  // (todo baru dibikin inline langsung di Today screen, gak butuh FAB),
  // Goals nambah goal, History gak ada aksi tambah yang masuk akal jadi FAB
  // disembunyikan di situ.
  let fabConfig: { onPress: () => void; label: string } | null = null;
  if (pathname === "/" || pathname === "/index") {
    fabConfig = { onPress: () => router.push("/habit/add"), label: "Tambah habit baru" };
  } else if (pathname === "/goals") {
    fabConfig = { onPress: () => router.push("/goal/add"), label: "Tambah goal tabungan baru" };
  }

  return (
    <>
      <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: "Today" }} />
        <Tabs.Screen name="goals" options={{ title: "Goals" }} />
        <Tabs.Screen name="history" options={{ title: "History" }} />
      </Tabs>
      <UndoSnackbar bottomOffset={bottomOffset} />
      {fabConfig && (
        <Fab
          onPress={fabConfig.onPress}
          accessibilityLabel={fabConfig.label}
          bottomOffset={bottomOffset}
        />
      )}
    </>
  );
}