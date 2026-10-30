import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { space, type as typeTokens, size, radius } from '../theme';
import { ProgressArc } from '../components/ProgressArc';
import { PrimaryButton } from '../components/Buttons';
import { WeekStrip, WeekDayStatus } from '../components/WeekStrip';
import { BookCover } from '../components/BookCover';
import { getStacks, type Stack } from '../db/stacks';
import { getActiveBook, getBooksForStack, getReadingPosition, type Book } from '../db/books';
import { getTodayMinutes, getSetting, getStreakDays } from '../db/sessions';

interface UpNextItem {
  stack: Stack;
  activeBook: Book;
  percentRead: number;
  estimatedFinishDate: string;
}

export function TodayScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [todayMinutes, setTodayMinutes] = useState(0);
  const [goalMinutes, setGoalMinutes] = useState(60);
  const [minEngagedMinutes, setMinEngagedMinutes] = useState(10);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [upNextItems, setUpNextItems] = useState<UpNextItem[]>([]);
  const [weekDays, setWeekDays] = useState<WeekDayStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const todayM = await getTodayMinutes();
      setTodayMinutes(todayM);

      const goalVal = await getSetting('dailyGoalMinutes');
      const goal = goalVal ? parseFloat(goalVal) : 60;
      setGoalMinutes(goal);

      const minEngagedVal = await getSetting('minEngagedMinutes');
      const minEngaged = minEngagedVal ? parseFloat(minEngagedVal) : 10;
      setMinEngagedMinutes(minEngaged);

      const stacks = await getStacks();
      const activeStacks = stacks.filter((s) => s.isActive);

      let currentActive: Book | null = null;
      const nextItems: UpNextItem[] = [];

      for (const st of activeStacks) {
        const book = await getActiveBook(st.id);
        if (book) {
          if (!currentActive) {
            currentActive = book;
          }
          const pos = await getReadingPosition(book.id);
          const pct = pos?.percentRead ?? 0;

          // Estimate finish date: based on remaining percent and daily goal
          // If 100 pages / 60 mins: approx pace = 1 page / min or ~5% per day
          const remainingPct = 1 - pct;
          const daysNeeded = Math.max(1, Math.ceil(remainingPct / 0.1)); // ~10 days for full book
          const finishDate = new Date();
          finishDate.setDate(finishDate.getDate() + daysNeeded);
          const dateStr = finishDate.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
          });

          nextItems.push({
            stack: st,
            activeBook: book,
            percentRead: pct,
            estimatedFinishDate: `Finish around ${dateStr}`,
          });
        }
      }

      setActiveBook(currentActive);
      setUpNextItems(nextItems);

      // Build week strip for current week (Mon-Sun)
      const now = new Date();
      const currentDayOfWeek = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
      const monday = new Date(now);
      monday.setDate(now.getDate() - currentDayOfWeek);
      monday.setHours(0, 0, 0, 0);

      const streakDays = await getStreakDays(2);
      const dayMinutesMap = new Map<string, number>();
      streakDays.forEach((sd) => dayMinutesMap.set(sd.date, sd.totalMinutes));

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
      console.error('Error loading Today data:', e);
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

  const handleKeepReading = () => {
    if (activeBook) {
      navigation.navigate('Reader', { bookId: activeBook.id });
    } else {
      navigation.navigate('Library');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Screen title */}
        <Text style={[typeTokens.display, styles.title, { color: colors.ink }]}>
          Today
        </Text>

        {/* Block 1: Progress Arc */}
        <View style={styles.section}>
          <ProgressArc minutesRead={todayMinutes} goalMinutes={goalMinutes} />
        </View>

        {/* Primary CTA button */}
        <View style={styles.section}>
          <PrimaryButton
            label={activeBook ? 'Keep reading' : 'Start reading'}
            subtitle={activeBook ? activeBook.title : 'Choose a book from your library'}
            onPress={handleKeepReading}
          />
        </View>

        {/* Block 2: Up Next */}
        {upNextItems.length > 0 && (
          <View style={styles.section}>
            <Text style={[typeTokens.eyebrow, styles.sectionHeader, { color: colors.muted }]}>
              Up next
            </Text>
            {upNextItems.map((item) => (
              <TouchableOpacity
                key={item.activeBook.id}
                style={[
                  styles.upNextRow,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Reader', { bookId: item.activeBook.id })}
                accessibilityRole="button"
                accessibilityLabel={`${item.activeBook.title}, ${item.stack.name} stack, ${item.estimatedFinishDate}`}
              >
                <BookCover
                  coverPath={item.activeBook.coverPath}
                  title={item.activeBook.title}
                  author={item.activeBook.author}
                  variant="stack"
                />
                <View style={styles.upNextInfo}>
                  <Text style={[typeTokens.headline, { color: colors.ink }]} numberOfLines={1}>
                    {item.activeBook.title}
                  </Text>
                  <Text style={[typeTokens.caption, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>
                    {item.stack.name} • {item.estimatedFinishDate}
                  </Text>
                </View>
                <Text style={[{ color: colors.muted, fontSize: 18 }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Block 3: Week Strip */}
        <View style={styles.section}>
          <Text style={[typeTokens.eyebrow, styles.sectionHeader, { color: colors.muted }]}>
            This week
          </Text>
          <WeekStrip days={weekDays} />
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
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.xxxl,
    maxWidth: size.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginBottom: space.xxl,
  },
  section: {
    marginBottom: space.xxl,
  },
  sectionHeader: {
    marginBottom: space.md,
  },
  upNextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: space.sm,
  },
  upNextInfo: {
    flex: 1,
    marginLeft: space.md,
    justifyContent: 'center',
  },
});
