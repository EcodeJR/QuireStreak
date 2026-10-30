import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { space, type as typeTokens, size, radius } from '../theme';
import { BookCover } from '../components/BookCover';
import { SecondaryButton } from '../components/Buttons';
import { getBooksForStack, createBook, reorderBooks, deleteBook, finishBook, getReadingPosition, Book } from '../db/books';
import { pickBookFile, copyToAppStorage, extractEpubMetadata, titleFromFilename } from '../lib/importer';

export function StackDetailScreen({ route, navigation }: any) {
  const { stackId, stackName } = route.params;
  const { colors } = useTheme();

  const [books, setBooks] = useState<Book[]>([]);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const bks = await getBooksForStack(stackId);
      setBooks(bks);
      const posMap: Record<string, number> = {};
      for (const b of bks) {
        const p = await getReadingPosition(b.id);
        if (p) posMap[b.id] = p.percentRead;
      }
      setPositions(posMap);
    } catch (e) {
      console.error('Error loading stack details:', e);
    }
  }, [stackId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddBook = async () => {
    try {
      const file = await pickBookFile();
      if (!file) return;

      setLoading(true);
      const localPath = await copyToAppStorage(file.uri, file.name);

      let title = titleFromFilename(file.name);
      let author = '';

      if (file.format === 'epub') {
        const meta = await extractEpubMetadata(localPath);
        if (meta?.title) title = meta.title;
        if (meta?.author) author = meta.author;
      }

      await createBook({
        stackId,
        title,
        author,
        format: file.format,
        filePath: localPath,
      });

      await loadData();
    } catch (err: any) {
      Alert.alert('Import Failed', err?.message || 'Could not import book.');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const newOrder = [...books];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    await reorderBooks(stackId, newOrder.map((b) => b.id));
    await loadData();
  };

  const handleMoveDown = async (index: number) => {
    if (index >= books.length - 1) return;
    const newOrder = [...books];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    await reorderBooks(stackId, newOrder.map((b) => b.id));
    await loadData();
  };

  const handleFinish = async (bookId: string) => {
    Alert.alert('Finish Book', 'Mark this book as completed and advance the stack?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          await finishBook(bookId, stackId);
          await loadData();
        },
      },
    ]);
  };

  const handleDelete = async (bookId: string) => {
    Alert.alert('Remove Book', 'Remove this book from the stack?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteBook(bookId);
          await loadData();
        },
      },
    ]);
  };

  // Estimate finish date for the stack
  const totalBooks = books.length;
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + Math.max(1, totalBooks * 14)); // approx 2 weeks per book
  const finishDateStr = finishDate.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]}>
      {/* Top Bar with back */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to library"
        >
          <Text style={[styles.backArrow, { color: colors.ink }]}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title & Caption */}
        <Text style={[typeTokens.display, styles.title, { color: colors.ink }]}>
          {stackName}
        </Text>
        <Text style={[typeTokens.caption, styles.subtitle, { color: colors.muted }]}>
          {totalBooks} {totalBooks === 1 ? 'book' : 'books'}, finish around {finishDateStr}
        </Text>

        {loading && (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: space.md }} />
        )}

        {/* Ordered Book List */}
        <View style={styles.bookList}>
          {books.map((book, idx) => {
            const isReading = book.status === 'reading';
            const isFinished = book.status === 'finished';
            const queueLabel = isReading ? 'Reading' : isFinished ? 'Completed' : `Queued #${idx + 1}`;

            return (
              <View
                key={book.id}
                style={[
                  styles.bookRow,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate('Reader', { bookId: book.id })}
                  activeOpacity={0.8}
                >
                  <BookCover
                    coverPath={book.coverPath}
                    title={book.title}
                    author={book.author}
                    variant="stack"
                    percentRead={positions[book.id]}
                    finished={isFinished}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bookInfo}
                  onPress={() => navigation.navigate('Reader', { bookId: book.id })}
                  activeOpacity={0.8}
                >
                  <Text style={[typeTokens.headline, { color: colors.ink }]} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={[typeTokens.caption, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>
                    {book.author || 'Unknown author'}
                  </Text>
                  <Text
                    style={[
                      typeTokens.caption,
                      {
                        color: isReading ? colors.accentText : colors.muted,
                        marginTop: 4,
                        fontFamily: 'Inter_600SemiBold',
                      },
                    ]}
                  >
                    {queueLabel}
                  </Text>
                </TouchableOpacity>

                {/* Queue controls */}
                <View style={styles.controls}>
                  <TouchableOpacity
                    onPress={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    style={[styles.arrowButton, { opacity: idx === 0 ? 0.2 : 1 }]}
                    accessibilityLabel="Move up in queue"
                  >
                    <Text style={{ color: colors.ink, fontSize: 16 }}>▲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleMoveDown(idx)}
                    disabled={idx === books.length - 1}
                    style={[styles.arrowButton, { opacity: idx === books.length - 1 ? 0.2 : 1 }]}
                    accessibilityLabel="Move down in queue"
                  >
                    <Text style={{ color: colors.ink, fontSize: 16 }}>▼</Text>
                  </TouchableOpacity>
                  {!isFinished && (
                    <TouchableOpacity
                      onPress={() => handleFinish(book.id)}
                      style={styles.actionIcon}
                      accessibilityLabel="Mark finished"
                    >
                      <Text style={{ color: colors.accentText, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
                        Finish
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(book.id)}
                    style={styles.actionIcon}
                    accessibilityLabel="Delete book"
                  >
                    <Text style={{ color: colors.error, fontSize: 13 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Secondary Add Book button */}
        <View style={styles.bottomActions}>
          <SecondaryButton label="Add book" onPress={handleAddBook} />
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
    marginBottom: space.xs,
  },
  subtitle: {
    marginBottom: space.xl,
  },
  bookList: {
    gap: space.md,
    marginBottom: space.xxl,
  },
  bookRow: {
    flexDirection: 'row',
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    marginLeft: space.md,
  },
  controls: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    marginLeft: space.sm,
  },
  arrowButton: {
    padding: 4,
  },
  actionIcon: {
    padding: 4,
  },
  bottomActions: {
    alignItems: 'center',
    marginTop: space.md,
  },
});
