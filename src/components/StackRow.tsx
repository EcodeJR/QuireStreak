import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { BookCover } from './BookCover';
import { space, type as typeTokens, size } from '../theme';
import type { Book } from '../db/books';
import type { Stack } from '../db/stacks';

interface StackRowProps {
  stack: Stack;
  books: Book[];
  positions: Record<string, number>; // bookId → percentRead
  onBookPress: (book: Book) => void;
  onHeaderPress: (stack: Stack) => void;
}

export function StackRow({ stack, books, positions, onBookPress, onHeaderPress }: StackRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Header row */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => onHeaderPress(stack)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${stack.name}, ${books.length} books. Tap to open stack.`}
      >
        <Text style={[typeTokens.headline, { color: colors.ink }]}>{stack.name}</Text>
        <View style={styles.headerRight}>
          <Text style={[typeTokens.caption, { color: colors.muted }]}>
            {books.length} book{books.length !== 1 ? 's' : ''}
          </Text>
          <Text style={[{ color: colors.muted, fontSize: 16, marginLeft: space.sm }]}>›</Text>
        </View>
      </TouchableOpacity>

      {/* Horizontal scrolling book covers */}
      {books.length === 0 ? (
        <View style={[styles.emptySlot, { borderColor: colors.hairline }]}>
          <Text style={[typeTokens.caption, { color: colors.muted }]}>No books yet</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={96 + space.md}
          decelerationRate="fast"
          contentContainerStyle={styles.bookList}
        >
          {books.map((book, index) => {
            const queueLabel =
              book.status === 'reading' ? 'reading'
              : book.status === 'finished' ? undefined
              : index === 1 ? 'next'
              : String(index + 1);
            return (
              <TouchableOpacity
                key={book.id}
                onPress={() => onBookPress(book)}
                activeOpacity={0.8}
                style={{ marginRight: space.md }}
                accessibilityRole="button"
                accessibilityLabel={`${book.title} by ${book.author}. ${queueLabel === 'reading' ? 'Currently reading' : `Queue position ${index + 1}`}`}
              >
                <BookCover
                  coverPath={book.coverPath}
                  title={book.title}
                  author={book.author}
                  variant="library"
                  queueLabel={queueLabel}
                  percentRead={positions[book.id]}
                  finished={book.status === 'finished'}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: space.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.lg,
    minHeight: size.tapTarget,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookList: {
    paddingHorizontal: space.gutter,
  },
  emptySlot: {
    width: 96,
    height: 144,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: space.gutter,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
