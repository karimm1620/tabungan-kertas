import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text } from "react-native";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { spacing } from "../theme/colors";
import { m3ElevationStyle, m3Motion, m3Shape } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";

interface CelebrationOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

const VISIBLE_DURATION_MS = 1800;

/**
 * Muncul SEKALI pas transisi ke "semua item hari ini selesai" (dipicu dari
 * Today screen, bukan komponen ini sendiri yang nentuin kapan tampil —
 * lihat `prevAllDoneRef` pattern di `app/(tabs)/index.tsx`). "Earned, not
 * cheesy": satu card kecil, haptic sukses, auto-dismiss ~1.8 detik. Gak ada
 * confetti/particle system.
 */
export function CelebrationOverlay({
  visible,
  onDismiss,
}: CelebrationOverlayProps) {
  const { typography, material3 } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: "absolute",
          top: spacing.xl,
          left: spacing.lg,
          right: spacing.lg,
          alignItems: "center",
        },
        card: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: m3Shape.extraLarge,
          backgroundColor: material3.primaryContainer,
          ...m3ElevationStyle("level2"),
        },
        text: {
          ...typography.subtitle,
          color: material3.onPrimaryContainer,
        },
      }),
    [typography, material3],
  );

  useEffect(() => {
    if (!visible) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );

    const inDuration = reducedMotion ? 1 : m3Motion.duration.medium2;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: inDuration,
        easing: Easing.bezier(...m3Motion.easing.emphasizedDecelerate),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: inDuration,
        easing: Easing.bezier(...m3Motion.easing.emphasizedDecelerate),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: reducedMotion ? 1 : m3Motion.duration.short4,
        useNativeDriver: true,
      }).start(() => {
        scale.setValue(0.85);
        onDismiss();
      });
    }, VISIBLE_DURATION_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={styles.wrapper}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={[styles.card, { opacity, transform: [{ scale }] }]}
      >
        <Text style={{ fontSize: 20 }}>✓</Text>
        <Text style={styles.text}>Semua beres hari ini</Text>
      </Animated.View>
    </Animated.View>
  );
}
