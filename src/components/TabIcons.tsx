import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  color: string;
  size?: number;
}

export function TodayIcon({ color, size = 24 }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Semicircle / sun / clock line representation */}
      <View
        style={[
          styles.todayArc,
          {
            borderColor: color,
            width: size - 4,
            height: (size - 4) / 2 + 2,
          },
        ]}
      />
      <View style={[styles.horizontalLine, { backgroundColor: color, width: size - 2 }]} />
    </View>
  );
}

export function LibraryIcon({ color, size = 24 }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 3 books on a shelf */}
      <View style={styles.booksRow}>
        <View style={[styles.bookSpine, { borderColor: color, height: 16 }]} />
        <View style={[styles.bookSpine, { borderColor: color, height: 18 }]} />
        <View style={[styles.bookSpine, { borderColor: color, height: 14, transform: [{ rotate: '12deg' }] }]} />
      </View>
      <View style={[styles.horizontalLine, { backgroundColor: color, width: size - 2, marginTop: 1 }]} />
    </View>
  );
}

export function DiscoverIcon({ color, size = 24 }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Compass / search minimalist circle + pointer */}
      <View
        style={[
          styles.discoverCircle,
          {
            borderColor: color,
            width: 16,
            height: 16,
          },
        ]}
      >
        <View
          style={[
            styles.needle,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function StreakIcon({ color, size = 24 }: IconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Streak grid cell / spark flame line icon */}
      <View
        style={[
          styles.streakBox,
          {
            borderColor: color,
            width: 14,
            height: 14,
          },
        ]}
      >
        <View style={[styles.streakCheck, { borderColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayArc: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1.5,
    borderBottomWidth: 0,
  },
  horizontalLine: {
    height: 1.5,
    borderRadius: 1,
  },
  booksRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bookSpine: {
    width: 4,
    borderWidth: 1.5,
    borderRadius: 1,
  },
  discoverCircle: {
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needle: {
    width: 2,
    height: 6,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  streakBox: {
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCheck: {
    width: 6,
    height: 4,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    transform: [{ rotate: '-45deg' }],
  },
});
