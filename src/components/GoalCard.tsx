import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { getAccentColors, radius, spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import type { Goal } from "../types";
import { clampPercent, formatIDR } from "../utils/currency";
import { GlassCard } from "./GlassCard";
import { ProgressBar } from "./ProgressBar";

interface GoalCardProps {
  goal: Goal;
  onPress: () => void;
}

export function GoalCard({ goal, onPress }: GoalCardProps) {
  const { colors, typography } = useTheme();
  const accent = getAccentColors(goal.accent);
  const percent = clampPercent(goal.currentAmount, goal.targetAmount);
  const styles = useMemo(
    () => createStyles(colors, typography),
    [colors, typography],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <GlassCard style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: accent.base }]}>
            {goal.imageUri ? (
              <Image source={{ uri: goal.imageUri }} style={styles.image} />
            ) : (
              <Text style={styles.emoji}>{goal.emoji ?? "🎯"}</Text>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text style={styles.amount}>
              {formatIDR(goal.currentAmount)}{" "}
              <Text style={styles.amountTarget}>
                / {formatIDR(goal.targetAmount)}
              </Text>
            </Text>
            <View style={{ marginTop: spacing.sm }}>
              <ProgressBar percent={percent} accentColor={accent.deep} />
            </View>
          </View>

          <Text style={styles.percentLabel}>{Math.round(percent * 100)}%</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    card: {
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    emoji: {
      fontSize: 28,
    },
    info: {
      flex: 1,
      marginLeft: spacing.md,
      marginRight: spacing.sm,
    },
    name: {
      ...typography.subtitle,
    },
    amount: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: 2,
    },
    amountTarget: {
      color: colors.textSecondary,
    },
    percentLabel: {
      ...typography.label,
      textTransform: "none",
      color: colors.textSecondary,
    },
  });
}
