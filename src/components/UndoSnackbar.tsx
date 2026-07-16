import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { UNDO_WINDOW_MS, useGoalsStore } from "../store/useGoalsStore";
import { spacing, withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { GlassCard } from "./GlassCard";

export function UndoSnackbar({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const { colors, typography } = useTheme();
  const pendingDeletion = useGoalsStore((s) => s.pendingDeletion);
  const undoDelete = useGoalsStore((s) => s.undoDelete);
  const commitPendingDeletion = useGoalsStore((s) => s.commitPendingDeletion);

  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(120)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pendingDeletion) {
      setMounted(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
      }).start();

      const elapsed = Date.now() - pendingDeletion.deletedAt;
      const remaining = Math.max(0, UNDO_WINDOW_MS - elapsed);
      timerRef.current = setTimeout(() => {
        commitPendingDeletion();
      }, remaining);
    } else if (mounted) {
      Animated.timing(translateY, {
        toValue: 120,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingDeletion, commitPendingDeletion, mounted, translateY]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: "absolute",
          left: spacing.lg,
          right: spacing.lg,
          bottom: spacing.md + bottomOffset,
        },
        card: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        text: {
          ...typography.body,
          flex: 1,
          marginRight: spacing.md,
        },
        undoText: {
          ...typography.subtitle,
          color: colors.deposit,
        },
      }),
    [colors, typography, bottomOffset],
  );

  if (!mounted) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View style={{ transform: [{ translateY }] }}>
        <GlassCard
          tintColor={withOpacity(colors.surface, 0.94)}
          style={styles.card}
        >
          <Text style={styles.text} numberOfLines={1}>
            {pendingDeletion?.goal.name} dihapus
          </Text>
          <Pressable
            onPress={undoDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Batalkan penghapusan goal"
          >
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        </GlassCard>
      </Animated.View>
    </View>
  );
}
