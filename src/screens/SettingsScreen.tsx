import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { space, type as typeTokens, size, radius } from '../theme';
import { SecondaryButton, PrimaryButton } from '../components/Buttons';
import { getSetting, setSetting } from '../db/sessions';
import { getStacks } from '../db/stacks';
import { getActiveBook } from '../db/books';
import {
  scheduleReadingReminder,
  cancelAllReminders,
  addToCalendar,
  requestNotificationPermission,
} from '../lib/reminders';

export function SettingsScreen({ navigation }: any) {
  const { colors, scheme, setScheme } = useTheme();

  const [dailyGoal, setDailyGoal] = useState<number>(60);
  const [minEngaged, setMinEngaged] = useState<number>(10);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(false);
  const [reminderHour, setReminderHour] = useState<number>(20); // 8 PM
  const [reminderMinute, setReminderMinute] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const g = await getSetting('dailyGoalMinutes');
      if (g) setDailyGoal(Number(g));

      const m = await getSetting('minEngagedMinutes');
      if (m) setMinEngaged(Number(m));

      const r = await getSetting('remindersEnabled');
      if (r === 'true') setRemindersEnabled(true);

      const rh = await getSetting('reminderHour');
      if (rh) setReminderHour(Number(rh));
    }
    load();
  }, []);

  const handleGoalChange = async (minutes: number) => {
    setDailyGoal(minutes);
    await setSetting('dailyGoalMinutes', String(minutes));
  };

  const handleMinEngagedChange = async (minutes: number) => {
    setMinEngaged(minutes);
    await setSetting('minEngagedMinutes', String(minutes));
  };

  const handleToggleReminders = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Please enable notifications in system settings.');
        return;
      }

      // Schedule notification referencing current active book
      const stacks = await getStacks();
      const activeStack = stacks.find((s) => s.isActive) || stacks[0];
      const activeBook = activeStack ? await getActiveBook(activeStack.id) : null;

      await scheduleReadingReminder({
        bookTitle: activeBook?.title || 'your current book',
        stackName: activeStack?.name || 'Reading',
        hour: reminderHour,
        minute: reminderMinute,
        repeatDaily: true,
      });

      setRemindersEnabled(true);
      await setSetting('remindersEnabled', 'true');
      Alert.alert('Reminders Set', `Daily notification scheduled for ${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}.`);
    } else {
      await cancelAllReminders();
      setRemindersEnabled(false);
      await setSetting('remindersEnabled', 'false');
    }
  };

  const handleAddToCalendar = async () => {
    try {
      const stacks = await getStacks();
      const activeStack = stacks.find((s) => s.isActive) || stacks[0];
      const activeBook = activeStack ? await getActiveBook(activeStack.id) : null;

      const startDate = new Date();
      startDate.setHours(reminderHour, reminderMinute, 0, 0);
      if (startDate.getTime() <= Date.now()) {
        startDate.setDate(startDate.getDate() + 1);
      }

      const eventId = await addToCalendar({
        bookTitle: activeBook?.title || 'Book',
        stackName: activeStack?.name || 'Reading',
        startDate,
        durationMinutes: dailyGoal,
      });

      if (eventId) {
        Alert.alert('Calendar Event Created', 'Reading block added to your calendar.');
      } else {
        Alert.alert('Notice', 'Could not access or create event in calendar.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Calendar access failed.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Back"
        >
          <Text style={[styles.backArrow, { color: colors.ink }]}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[typeTokens.display, styles.title, { color: colors.ink }]}>
          Settings
        </Text>

        {/* Daily Reading Goal */}
        <View style={styles.section}>
          <Text style={[typeTokens.eyebrow, styles.sectionHeader, { color: colors.muted }]}>
            Daily reading goal
          </Text>
          <View style={styles.optionsRow}>
            {[15, 30, 45, 60, 90].map((mins) => {
              const isSelected = dailyGoal === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  onPress={() => handleGoalChange(mins)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isSelected ? colors.ink : 'transparent',
                      borderColor: isSelected ? colors.ink : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typeTokens.caption,
                      {
                        color: isSelected ? colors.paper : colors.ink,
                        fontFamily: 'Inter_600SemiBold',
                      },
                    ]}
                  >
                    {mins}m
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Streak Completion Threshold */}
        <View style={styles.section}>
          <Text style={[typeTokens.eyebrow, styles.sectionHeader, { color: colors.muted }]}>
            Engaged time for streak check
          </Text>
          <View style={styles.optionsRow}>
            {[5, 10, 15, 20].map((mins) => {
              const isSelected = minEngaged === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  onPress={() => handleMinEngagedChange(mins)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isSelected ? colors.ink : 'transparent',
                      borderColor: isSelected ? colors.ink : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typeTokens.caption,
                      {
                        color: isSelected ? colors.paper : colors.ink,
                        fontFamily: 'Inter_600SemiBold',
                      },
                    ]}
                  >
                    {mins} min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reminders & Calendar (Phase 3) */}
        <View style={styles.section}>
          <Text style={[typeTokens.eyebrow, styles.sectionHeader, { color: colors.muted }]}>
            Reminders & Schedule
          </Text>
          <View
            style={[
              styles.settingCard,
              { backgroundColor: colors.surface, borderColor: colors.hairline },
            ]}
          >
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typeTokens.headline, { color: colors.ink }]}>Daily reading reminder</Text>
                <Text style={[typeTokens.caption, { color: colors.muted, marginTop: 2 }]}>
                  {reminderHour}:00 every day naming your active book
                </Text>
              </View>
              <Switch
                value={remindersEnabled}
                onValueChange={handleToggleReminders}
                trackColor={{ false: colors.sunken, true: colors.accent }}
              />
            </View>

            <View style={[styles.cardDivider, { backgroundColor: colors.hairline }]} />

            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typeTokens.headline, { color: colors.ink }]}>Calendar block</Text>
                <Text style={[typeTokens.caption, { color: colors.muted, marginTop: 2 }]}>
                  Sync reading sessions directly into your device calendar
                </Text>
              </View>
              <SecondaryButton label="Add" onPress={handleAddToCalendar} />
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[typeTokens.eyebrow, styles.sectionHeader, { color: colors.muted }]}>
            Appearance
          </Text>
          <View style={styles.optionsRow}>
            {(['light', 'dark'] as const).map((mode) => {
              const isSelected = scheme === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setScheme(mode)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: isSelected ? colors.ink : 'transparent',
                      borderColor: isSelected ? colors.ink : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typeTokens.caption,
                      {
                        color: isSelected ? colors.paper : colors.ink,
                        fontFamily: 'Inter_600SemiBold',
                        textTransform: 'capitalize',
                      },
                    ]}
                  >
                    {mode} Mode
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  topBar: {
    paddingHorizontal: space.gutter,
    paddingTop: space.sm,
    height: 48,
  },
  backButton: {
    minWidth: size.tapTarget,
    minHeight: size.tapTarget,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    maxWidth: size.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginBottom: space.xl,
  },
  section: {
    marginBottom: space.xxl,
  },
  sectionHeader: {
    marginBottom: space.md,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  optionChip: {
    height: size.chip,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.xs,
  },
  cardDivider: {
    height: 1,
    marginVertical: space.md,
  },
});
