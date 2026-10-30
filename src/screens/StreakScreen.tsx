import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { space, type as typeTokens, size, radius } from '../theme';
import { WeekStrip, WeekDayStatus } from '../components/WeekStrip';
import { StreakHeatmap } from '../components/StreakHeatmap';
import {
  getCurrentStreak,
  getLongestStreak,
  getMonthlyDaysRead,
  getBooksFinishedThisYear,
  getStreakDays,
  getTodayMinutes,
  getSetting,
  StreakDay,
} from '../db/sessions';

export function StreakScreen() {
  const { colors } = useTheme();

  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [daysThisMonth, setDaysThisMonth] = useState(0);
  const [booksFinishedYear, setBooksFinishedYear] = useState(0);
  const [streakDays, setStreakDays] = useState<StreakDay[]>([]);
  const [goalMinutes, setGoalMinutes] = useState(60);
  const [weekDays, setWeekDays] = useState<WeekDayStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const cur = await getCurrentStreak();
      const longest = await getLongestStreak();
      const monthDays = await getMonthlyDaysRead();
      const booksYear = await getBooksFinishedThisYear();
      const sDays = await getStreakDays(14);
      const todayM = await getTodayMinutes();

      const goalVal = await getSetting('dailyGoalMinutes');
      const goal = goalVal ? parseFloat(goalVal) : 60;

      const minEngagedVal = await getSetting('minEngagedMinutes');
      const minEngaged = minEngagedVal ? parseFloat(minEngagedVal) : 10;

      setCurrentStreak(cur);
      setLongestStreak(longest);
      setDaysThisMonth(monthDays);
      setBooksFinishedYear(booksYear);
      setStreakDays(sDays);
      setGoalMinutes(goal);

      // Build WeekStrip
      const now = new Date();
      const currentDayOfWeek = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - currentDayOfWeek);
      monday.setHours(0, 0, 0, 0);

      const dayMinutesMap = new Map<string, number>();
      sDays.forEach((sd) => dayMinutesMap.set(sd.date, sd.totalMinutes));

      const initials = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      const weekList: WeekDayStatus[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const mins = dayMinutesMap.get(iso) ?? (iso === now.toISOString().slice(0, 10) ? todayM : 0);

        let status: WeekDayStatus['status'] = 'future';
        if (i < currentDayOfWeek) {
          status = mins >= minEngaged ? 'read' : 'missed';
        } else if (i === currentDayOfWeek) {
          status = mins >= minEngaged ? 'read' : 'today_unread';
        } else {
          status = 'future';
        }

        weekList.push({
          date: iso,
          initial: initials[i],
          status,
          minutesRead: mins,
        });
      }

      setWeekDays(weekList);
    } catch (e) {
      console.error('Error loading Streak screen:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Screen Title */}
        <Text style={[typeTokens.display, styles.title, { color: colors.ink }]}>
          Streak
        </Text>

        {/* Streak Count in Numerals */}
        <View style={styles.streakCountContainer}>
          <Text style={[typeTokens.numerals, { color: colors.ink }]}>
            {currentStreak}
          </Text>
          <Text style={[typeTokens.caption, { color: colors.ink, marginTop: space.xs }]}>
            day streak
          </Text>
          <Text style={[typeTokens.caption, { color: colors.muted, marginTop: 2 }]}>
            Longest {longestStreak} days
          </Text>
        </View>

        {/* Week Strip */}
        <View style={styles.section}>
          <Text style={[typeTokens.eyebrow, styles.sectionEyebrow, { color: colors.muted }]}>
            This week
          </Text>
          <WeekStrip days={weekDays} />
        </View>

        {/* Heatmap */}
        <View style={styles.section}>
          <Text style={[typeTokens.eyebrow, styles.sectionEyebrow, { color: colors.muted }]}>
            Activity
          </Text>
          <StreakHeatmap streakDays={streakDays} goalMinutes={goalMinutes} weeksToShow={12} />
        </View>

        {/* Three Stat Rows */}
        <View style={styles.statsContainer}>
          <View style={[styles.statRow, { borderColor: colors.hairline, backgroundColor: colors.surface }]}>
            <Text style={[typeTokens.caption, { color: colors.muted }]}>Longest streak</Text>
            <Text style={[typeTokens.headline, { color: colors.ink }]}>{longestStreak} days</Text>
          </View>

          <View style={[styles.statRow, { borderColor: colors.hairline, backgroundColor: colors.surface }]}>
            <Text style={[typeTokens.caption, { color: colors.muted }]}>Days read this month</Text>
            <Text style={[typeTokens.headline, { color: colors.ink }]}>{daysThisMonth} days</Text>
          </View>

          <View style={[styles.statRow, { borderColor: colors.hairline, backgroundColor: colors.surface }]}>
            <Text style={[typeTokens.caption, { color: colors.muted }]}>Books finished this year</Text>
            <Text style={[typeTokens.headline, { color: colors.ink }]}>{booksFinishedYear} books</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: space.xl,
    paddingBottom: space.xxxl,
    maxWidth: size.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    paddingHorizontal: space.gutter,
    marginBottom: space.lg,
  },
  streakCountContainer: {
    alignItems: 'center',
    marginBottom: space.xxl,
  },
  section: {
    marginBottom: space.xxl,
  },
  sectionEyebrow: {
    paddingHorizontal: space.gutter,
    marginBottom: space.md,
  },
  statsContainer: {
    paddingHorizontal: space.gutter,
    gap: space.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
});
