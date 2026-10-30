import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { space, type as typeTokens, size, radius } from '../theme';
import { StackRow } from '../components/StackRow';
import { FilterChipBar } from '../components/Chips';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { getStacks, createStack, Stack } from '../db/stacks';
import { getBooksForStack, createBook, getReadingPosition, Book } from '../db/books';
import { pickBookFile, copyToAppStorage, extractEpubMetadata, titleFromFilename } from '../lib/importer';

export function LibraryScreen({ navigation }: any) {
  const { colors } = useTheme();

  const [stacks, setStacks] = useState<Stack[]>([]);
  const [booksByStack, setBooksByStack] = useState<Record<string, Book[]>>({});
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [selectedChipId, setSelectedChipId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [newStackModalVisible, setNewStackModalVisible] = useState(false);
  const [newStackName, setNewStackName] = useState('');

  const loadData = useCallback(async () => {
    try {
      const allStacks = await getStacks();
      // Ensure at least one default stack exists if none
      if (allStacks.length === 0) {
        const defaultStack = await createStack('General');
        allStacks.push(defaultStack);
      }
      setStacks(allStacks);

      const booksMap: Record<string, Book[]> = {};
      const posMap: Record<string, number> = {};

      for (const st of allStacks) {
        const bks = await getBooksForStack(st.id);
        booksMap[st.id] = bks;
        for (const b of bks) {
          const p = await getReadingPosition(b.id);
          if (p) posMap[b.id] = p.percentRead;
        }
      }

      setBooksByStack(booksMap);
      setPositions(posMap);
    } catch (e) {
      console.error('Error loading library:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleImport = async (targetStackId?: string) => {
    try {
      const file = await pickBookFile();
      if (!file) return;

      setLoading(true);

      // Determine which stack to add to: targetStackId or selectedChipId or first stack
      let stackId = targetStackId;
      if (!stackId || stackId === 'all') {
        stackId = stacks[0]?.id;
      }

      if (!stackId) {
        const created = await createStack('General');
        stackId = created.id;
        setStacks([created]);
      }

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
      Alert.alert('Import Failed', err?.message || 'Could not import the selected book.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStack = async () => {
    if (!newStackName.trim()) return;
    try {
      await createStack(newStackName.trim());
      setNewStackName('');
      setNewStackModalVisible(false);
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create stack');
    }
  };

  const totalBooks = Object.values(booksByStack).reduce((acc, list) => acc + list.length, 0);

  const filterChips = [
    { id: 'all', name: 'All' },
    ...stacks.map((s) => ({ id: s.id, name: s.name })),
  ];

  const displayedStacks = selectedChipId === 'all'
    ? stacks
    : stacks.filter((s) => s.id === selectedChipId);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[typeTokens.display, { color: colors.ink }]}>Library</Text>
        <TouchableOpacity
          onPress={() => handleImport()}
          style={[styles.importIconButton, { borderColor: colors.muted }]}
          accessibilityRole="button"
          accessibilityLabel="Import a book"
        >
          <Text style={[styles.importPlus, { color: colors.ink }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      {stacks.length > 0 && totalBooks > 0 && (
        <View style={styles.chipBarWrapper}>
          <FilterChipBar
            chips={filterChips}
            selectedId={selectedChipId}
            onSelect={setSelectedChipId}
          />
        </View>
      )}

      {loading && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator color={colors.accent} size="small" />
          <Text style={[typeTokens.caption, { color: colors.muted, marginLeft: space.sm }]}>
            Importing book...
          </Text>
        </View>
      )}

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {totalBooks === 0 ? (
          /* Empty state exactly matching UI style guide */
          <View style={styles.emptyContainer}>
            <Text style={[typeTokens.title, styles.emptyTitle, { color: colors.ink }]}>
              No books yet
            </Text>
            <Text style={[typeTokens.body, styles.emptyBody, { color: colors.muted }]}>
              Import an EPUB or PDF to start your first stack.
            </Text>
            <PrimaryButton
              label="Import a book"
              onPress={() => handleImport()}
              style={{ marginTop: space.xl }}
            />
          </View>
        ) : (
          /* Stack rows */
          <View style={{ paddingTop: space.md }}>
            {displayedStacks.map((st) => (
              <StackRow
                key={st.id}
                stack={st}
                books={booksByStack[st.id] || []}
                positions={positions}
                onBookPress={(book) => navigation.navigate('Reader', { bookId: book.id })}
                onHeaderPress={(stack) => navigation.navigate('StackDetail', { stackId: stack.id, stackName: stack.name })}
              />
            ))}

            <View style={styles.footerRow}>
              <SecondaryButton
                label="+ New Stack"
                onPress={() => setNewStackModalVisible(true)}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* New Stack Modal */}
      <Modal
        visible={newStackModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNewStackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <Text style={[typeTokens.title, { color: colors.ink, marginBottom: space.md }]}>
              New Stack
            </Text>
            <TextInput
              value={newStackName}
              onChangeText={setNewStackName}
              placeholder="e.g. Finance, Philosophy, Fiction"
              placeholderTextColor={colors.muted}
              autoFocus
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.sunken,
                  borderColor: colors.muted,
                  color: colors.ink,
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <SecondaryButton
                label="Cancel"
                onPress={() => setNewStackModalVisible(false)}
                style={{ flex: 1, marginRight: space.sm }}
              />
              <PrimaryButton
                label="Create"
                onPress={handleCreateStack}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.md,
  },
  importIconButton: {
    width: size.tapTarget,
    height: size.tapTarget,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importPlus: {
    fontSize: 24,
    lineHeight: 26,
    fontFamily: 'Inter_600SemiBold',
  },
  chipBarWrapper: {
    marginBottom: space.md,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.sm,
  },
  scrollContent: {
    paddingBottom: space.xxxl,
  },
  emptyContainer: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xxxl * 1.5,
    maxWidth: size.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  emptyTitle: {
    marginBottom: space.sm,
  },
  emptyBody: {
    marginBottom: space.lg,
  },
  footerRow: {
    paddingHorizontal: space.gutter,
    marginTop: space.lg,
    marginBottom: space.xl,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.gutter,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.xl,
  },
  modalInput: {
    height: size.button,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: space.md,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: space.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
