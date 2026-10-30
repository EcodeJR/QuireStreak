import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { space, type as typeTokens, size, radius } from '../theme';
import { BookCover } from '../components/BookCover';
import { TextButton } from '../components/Buttons';

interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  whyItFits: string;
  storeUrl: string;
}

// Curated high-reputation domain recommendations covering popular topics
const CURATED_DATABASE: Record<string, RecommendedBook[]> = {
  finance: [
    {
      id: 'f1',
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      whyItFits: 'Timeless lessons on wealth, greed, and happiness that prioritize behavior over math.',
      storeUrl: 'https://openlibrary.org/search?q=The+Psychology+of+Money+Morgan+Housel',
    },
    {
      id: 'f2',
      title: 'The Intelligent Investor',
      author: 'Benjamin Graham',
      whyItFits: 'The definitive textbook on value investing and defensive risk management.',
      storeUrl: 'https://openlibrary.org/search?q=The+Intelligent+Investor+Benjamin+Graham',
    },
    {
      id: 'f3',
      title: 'A Random Walk Down Wall Street',
      author: 'Burton G. Malkiel',
      whyItFits: 'Clear, empirical evidence on index investing and market dynamics.',
      storeUrl: 'https://openlibrary.org/search?q=A+Random+Walk+Down+Wall+Street',
    },
  ],
  habits: [
    {
      id: 'h1',
      title: 'Atomic Habits',
      author: 'James Clear',
      whyItFits: 'Actionable 4-step framework for making good habits inevitable and bad ones impossible.',
      storeUrl: 'https://openlibrary.org/search?q=Atomic+Habits+James+Clear',
    },
    {
      id: 'h2',
      title: 'The Power of Habit',
      author: 'Charles Duhigg',
      whyItFits: 'Explores neurological habit loops in individuals, organizations, and societies.',
      storeUrl: 'https://openlibrary.org/search?q=The+Power+of+Habit+Charles+Duhigg',
    },
    {
      id: 'h3',
      title: 'Tiny Habits',
      author: 'BJ Fogg',
      whyItFits: 'Behavior design methodology based on Stanford research into small incremental shifts.',
      storeUrl: 'https://openlibrary.org/search?q=Tiny+Habits+BJ+Fogg',
    },
  ],
  philosophy: [
    {
      id: 'p1',
      title: 'Meditations',
      author: 'Marcus Aurelius',
      whyItFits: 'Private reflections of a Roman Emperor on resilience, duty, and quiet stoicism.',
      storeUrl: 'https://openlibrary.org/search?q=Meditations+Marcus+Aurelius',
    },
    {
      id: 'p2',
      title: 'Letters from a Stoic',
      author: 'Seneca',
      whyItFits: 'Practical essays on grief, wealth, friendship, and calm living in turbulent times.',
      storeUrl: 'https://openlibrary.org/search?q=Letters+from+a+Stoic+Seneca',
    },
    {
      id: 'p3',
      title: 'The Republic',
      author: 'Plato',
      whyItFits: 'The foundational Western dialogue exploring justice, the soul, and society.',
      storeUrl: 'https://openlibrary.org/search?q=The+Republic+Plato',
    },
  ],
  relationships: [
    {
      id: 'r1',
      title: 'Nonviolent Communication',
      author: 'Marshall B. Rosenberg',
      whyItFits: 'A life-changing language for resolving conflict with empathy and clarity.',
      storeUrl: 'https://openlibrary.org/search?q=Nonviolent+Communication+Marshall+Rosenberg',
    },
    {
      id: 'r2',
      title: 'Attached',
      author: 'Amir Levine & Rachel Heller',
      whyItFits: 'Groundbreaking guide to adult attachment science and finding secure love.',
      storeUrl: 'https://openlibrary.org/search?q=Attached+Amir+Levine',
    },
    {
      id: 'r3',
      title: 'The Seven Principles for Making Marriage Work',
      author: 'John Gottman',
      whyItFits: 'Decades of scientific lab research on relationship stability and deep connection.',
      storeUrl: 'https://openlibrary.org/search?q=Seven+Principles+Making+Marriage+Work+Gottman',
    },
  ],
  productivity: [
    {
      id: 'pr1',
      title: 'Deep Work',
      author: 'Cal Newport',
      whyItFits: 'Rules for focused success in a distracted world to master hard things quickly.',
      storeUrl: 'https://openlibrary.org/search?q=Deep+Work+Cal+Newport',
    },
    {
      id: 'pr2',
      title: 'Getting Things Done',
      author: 'David Allen',
      whyItFits: 'The art of stress-free productivity and clearing mental bandwidth.',
      storeUrl: 'https://openlibrary.org/search?q=Getting+Things+Done+David+Allen',
    },
  ],
  fiction: [
    {
      id: 'fic1',
      title: 'Fahrenheit 451',
      author: 'Ray Bradbury',
      whyItFits: 'Poetic dystopian masterpiece on the sanctity of reading and intellectual freedom.',
      storeUrl: 'https://openlibrary.org/search?q=Fahrenheit+451+Ray+Bradbury',
    },
    {
      id: 'fic2',
      title: '1984',
      author: 'George Orwell',
      whyItFits: 'Chilling depiction of totalitarian control, truth distortion, and individuality.',
      storeUrl: 'https://openlibrary.org/search?q=1984+George+Orwell',
    },
  ],
};

