import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { space, type as typeTokens, size, radius } from '../theme';

interface ReaderTopBarProps {
  visible: boolean;
  chapterTitle?: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function ReaderTopBar({
  visible,
  chapterTitle,
  onBack,
  onOpenSettings,
}: ReaderTopBarProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.topBarContainer, { backgroundColor: colors.paper, borderBottomColor: colors.hairline }]}>
      <SafeAreaView style={styles.topBarContent}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Back to library"
        >
          <Text style={[styles.backIcon, { color: colors.ink }]}>←</Text>
        </TouchableOpacity>

        <Text
          style={[typeTokens.caption, styles.chapterTitle, { color: colors.muted }]}
          numberOfLines={1}
        >
          {chapterTitle || ''}
        </Text>

        <TouchableOpacity
          onPress={onOpenSettings}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Reading settings"
        >
          <Text style={[styles.settingsIcon, { color: colors.ink }]}>Aa</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

interface ReaderBottomBarProps {
  visible: boolean;
  percentRead: number; // 0.0 to 1.0
  sessionMinutes: number;
  totalGoalMinutes?: number;
}

export function ReaderBottomBar({
  visible,
  percentRead,
  sessionMinutes,
  totalGoalMinutes = 60,
}: ReaderBottomBarProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  const pct = Math.round(Math.min(Math.max(percentRead, 0), 1) * 100);
  const minutesLeft = Math.max(0, Math.round(totalGoalMinutes - sessionMinutes));

  return (
    <View style={[styles.bottomBarContainer, { backgroundColor: colors.paper, borderTopColor: colors.hairline }]}>
      {/* 2px accent progress line */}
      <View style={[styles.progressTrack, { backgroundColor: colors.hairline }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>

      <SafeAreaView style={styles.bottomBarContent}>
        <Text style={[typeTokens.caption, { color: colors.muted }]}>
          {pct}% read
        </Text>

        <Text style={[typeTokens.caption, { color: colors.muted }]}>
          {minutesLeft > 0 ? `${minutesLeft}m left in goal` : 'Goal met today'}
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    zIndex: 100,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
    height: 56,
  },
  iconButton: {
    minWidth: size.tapTarget,
    minHeight: size.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  settingsIcon: {
    fontSize: 16,
    fontFamily: 'Newsreader_600SemiBold',
  },
  chapterTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: space.sm,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    zIndex: 100,
  },
  progressTrack: {
    height: 2,
    width: '100%',
  },
  progressFill: {
    height: 2,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.gutter,
    height: 44,
  },
});
