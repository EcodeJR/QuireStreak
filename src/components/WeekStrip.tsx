import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { space, type as typeTokens } from '../theme';

export interface WeekDayStatus {
  date: string; // YYYY-MM-DD
  initial: string; // M, T, W, T, F, S, S
  status: 'read' | 'missed' | 'today_unread' | 'future';
  minutesRead: number;
}

interface WeekStripProps {
  days: WeekDayStatus[];
  style?: ViewStyle;
}

export function WeekStrip({ days, style }: WeekStripProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {days.map((d, index) => {
        const isRead = d.status === 'read';
        const isMissed = d.status === 'missed';
        const isTodayUnread = d.status === 'today_unread';
        const isFuture = d.status === 'future';

        return (
          <View
            key={d.date || index}
            style={styles.dayCol}
            accessibilityLabel={`${d.date}: ${
              isRead ? `${Math.round(d.minutesRead)} minutes read, completed`
              : isMissed ? 'missed'
              : isTodayUnread ? 'today, not yet completed'
              : 'future day'
            }`}
          >
            <Text style={[typeTokens.caption, styles.initial, { color: colors.muted }]}>
              {d.initial}
            </Text>

            <View
              style={[
                styles.circle,
                isRead && {
                  backgroundColor: colors.ink,
                  borderColor: colors.ink,
                },
                isMissed && {
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderStyle: 'dashed',
                  backgroundColor: 'transparent',
                },
                isTodayUnread && {
                  borderWidth: 2,
                  borderColor: colors.accent,
                  backgroundColor: 'transparent',
                },
                isFuture && {
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  backgroundColor: 'transparent',
                },
              ]}
            >
              {isRead && (
                <Text style={[styles.checkText, { color: colors.paper }]}>✓</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.gutter,
    width: '100%',
  },
  dayCol: {
    alignItems: 'center',
  },
  initial: {
    marginBottom: space.xs,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
