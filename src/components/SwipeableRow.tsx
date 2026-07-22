import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "../theme/useTheme";

export type SwipeIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface SwipeAction {
  label: string;
  icon: SwipeIconName;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  /** Aksi cepat pas swipe KIRI (row digeser ke kiri, tombol muncul dari kanan) — 1 aksi utama. */
  quickAction?: SwipeAction;
  /** Menu lengkap pas swipe KANAN (row digeser ke kanan, menu muncul dari kiri) — bisa >1 aksi. */
  menuActions?: SwipeAction[];
}

const ACTION_WIDTH = 72;

/**
 * Wrapper swipe-to-reveal-actions buat row Habit/Todo. Pakai `Swipeable`
 * KLASIK dari react-native-gesture-handler (BUKAN `ReanimatedSwipeable`) —
 * SENGAJA, karena app ini gak pakai Reanimated sama sekali (dihapus dari
 * awal project, lihat PROJECT_CONTEXT.md). Classic `Swipeable` ditandai
 * `@deprecated` di type definition-nya (Reanimated versi direkomendasikan
 * untuk proyek baru), tapi masih fully-functional dan gak butuh dependency
 * tambahan — konsisten sama pola app ini yang udah lama pakai
 * `Animated`+`PanResponder` builtin buat semua gesture custom lain
 * (`useSheetMotion.ts`), bukan Reanimated.
 */
export function SwipeableRow({ children, quickAction, menuActions }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const closeAndRun = (action: SwipeAction) => {
    swipeableRef.current?.close();
    action.onPress();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      renderRightActions={
        quickAction
          ? () => <ActionButton action={quickAction} onPress={closeAndRun} />
          : undefined
      }
      renderLeftActions={
        menuActions && menuActions.length > 0
          ? () => (
              <View style={styles.leftActionsRow}>
                {menuActions.map((action) => (
                  <ActionButton key={action.label} action={action} onPress={closeAndRun} />
                ))}
              </View>
            )
          : undefined
      }
    >
      {children}
    </Swipeable>
  );
}

function ActionButton({
  action,
  onPress,
}: {
  action: SwipeAction;
  onPress: (action: SwipeAction) => void;
}) {
  const { typography } = useTheme();
  return (
    <Pressable
      onPress={() => onPress(action)}
      style={[styles.actionButton, { backgroundColor: action.color }]}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <MaterialCommunityIcons name={action.icon} size={20} color="#FFFFFF" />
      <Text style={[typography.caption, styles.actionLabel]}>{action.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  actionLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: 2,
  },
  leftActionsRow: {
    flexDirection: "row",
  },
});
