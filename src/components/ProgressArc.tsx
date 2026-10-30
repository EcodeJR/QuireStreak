import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { type as typeTokens, space, motion } from '../theme';

interface ProgressArcProps {
  /** Minutes read today */
  minutesRead: number;
  /** Daily goal in minutes */
  goalMinutes: number;
}

const ARC_SIZE = 280;
const STROKE_WIDTH = 6;

function formatTime(minutes: number): string {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ProgressArc({ minutesRead, goalMinutes }: ProgressArcProps) {
  const { colors } = useTheme();
  const progress = goalMinutes > 0 ? minutesRead / goalMinutes : 0;
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: Math.min(progress, 1),
      duration: motion.arc,
      easing: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubic
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const goalMet = progress >= 1;

  // Rotation from -180deg (0% progress) to 0deg (100% progress)
  const rotateInterpolate = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${formatTime(minutesRead)} of your ${Math.round(goalMinutes)}-minute goal`}
    >
      {/* Semicircle Track */}
      <View style={styles.arcMask}>
        {/* Background track circle */}
        <View
          style={[
            styles.trackCircle,
            {
              borderColor: colors.hairline,
            },
          ]}
        />

        {/* Animated fill arc */}
        <Animated.View
          style={[
            styles.fillArcContainer,
            {
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          <View
            style={[
              styles.fillArc,
              {
                borderColor: colors.accent,
              },
            ]}
          />
        </Animated.View>
      </View>

      {/* Center labels */}
      <View style={styles.labels}>
        <Text style={[typeTokens.eyebrow, { color: colors.muted }]}>Today's reading</Text>
        <Text style={[typeTokens.numerals, { color: colors.ink }]}>{formatTime(minutesRead)}</Text>
        <Text style={[typeTokens.caption, { color: colors.muted }]}>
          {goalMet ? 'Goal met' : `of your ${Math.round(goalMinutes)}-minute goal`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: ARC_SIZE,
    alignSelf: 'center',
    height: ARC_SIZE / 2 + 24,
    justifyContent: 'flex-start',
  },
  arcMask: {
    width: ARC_SIZE,
    height: ARC_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
  },
  trackCircle: {
    width: ARC_SIZE,
    height: ARC_SIZE,
    borderRadius: ARC_SIZE / 2,
    borderWidth: STROKE_WIDTH,
    position: 'absolute',
    top: 0,
  },
  fillArcContainer: {
    width: ARC_SIZE,
    height: ARC_SIZE,
    position: 'absolute',
    top: 0,
  },
  fillArc: {
    width: ARC_SIZE,
    height: ARC_SIZE / 2,
    borderTopLeftRadius: ARC_SIZE / 2,
    borderTopRightRadius: ARC_SIZE / 2,
    borderWidth: STROKE_WIDTH,
    borderBottomWidth: 0,
  },
  labels: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    gap: space.xs,
  },
});