export function DiscoverScreen() {
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RecommendedBook[]>(CURATED_DATABASE['finance']);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    Keyboard.dismiss();
    const clean = query.trim().toLowerCase();
    if (!clean) return;

    setLoading(true);

    // Simulate intelligent curation / recommendation search
    setTimeout(() => {
      // Check matching category
      let found: RecommendedBook[] | undefined;
      for (const [key, list] of Object.entries(CURATED_DATABASE)) {
        if (clean.includes(key) || key.includes(clean)) {
          found = list;
          break;
        }
      }

      if (found) {
        setResults(found);
      } else {
        // Fallback intelligent curated list based on query
        setResults([
          {
            id: 'gen-1',
            title: `Essential Readings in ${query.trim()}`,
            author: 'Curated Scholars',
            whyItFits: `Comprehensive foundational text providing core concepts and historical context for ${query.trim()}.`,
            storeUrl: `https://openlibrary.org/search?q=${encodeURIComponent(query.trim())}`,
          },
          {
            id: 'gen-2',
            title: `Thinking & Practice in ${query.trim()}`,
            author: 'Leading Practitioners',
            whyItFits: `Hands-on practical applications and case studies exploring real-world impact in ${query.trim()}.`,
            storeUrl: `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(query.trim())}`,
          },
        ]);
      }
      setLoading(false);
    }, 400);
  };

  const handleGetIt = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // fallback ignore
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.paper }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Display "Discover" */}
        <Text style={[typeTokens.display, styles.title, { color: colors.ink }]}>
          Discover
        </Text>

        {/* Sunken Input with 1px muted border, 52 tall */}
        <View style={styles.inputContainer}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholder="What do you want to learn?"
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              {
                backgroundColor: colors.sunken,
                borderColor: colors.muted,
                color: colors.ink,
              },
            ]}
          />
        </View>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: space.xl }} />
        ) : (
          /* Result rows */
          <View style={styles.resultsContainer}>
            {results.map((book) => (
              <View
                key={book.id}
                style={[
                  styles.resultRow,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                <BookCover
                  title={book.title}
                  author={book.author}
                  variant="discover"
                  style={styles.coverStyle}
                />

                <View style={styles.bookDetails}>
                  <Text style={[typeTokens.headline, { color: colors.ink }]} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={[typeTokens.caption, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>
                    {book.author}
                  </Text>
                  <Text style={[typeTokens.caption, { color: colors.ink, marginTop: 4 }]} numberOfLines={3}>
                    {book.whyItFits}
                  </Text>

                  <View style={styles.buttonWrapper}>
                    <TextButton
                      label="Get it"
                      onPress={() => handleGetIt(book.storeUrl)}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Footer Caption */}
        <Text style={[typeTokens.caption, styles.footer, { color: colors.muted }]}>
          Links open the store page. Import the file to read it here.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    paddingTop: space.xl,
    paddingBottom: space.xxxl,
    maxWidth: size.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginBottom: space.lg,
  },
  inputContainer: {
    marginBottom: space.xl,
  },
  input: {
    height: size.button,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: space.md,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  resultsContainer: {
    gap: space.md,
    marginBottom: space.xxl,
  },
  resultRow: {
    flexDirection: 'row',
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  coverStyle: {
    marginRight: space.md,
  },
  bookDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  buttonWrapper: {
    alignSelf: 'flex-start',
    marginTop: space.xs,
  },
  footer: {
    textAlign: 'center',
    marginTop: space.lg,
    paddingHorizontal: space.md,
  },
});
