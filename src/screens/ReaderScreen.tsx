import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../hooks/useTheme';
import { reader as readerTokens } from '../theme';
import { ReaderTopBar, ReaderBottomBar } from '../components/ReaderControls';
import {
  ReaderSettingsSheet,
  ReaderThemeKey,
  LineSpacingKey,
} from '../components/ReaderSettingsSheet';
import { getBook, getReadingPosition, updateReadingPosition, finishBook, Book } from '../db/books';
import { startSession, endSession, getSetting, setSetting } from '../db/sessions';
import { parseEpub, EpubChapter } from '../lib/importer';

export function ReaderScreen({ route, navigation }: any) {
  const { bookId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Settings
  const [readerTheme, setReaderTheme] = useState<ReaderThemeKey>('paper');
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineSpacing, setLineSpacing] = useState<LineSpacingKey>('regular');

  // Reading position & session
  const [chapters, setChapters] = useState<EpubChapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [percentRead, setPercentRead] = useState<number>(0);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(60);

  const sessionIdRef = useRef<string | null>(null);
  const sessionSecondsRef = useRef<number>(0);
  const webViewRef = useRef<WebView | null>(null);

  // Load Book & Settings
  useEffect(() => {
    let timer: any = null;

    async function init() {
      try {
        const b = await getBook(bookId);
        if (!b) {
          Alert.alert('Error', 'Book not found');
          navigation.goBack();
          return;
        }
        setBook(b);

        // Load saved preferences
        const savedTheme = (await getSetting('readerTheme')) as ReaderThemeKey | null;
        if (savedTheme) setReaderTheme(savedTheme);

        const savedSize = await getSetting('readerFontSize');
        if (savedSize) setFontSize(Number(savedSize));

        const savedSpacing = (await getSetting('readerLineSpacing')) as LineSpacingKey | null;
        if (savedSpacing) setLineSpacing(savedSpacing);

        const savedGoal = await getSetting('dailyGoalMinutes');
        if (savedGoal) setDailyGoalMinutes(Number(savedGoal));

        // Parse EPUB content natively using JSZip
        const parsed = await parseEpub(b.filePath);
        if (parsed && parsed.chapters.length > 0) {
          setChapters(parsed.chapters);
        } else {
          // Fallback if not an epub or single section
          setChapters([
            {
              id: '1',
              title: b.title,
              html: `<p>Welcome to ${b.title}.</p><p>Tap anywhere to show the top and bottom controls.</p>`,
            },
          ]);
        }

        const pos = await getReadingPosition(b.id);
        if (pos) {
          setPercentRead(pos.percentRead);
          const chIdx = Number(pos.cfiOrPage);
          if (!isNaN(chIdx) && chIdx >= 0) {
            setCurrentChapterIndex(chIdx);
          }
        }

        // Start reading session
        const sId = await startSession(b.id, b.stackId);
        sessionIdRef.current = sId;

        // Session timer
        timer = setInterval(() => {
          sessionSecondsRef.current += 1;
          setSessionSeconds(sessionSecondsRef.current);
        }, 1000);
      } catch (err) {
        console.error('Failed to init reader:', err);
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (timer) clearInterval(timer);
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current, sessionSecondsRef.current).catch(console.error);
      }
    };
  }, [bookId, navigation]);

  // Handle hardware back press
  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [percentRead, currentChapterIndex]);

  const handleBack = async () => {
    if (book) {
      await updateReadingPosition(book.id, String(currentChapterIndex), percentRead);
    }
    if (sessionIdRef.current) {
      await endSession(sessionIdRef.current, sessionSecondsRef.current);
      sessionIdRef.current = null;
    }
    navigation.goBack();
  };

  const handleToggleChrome = () => {
    setChromeVisible((prev) => !prev);
  };

  const handleThemeChange = async (theme: ReaderThemeKey) => {
    setReaderTheme(theme);
    await setSetting('readerTheme', theme);
  };

  const handleFontSizeChange = async (sz: number) => {
    setFontSize(sz);
    await setSetting('readerFontSize', String(sz));
  };

  const handleLineSpacingChange = async (sp: LineSpacingKey) => {
    setLineSpacing(sp);
    await setSetting('readerLineSpacing', sp);
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      const nextIdx = currentChapterIndex + 1;
      setCurrentChapterIndex(nextIdx);
      const newPct = (nextIdx + 1) / chapters.length;
      setPercentRead(newPct);
      if (book) updateReadingPosition(book.id, String(nextIdx), newPct);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      const prevIdx = currentChapterIndex - 1;
      setCurrentChapterIndex(prevIdx);
      const newPct = (prevIdx + 1) / chapters.length;
      setPercentRead(newPct);
      if (book) updateReadingPosition(book.id, String(prevIdx), newPct);
    }
  };

  const currentChapter = chapters[currentChapterIndex] || {
    id: '0',
    title: book?.title || 'Chapter',
    html: '',
  };

  const themeColors = readerTokens.themes[readerTheme];
  const lineHeightMultiplier = readerTokens.lineSpacing[lineSpacing];

  const readerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
          }
          html, body {
            margin: 0;
            padding: 0;
            background-color: ${themeColors.background};
            color: ${themeColors.text};
            font-family: Georgia, serif;
            font-size: ${fontSize}px;
            line-height: ${lineHeightMultiplier};
            width: 100%;
            min-height: 100%;
            overflow-x: hidden;
          }
          #reader-wrapper {
            padding: ${Math.max(insets.top + 52, 64)}px 22px ${Math.max(insets.bottom + 64, 84)}px 22px;
            max-width: 680px;
            margin: 0 auto;
            word-wrap: break-word;
            opacity: 1;
            transform: translateX(0);
            transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.28s ease;
          }
          #reader-wrapper.flip-next {
            transform: translateX(-40px);
            opacity: 0;
          }
          #reader-wrapper.flip-prev {
            transform: translateX(40px);
            opacity: 0;
          }
          #reader-wrapper.enter-next {
            animation: slideInFromRight 0.32s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
          }
          #reader-wrapper.enter-prev {
            animation: slideInFromLeft 0.32s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
          }
          @keyframes slideInFromRight {
            from { transform: translateX(50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInFromLeft {
            from { transform: translateX(-50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          h1, h2, h3 {
            font-family: Georgia, serif;
            font-weight: 700;
            line-height: 1.25;
            margin-top: 0.8em;
            margin-bottom: 0.5em;
          }
          p {
            margin-top: 0;
            margin-bottom: 1.4em;
            text-align: justify;
          }
        </style>
      </head>
      <body>
        <div id="reader-wrapper" class="enter-next">
          ${currentChapter.html || '<p>No text found in this chapter.</p>'}
        </div>

        <script>
          function send(type, data) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, data || {})));
            }
          }

          var wrapper = document.getElementById('reader-wrapper');

          function triggerNext() {
            wrapper.classList.remove('enter-next', 'enter-prev');
            wrapper.classList.add('flip-next');
            setTimeout(function() {
              send('next');
            }, 180);
          }

          function triggerPrev() {
            wrapper.classList.remove('enter-next', 'enter-prev');
            wrapper.classList.add('flip-prev');
            setTimeout(function() {
              send('prev');
            }, 180);
          }

          // Swipe & Tap Detection
          var touchStartX = 0;
          var touchStartY = 0;
          var touchEndX = 0;
          var touchEndY = 0;
          var touchStartTime = 0;

          window.addEventListener('touchstart', function(e) {
            if (e.touches.length === 1) {
              touchStartX = e.touches[0].clientX;
              touchStartY = e.touches[0].clientY;
              touchEndX = touchStartX;
              touchEndY = touchStartY;
              touchStartTime = Date.now();
            }
          }, { passive: true });

          window.addEventListener('touchmove', function(e) {
            if (e.touches.length === 1) {
              touchEndX = e.touches[0].clientX;
              touchEndY = e.touches[0].clientY;
            }
          }, { passive: true });

          window.addEventListener('touchend', function(e) {
            var diffX = touchEndX - touchStartX;
            var diffY = touchEndY - touchStartY;
            var elapsed = Date.now() - touchStartTime;

            // Horizontal Swipe
            if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5 && elapsed < 500) {
              if (diffX < 0) {
                // Swiped Left -> Flip Next
                triggerNext();
              } else {
                // Swiped Right -> Flip Prev
                triggerPrev();
              }
              return;
            }

            // Quick Tap detection (didn't drag much)
            if (Math.abs(diffX) < 15 && Math.abs(diffY) < 15 && elapsed < 350) {
              var screenWidth = window.innerWidth;
              var tapX = touchStartX;

              if (tapX < screenWidth * 0.25) {
                // Left 25% tap -> Previous Page
                triggerPrev();
              } else if (tapX > screenWidth * 0.75) {
                // Right 25% tap -> Next Page
                triggerNext();
              } else {
                // Center 50% tap -> Toggle Navigation Menu
                send('toggle');
              }
            }
          });

          window.addEventListener('scroll', function() {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            var pct = max > 0 ? (window.scrollY / max) : 0;
            send('scroll', { percent: pct });
          });
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'toggle') {
        handleToggleChrome();
      } else if (data.type === 'next') {
        handleNextChapter();
      } else if (data.type === 'prev') {
        handlePrevChapter();
      } else if (data.type === 'scroll') {
        // Track intra-chapter progress
      }
    } catch {
      // ignore
    }
  };

  if (loading || !book) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.paper }]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Top Bar Navigation */}
      <ReaderTopBar
        visible={chromeVisible}
        chapterTitle={currentChapter.title || book.title}
        onBack={handleBack}
        onOpenSettings={() => setSettingsVisible(true)}
      />

      {/* Reader WebView Content */}
      {/* @ts-expect-error react-native-webview v14 TS generic bug */}
      <WebView
        ref={webViewRef}
        key={`${book.id}_ch_${currentChapterIndex}_${readerTheme}`}
        source={{ html: readerHtml }}
        style={[styles.webView, { backgroundColor: themeColors.background }]}
        onMessage={handleMessage}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
      />

      {/* Always Visible Fallback Floating Back Arrow (in safe area) */}
      {!chromeVisible && (
        <TouchableOpacity
          onPress={handleBack}
          style={[
            styles.floatingExitButton,
            {
              top: Math.max(insets.top + 8, 20),
              backgroundColor: colors.paper,
              borderColor: colors.hairline,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back to library"
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.floatingExitIcon, { color: colors.ink }]}>←</Text>
        </TouchableOpacity>
      )}

      {/* Bottom Bar Controls & Progress */}
      <ReaderBottomBar
        visible={chromeVisible}
        percentRead={chapters.length > 0 ? (currentChapterIndex + 1) / chapters.length : percentRead}
        sessionMinutes={sessionSeconds / 60}
        totalGoalMinutes={dailyGoalMinutes}
        chapterIndex={currentChapterIndex}
        totalChapters={chapters.length}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
      />

      {/* Reader Typography & Theme Settings Sheet */}
      <ReaderSettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        lineSpacing={lineSpacing}
        onLineSpacingChange={handleLineSpacingChange}
        readerTheme={readerTheme}
        onReaderThemeChange={handleThemeChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webView: {
    flex: 1,
  },
  floatingExitButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 150,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  floatingExitIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
