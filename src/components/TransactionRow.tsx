import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import type { Transaction } from "../types";
import { formatIDR } from "../utils/currency";

interface TransactionRowProps {
  transaction: Transaction;
  /** Ditampilkan kalau row ini muncul di History gabungan (bukan di dalam detail goal) */
  goalName?: string;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TransactionRow({ transaction, goalName }: TransactionRowProps) {
  const { colors, typography } = useTheme();
  const isDeposit = transaction.type === "deposit";
  const color = isDeposit ? colors.deposit : colors.withdraw;
  const sign = isDeposit ? "+" : "-";
  const icon = isDeposit ? "↓" : "↑";
  const styles = useMemo(
    () => createStyles(colors, typography),
    [colors, typography],
  );

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: color + "26" }]}>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>
          {isDeposit ? "Menabung" : "Menarik tabungan"}
        </Text>
        {goalName ? <Text style={styles.goalName}>{goalName}</Text> : null}
        {transaction.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {transaction.note}
          </Text>
        ) : null}
        <Text style={styles.date}>{formatDate(transaction.createdAt)}</Text>
      </View>
      <Text style={[styles.amount, { color }]}>
        {sign} {formatIDR(transaction.amount)}
      </Text>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {
      fontSize: 18,
      fontWeight: "700",
    },
    info: {
      flex: 1,
      marginLeft: spacing.md,
    },
    title: {
      ...typography.body,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    goalName: {
      ...typography.caption,
      marginTop: 1,
    },
    note: {
      ...typography.caption,
      marginTop: 1,
    },
    date: {
      ...typography.caption,
      marginTop: 2,
    },
    amount: {
      ...typography.body,
      fontWeight: "700",
    },
  });
}
