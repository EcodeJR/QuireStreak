import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { reader, radius, space, type as typeTokens, size } from '../theme';

export type ReaderThemeKey = 'paper' | 'sepia' | 'night';
export type LineSpacingKey = 'compact' | 'regular' | 'relaxed';

interface ReaderSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  fontSize: number;
  onFontSizeChange: (newSize: number) => void;
  lineSpacing: LineSpacingKey;
  onLineSpacingChange: (spacing: LineSpacingKey) => void;
  readerTheme: ReaderThemeKey;
  onReaderThemeChange: (theme: ReaderThemeKey) => void;
}

export function ReaderSettingsSheet({
  visible,
  onClose,
  fontSize,
  onFontSizeChange,
  lineSpacing,
  onLineSpacingChange,
  readerTheme,
  onReaderThemeChange,
}: ReaderSettingsSheetProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  const handleDecreaseFont = () => {
    if (fontSize > reader.fontSize.min) {
      onFontSizeChange(fontSize - reader.fontSize.step);
    }
  };

  const handleIncreaseFont = () => {
    if (fontSize < reader.fontSize.max) {
      onFontSizeChange(fontSize + reader.fontSize.step);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.muted }]} />

          <Text style={[typeTokens.headline, styles.title, { color: colors.ink }]}>
            Reading Settings
          </Text>

          {/* Theme swatches */}
          <View style={styles.section}>
            <Text style={[typeTokens.eyebrow, { color: colors.muted, marginBottom: space.sm }]}>
              Theme
            </Text>
            <View style={styles.swatchRow}>
              {(['paper', 'sepia', 'night'] as ReaderThemeKey[]).map((thm) => {
                const isSelected = readerTheme === thm;
                const swatchBg = reader.themes[thm].background;
                const swatchText = reader.themes[thm].text;
                return (
                  <TouchableOpacity
                    key={thm}
                    onPress={() => onReaderThemeChange(thm)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`${thm} theme, ${isSelected ? 'selected' : 'unselected'}`}
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: swatchBg,
                        borderColor: isSelected ? colors.accent : colors.hairline,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typeTokens.caption,
                        {
                          color: swatchText,
                          fontFamily: 'Inter_600SemiBold',
                          textTransform: 'capitalize',
                        },
                      ]}
                    >
                      {thm}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Font size stepper */}
          <View style={styles.section}>
            <Text style={[typeTokens.eyebrow, { color: colors.muted, marginBottom: space.sm }]}>
              Size
            </Text>
            <View style={[styles.stepperContainer, { borderColor: colors.hairline, backgroundColor: colors.sunken }]}>
              <TouchableOpacity
                onPress={handleDecreaseFont}
                disabled={fontSize <= reader.fontSize.min}
                style={[styles.stepperButton, { opacity: fontSize <= reader.fontSize.min ? 0.3 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Decrease font size"
              >
                <Text style={[{ color: colors.ink, fontSize: 18, fontFamily: 'Inter_600SemiBold' }]}>A-</Text>
              </TouchableOpacity>

              <Text style={[typeTokens.body, { color: colors.ink, fontFamily: 'Inter_600SemiBold' }]}>
                {fontSize} pt
              </Text>

              <TouchableOpacity
                onPress={handleIncreaseFont}
                disabled={fontSize >= reader.fontSize.max}
                style={[styles.stepperButton, { opacity: fontSize >= reader.fontSize.max ? 0.3 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Increase font size"
              >
                <Text style={[{ color: colors.ink, fontSize: 22, fontFamily: 'Inter_600SemiBold' }]}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Line spacing */}
          <View style={styles.section}>
            <Text style={[typeTokens.eyebrow, { color: colors.muted, marginBottom: space.sm }]}>
              Line Spacing
            </Text>
            <View style={styles.spacingRow}>
              {(['compact', 'regular', 'relaxed'] as LineSpacingKey[]).map((spacingKey) => {
                const isSelected = lineSpacing === spacingKey;
                return (
                  <TouchableOpacity
                    key={spacingKey}
                    onPress={() => onLineSpacingChange(spacingKey)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`${spacingKey} spacing`}
                    style={[
                      styles.spacingButton,
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
                      {spacingKey}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
    marginBottom: space.lg,
  },
  title: {
    alignSelf: 'flex-start',
    marginBottom: space.lg,
  },
  section: {
    width: '100%',
    marginBottom: space.lg,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: space.md,
    width: '100%',
  },
  swatch: {
    flex: 1,
    height: 48,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: space.md,
  },
  stepperButton: {
    minWidth: size.tapTarget,
    minHeight: size.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacingRow: {
    flexDirection: 'row',
    gap: space.sm,
    width: '100%',
  },
  spacingButton: {
    flex: 1,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
