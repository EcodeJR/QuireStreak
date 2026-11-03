import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View
      style={[
        styles.topBarContainer,
        {
          backgroundColor: colors.paper,
          borderBottomColor: colors.hairline,
          paddingTop: Math.max(insets.top, 12),
        },
      ]}
    >
      <View style={styles.topBarContent}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Back to library"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.settingsIcon, { color: colors.ink }]}>Aa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ReaderBottomBarProps {
  visible: boolean;
  percentRead: number; // 0.0 to 1.0
  sessionMinutes: number;
  totalGoalMinutes?: number;
  chapterIndex?: number;
  totalChapters?: number;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
}

export function ReaderBottomBar({
  visible,
  percentRead,
  sessionMinutes,
  totalGoalMinutes = 60,
  chapterIndex = 0,
  totalChapters = 1,
  onPrevChapter,
  onNextChapter,
}: ReaderBottomBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const pct = Math.round(Math.min(Math.max(percentRead, 0), 1) * 100);
  const minutesLeft = Math.max(0, Math.round(totalGoalMinutes - sessionMinutes));

  return (
    <View
      style={[
        styles.bottomBarContainer,
        {
          backgroundColor: colors.paper,
          borderTopColor: colors.hairline,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {/* 2px accent progress line */}
      <View style={[styles.progressTrack, { backgroundColor: colors.hairline }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%`, backgroundColor: colors.accent },
          ]}
        />
      </View>

      <View style={styles.bottomBarContent}>
        {/* Previous page/chapter button */}
        <TouchableOpacity
          onPress={onPrevChapter}
          disabled={chapterIndex <= 0}
          style={[styles.pageButton, { opacity: chapterIndex <= 0 ? 0.35 : 1 }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Previous page"
        >
          <Text style={[styles.pageButtonText, { color: colors.ink }]}>‹ Prev</Text>
        </TouchableOpacity>

        <View style={styles.centerInfo}>
          <Text style={[typeTokens.caption, { color: colors.muted, fontWeight: '600' }]}>
            {totalChapters > 1 ? `Ch. ${chapterIndex + 1} of ${totalChapters}` : `${pct}% read`}
          </Text>
          <Text style={[{ fontSize: 11, color: colors.muted }]}>
            {minutesLeft > 0 ? `${minutesLeft}m left in goal` : 'Goal met today'}
          </Text>
        </View>

        {/* Next page/chapter button */}
        <TouchableOpacity
          onPress={onNextChapter}
          disabled={chapterIndex >= totalChapters - 1}
          style={[styles.pageButton, { opacity: chapterIndex >= totalChapters - 1 ? 0.35 : 1 }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Next page"
        >
          <Text style={[styles.pageButtonText, { color: colors.ink }]}>Next ›</Text>
        </TouchableOpacity>
      </View>
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
    height: 52,
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
    height: 48,
  },
  pageButton: {
    minWidth: 64,
    height: 36,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
