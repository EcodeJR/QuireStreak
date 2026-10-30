import React, { useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { radius, size, space, type as typeTokens, motion } from '../theme';

interface PrimaryButtonProps {
  label: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  subtitle,
  onPress,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: motion.tap,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: motion.tap,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], width: '100%' }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
        style={[
          styles.primaryButton,
          {
            backgroundColor: colors.ink,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.primaryLabel,
            { color: colors.paper },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {!!subtitle && (
          <Text
            style={[
              typeTokens.caption,
              styles.subtitle,
              { color: colors.paper, opacity: 0.8 },
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  style,
}: SecondaryButtonProps) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: motion.tap,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: motion.tap,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.secondaryButton,
          {
            borderColor: colors.muted,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
      >
        <Text style={[styles.secondaryLabel, { color: colors.ink }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

interface TextButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function TextButton({
  label,
  onPress,
  disabled = false,
  style,
  textStyle,
}: TextButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.textButton, style]}
    >
      <Text
        style={[
          styles.textButtonLabel,
          { color: colors.accentText, opacity: disabled ? 0.4 : 1 },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    height: size.button,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    width: '100%',
  },
  primaryLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    textAlign: 'center',
  },
  secondaryButton: {
    height: size.buttonSecondary,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  secondaryLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  textButton: {
    minHeight: size.tapTarget,
    minWidth: size.tapTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.xs,
  },
  textButtonLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
  },
});
