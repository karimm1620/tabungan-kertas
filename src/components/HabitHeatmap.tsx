import React, { useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import type { Habit } from "../types";
import { buildHeatmapWeeks } from "../utils/date";

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEKS_TO_SHOW = 30; // ~7 bulan histori, sesuai referensi (Mar-Jul di contoh)

interface HabitHeatmapProps {
  habit: Pick<Habit, "color">;
  completedDateKeys: ReadonlySet<string>;
}

/**
 * Grid GitHub-style: kolom = minggu (Senin di atas, Minggu di bawah),
 * kolom paling kanan = minggu ini. Cell terisi = `habit.color` penuh, cell
 * kosong (belum selesai ATAU emang gak due) = `colors.surfaceMuted` —
 * SENGAJA gak dibedain "gak due" vs "due tapi kelewat", biar heatmap-nya
 * gampang dibaca sekilas (nambah state ketiga bikin noise, bukan insight).
 * Cell di masa depan gak dirender sama sekali (transparan).
 *
 * Dibangun murni pakai View (gak ada dependency SVG/chart baru) — konsisten
 * sama filosofi app ini yang udah pakai `Animated`+View buat semua ilustrasi
 * custom (lihat JarProgress.tsx).
 */
export function HabitHeatmap({ habit, completedDateKeys }: HabitHeatmapProps) {
  const { colors, typography } = useTheme();
  const scrollRef = useRef<ScrollView>(null);

  const { weeks, monthLabelByWeekIndex } = useMemo(
    () => buildHeatmapWeeks(WEEKS_TO_SHOW),
    [],
  );

  useEffect(() => {
    // Auto-scroll ke minggu terbaru (kanan) pas mount — itu yang paling relevan.
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        monthLabel: {
          ...typography.caption,
          fontSize: 10,
          height: 14,
          color: colors.textSecondary,
        },
        column: {
          marginRight: CELL_GAP,
        },
        cell: {
          width: CELL_SIZE,
          height: CELL_SIZE,
          borderRadius: 3,
          marginBottom: CELL_GAP,
        },
      }),
    [typography, colors],
  );

  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", paddingRight: spacing.xs }}>
        {weeks.map((week, weekIndex) => (
          <View key={week[0].dateKey} style={styles.column}>
            <Text style={styles.monthLabel} numberOfLines={1}>
              {monthLabelByWeekIndex[weekIndex] ?? ""}
            </Text>
            {week.map((day) => (
              <View
                key={day.dateKey}
                style={[
                  styles.cell,
                  {
                    backgroundColor: day.isFuture
                      ? "transparent"
                      : completedDateKeys.has(day.dateKey)
                        ? habit.color
                        : colors.surfaceMuted,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
