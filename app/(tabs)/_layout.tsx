import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MARGIN,
  FloatingTabBar,
} from "../../src/components/FloatingTabBar";
import { UndoSnackbar } from "../../src/components/UndoSnackbar";
import { spacing } from "../../src/theme/colors";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: "Goals" }} />
        <Tabs.Screen name="history" options={{ title: "History" }} />
      </Tabs>

      <UndoSnackbar
        bottomOffset={
          insets.bottom +
          FLOATING_TAB_BAR_MARGIN +
          FLOATING_TAB_BAR_HEIGHT +
          spacing.sm
        }
      />
    </>
  );
}
