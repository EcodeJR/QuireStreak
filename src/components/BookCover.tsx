import React from 'react';
import {
  View, Text, StyleSheet, Image, ViewStyle,
} from 'react-native';
import { palette, space, radius, type as typeTokens, coverShadow, size, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';

interface BookCoverProps {
  coverPath?: string | null;
  title: string;
  author?: string;
  /** 'library' = 96×144, 'detail' = 160×240, 'stack' = 48×72, 'discover' = 56×84 */
  variant?: 'library' | 'detail' | 'stack' | 'discover';
  /** 'reading', 'next', or a queue number string like '3' */
  queueLabel?: string;
  percentRead?: number;
  finished?: boolean;
  style?: ViewStyle;
}

const DIMS = {
  library:  { w: 96,  h: 144 },
  detail:   { w: 160, h: 240 },
  stack:    { w: 48,  h: 72  },
  discover: { w: 56,  h: 84  },
};

export function BookCover({
  coverPath, title, author, variant = 'library',
  queueLabel, percentRead, finished, style,
}: BookCoverProps) {
  const { colors, scheme } = useTheme();
  const { w, h } = DIMS[variant];

  return (
    <View style={[{ width: w }, style]}>
      <View
        style={[
          styles.cover,
          { width: w, height: h, backgroundColor: colors.sunken },
          scheme === 'light' ? coverShadow : undefined,
        ]}
      >
        {coverPath ? (
          <Image
            source={{ uri: coverPath }}
            style={{ width: w, height: h, borderRadius: radius.cover }}
            resizeMode="cover"
          />
        ) : (
          <FallbackCover title={title} author={author ?? ''} colors={colors} />
        )}

        {/* Finished badge */}
        {finished && (
          <View style={[styles.finishedBadge, { backgroundColor: colors.ink }]}>
            <Text style={{ color: colors.paper, fontSize: 10 }}>✓</Text>
          </View>
        )}
      </View>

      {/* Progress bar under active book */}
      {!finished && percentRead !== undefined && percentRead > 0 && (
        <View style={[styles.progressTrack, { backgroundColor: colors.hairline }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(percentRead * 100, 100)}%`, backgroundColor: colors.accent },
            ]}
          />
        </View>
      )}

      {/* Queue label */}
      {queueLabel !== undefined && (
        <Text
          style={[
            typeTokens.caption,
            styles.queueLabel,
            {
              color: queueLabel.toLowerCase() === 'reading' ? colors.accentText : colors.muted,
            },
          ]}
        >
          {queueLabel === 'reading' ? 'Reading' : queueLabel === 'next' ? 'Next' : queueLabel}
        </Text>
      )}
    </View>
  );
}

function FallbackCover({ title, author, colors }: { title: string; author: string; colors: Colors }) {
  return (
    <View style={[styles.fallback, { backgroundColor: colors.sunken }]}>
      <Text
        style={[{ fontFamily: 'Newsreader_400Regular', fontSize: 14, color: colors.ink }, styles.fallbackTitle]}
        numberOfLines={4}
      >
        {title}
      </Text>
      {!!author && (
        <Text
          style={[{ fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.muted }, styles.fallbackAuthor]}
          numberOfLines={2}
        >
          {author}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: radius.cover,
    overflow: 'hidden',
  },
  fallback: {
    flex: 1,
    padding: space.md,
    justifyContent: 'flex-end',
  },
  fallbackTitle: {
    marginBottom: space.xs,
  },
  fallbackAuthor: {},
  progressTrack: {
    height: 2,
    borderRadius: 1,
    marginTop: space.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
  },
  queueLabel: {
    marginTop: space.xs,
    textAlign: 'left',
  },
  finishedBadge: {
    position: 'absolute',
    bottom: space.sm,
    right: space.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
