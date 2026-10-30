import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { heat, radius, size, space, type as typeTokens } from '../theme';
import type { StreakDay } from '../db/sessions';

interface StreakHeatmapProps {
  streakDays: StreakDay[];
  goalMinutes?: number;
  weeksToShow?: number; // default 12
  style?: ViewStyle;
}

interface CellData {
  date: string; // YYYY-MM-DD
  minutesRead: number;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  monthName: string;
}

export function StreakHeatmap({
  streakDays,
  goalMinutes = 60,
  weeksToShow = 12,
  style,
}: StreakHeatmapProps) {
  const { colors, scheme } = useTheme();
  const [selectedCell, setSelectedCell] = useState<CellData | null>(null);

  const heatPalette = heat[scheme];

  // Map input streakDays by date YYYY-MM-DD
  const minutesByDate = new Map<string, number>();
  streakDays.forEach((sd) => {
    minutesByDate.set(sd.date, sd.totalMinutes);
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  // Compute weeks ending on this Sunday (or end of current week)
  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // 0 for Monday ... 6 for Sunday

  // Find start date: (weeksToShow - 1) full weeks ago from this week's Monday
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - currentDayOfWeek);
  thisMonday.setHours(0, 0, 0, 0);

  const startDate = new Date(thisMonday);
  startDate.setDate(thisMonday.getDate() - (weeksToShow - 1) * 7);

  // Build grid: columns of weeks (each 7 days Mon-Sun)
  const columns: { monthLabel?: string; days: CellData[] }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let lastMonth = -1;

  for (let w = 0; w < weeksToShow; w++) {
    const weekDays: CellData[] = [];
    let weekMonthName = '';

    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + w * 7 + d);

      const dateStr = cellDate.toISOString().slice(0, 10);
      const isToday = dateStr === todayStr;
      const minutesRead = minutesByDate.get(dateStr) ?? 0;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (minutesRead > 0) {
        const pct = minutesRead / goalMinutes;
        if (pct >= 1) level = 4;
        else if (pct >= 0.5) level = 3;
        else if (pct >= 0.25) level = 2;
        else level = 1;
      }

      const mIdx = cellDate.getMonth();
      if (d === 0 && mIdx !== lastMonth) {
        weekMonthName = monthNames[mIdx];
        lastMonth = mIdx;
      }

      weekDays.push({
        date: dateStr,
        minutesRead,
        level,
        isToday,
        dayOfWeek: d,
        monthName: monthNames[mIdx],
      });
    }

    columns.push({
      monthLabel: weekMonthName,
      days: weekDays,
    });
  }

  const handleCellPress = (cell: CellData) => {
    if (selectedCell?.date === cell.date) {
      setSelectedCell(null);
    } else {
      setSelectedCell(cell);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Tap callout details */}
      {selectedCell ? (
        <View style={[styles.callout, { backgroundColor: colors.sunken, borderColor: colors.hairline }]}>
          <Text style={[typeTokens.caption, { color: colors.ink }]}>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{selectedCell.date}: </Text>
            {selectedCell.minutesRead > 0
              ? `${Math.round(selectedCell.minutesRead)} minutes read`
              : 'No reading recorded'}
          </Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.gridWrapper}>
          {/* Month names row */}
          <View style={styles.monthsRow}>
            {columns.map((col, cIdx) => (
              <View key={`m-${cIdx}`} style={{ width: size.heatCell + size.heatGap }}>
                {col.monthLabel ? (
                  <Text style={[typeTokens.caption, styles.monthLabel, { color: colors.muted }]}>
                    {col.monthLabel}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* 7 rows x weeks columns */}
          <View style={styles.columnsContainer}>
            {columns.map((col, colIdx) => (
              <View key={`col-${colIdx}`} style={styles.column}>
                {col.days.map((cell) => {
                  const cellColor = heatPalette[cell.level];
                  return (
                    <Pressable
                      key={cell.date}
                      onPress={() => handleCellPress(cell)}
                      accessibilityRole="button"
                      accessibilityLabel={`${cell.date}, ${Math.round(cell.minutesRead)} minutes read`}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: cellColor,
                          borderColor: cell.isToday ? colors.ink : 'transparent',
                          borderWidth: cell.isToday ? 1.5 : 0,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  callout: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: space.sm,
    alignSelf: 'flex-start',
    marginHorizontal: space.gutter,
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    paddingBottom: space.xs,
  },
  gridWrapper: {
    flexDirection: 'column',
  },
  monthsRow: {
    flexDirection: 'row',
    height: 18,
    marginBottom: space.xs,
  },
  monthLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: size.heatGap,
  },
  column: {
    flexDirection: 'column',
    gap: size.heatGap,
  },
  cell: {
    width: size.heatCell,
    height: size.heatCell,
    borderRadius: size.heatRadius,
  },
});
