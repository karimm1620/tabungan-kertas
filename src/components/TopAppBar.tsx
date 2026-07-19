import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../theme/colors";
import { m3ElevationStyle } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";

interface TopAppBarAction {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
}

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  actions?: TopAppBarAction[];
  elevated?: boolean;
}

export function TopAppBar({ title, onBack, actions = [], elevated = false }: TopAppBarProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === "android";

  return (
    <View
      style={[
        styles.bar,
        isAndroid && elevated ? m3ElevationStyle("level2") : null,
        { backgroundColor: colors.surface, paddingTop: insets.top, justifyContent: isAndroid ? "flex-start" : "center" },
      ]}
    >
      {onBack && (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          android_ripple={{ color: colors.glassBorder, borderless: true, radius: 20 }}
          style={styles.iconButton}
        >
          <Text style={{ fontSize: 20, color: colors.textPrimary }}>‹</Text>
        </Pressable>
      )}

      <Text style={[typography.title, styles.title, !isAndroid && styles.titleCentered]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable
            key={action.accessibilityLabel}
            onPress={action.onPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            android_ripple={{ color: colors.glassBorder, borderless: true, radius: 20 }}
            style={styles.iconButton}
          >
            <Text style={{ fontSize: 18 }}>{action.icon}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", minHeight: 56, paddingHorizontal: spacing.sm },
  title: { flex: 1, marginLeft: spacing.sm },
  titleCentered: { textAlign: "center", marginLeft: 0 },
  actions: { flexDirection: "row", alignItems: "center" },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
});