import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { radius, size, space, type as typeTokens } from '../theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function FilterChip({ label, selected, onPress, style }: FilterChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filter ${label}, ${selected ? 'selected' : 'unselected'}`}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.ink : 'transparent',
          borderColor: selected ? colors.ink : colors.muted,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: selected ? colors.paper : colors.ink,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface FilterChipBarProps {
  chips: { id: string; name: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function FilterChipBar({ chips, selectedId, onSelect }: FilterChipBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.barContainer}
    >
      {chips.map((chip) => (
        <FilterChip
          key={chip.id}
          label={chip.name}
          selected={chip.id === selectedId}
          onPress={() => onSelect(chip.id)}
          style={{ marginRight: space.sm }}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: size.chip,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: size.chip,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  barContainer: {
    paddingHorizontal: space.gutter,
    paddingVertical: space.xs,
  },
});
