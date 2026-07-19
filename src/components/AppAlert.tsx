import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AppAlertButton } from "../hooks/useAppAlert";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { accentByKey, radius, spacing } from "../theme/colors";
import { m3Motion, m3Shape } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";

interface AppAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  onClose: () => void;
}

export function AppAlert({
  visible,
  title,
  message,
  buttons,
  onClose,
}: AppAlertProps) {
  const { colors, typography, material3 } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (reducedMotion) {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (Platform.OS === "android") {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: m3Motion.duration.short4,
            easing: Easing.bezier(...m3Motion.easing.standardDecelerate),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: m3Motion.duration.short4,
            easing: Easing.bezier(...m3Motion.easing.emphasizedDecelerate),
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            damping: 16,
            stiffness: 220,
            mass: 0.7,
          }),
        ]).start();
      }
    } else {
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible, reducedMotion, opacity, scale]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: colors.overlayScrim,
        },
        centerWrap: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.xl,
        },
        card: {
          width: "100%",
          maxWidth: 340,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
        title: {
          ...typography.subtitle,
          textAlign: "center",
        },
        message: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.sm,
        },
        buttonRow: {
          flexDirection: "row",
          gap: spacing.sm,
          marginTop: spacing.lg,
        },
        button: {
          flex: 1,
          borderRadius: Platform.OS === "android" ? m3Shape.full : radius.md,
          paddingVertical: spacing.md,
          alignItems: "center",
          backgroundColor: colors.surfaceMuted,
          overflow: "hidden",
        },
        buttonDefault: {
          backgroundColor:
            Platform.OS === "android"
              ? (material3?.primary ?? accentByKey.lavender.deep)
              : accentByKey.lavender.deep,
        },
        buttonDestructive: {
          backgroundColor: colors.danger,
        },
        buttonTextGhost: {
          ...typography.subtitle,
          color: colors.textPrimary,
        },
        buttonTextSolid: {
          ...typography.subtitle,
          color: "#FFFFFF",
        },
      }),
    [colors, typography, material3],
  );

  const handlePress = (button: AppAlertButton) => {
    onClose();
    button.onPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[styles.card, { transform: [{ scale }], opacity }]}
        >
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.buttonRow}>
            {buttons.map((btn, index) => {
              const isDestructive = btn.style === "destructive";
              const isCancel =
                btn.style === "cancel" ||
                (!btn.style && buttons.length > 1 && index === 0);
              const isDefault = !isDestructive && !isCancel;

              return (
                <Pressable
                  key={index}
                  onPress={() => handlePress(btn)}
                  style={[
                    styles.button,
                    isDestructive && styles.buttonDestructive,
                    isDefault && styles.buttonDefault,
                  ]}
                  android_ripple={{
                    color:
                      isDestructive || isDefault
                        ? "rgba(255,255,255,0.24)"
                        : colors.glassBorder,
                  }}
                >
                  <Text
                    style={
                      isDestructive || isDefault
                        ? styles.buttonTextSolid
                        : styles.buttonTextGhost
                    }
                  >
                    {btn.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}