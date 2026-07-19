import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fab } from "../../src/components/Fab";
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN, FloatingTabBar } from "../../src/components/FloatingTabBar";
import { UndoSnackbar } from "../../src/components/UndoSnackbar";
import { spacing } from "../../src/theme/colors";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomOffset = insets.bottom + FLOATING_TAB_BAR_MARGIN + FLOATING_TAB_BAR_HEIGHT + spacing.sm;

  return (
    <>
      <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: "Goals" }} />
        <Tabs.Screen name="history" options={{ title: "History" }} />
      </Tabs>
      <UndoSnackbar bottomOffset={bottomOffset} />
      <Fab onPress={() => router.push("/goal/add")} accessibilityLabel="Tambah goal tabungan baru" bottomOffset={bottomOffset} />
    </>
  );
}