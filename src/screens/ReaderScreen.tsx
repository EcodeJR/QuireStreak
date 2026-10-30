import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { WebView } from 'react-native-webview';
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

export function ReaderScreen({ route, navigation }: any) {
  const { bookId } = route.params;
  const { colors } = useTheme();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [chromeVisible, setChromeVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Settings
  const [readerTheme, setReaderTheme] = useState<ReaderThemeKey>('paper');
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineSpacing, setLineSpacing] = useState<LineSpacingKey>('regular');

  // Reading position & session
  const [percentRead, setPercentRead] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(100);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(60);
  const [fileContent, setFileContent] = useState<string>('');

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
        setChapterTitle(b.title);

        const pos = await getReadingPosition(b.id);
        if (pos) {
          setPercentRead(pos.percentRead);
          if (pos.cfiOrPage && !isNaN(Number(pos.cfiOrPage))) {
            setCurrentPage(Number(pos.cfiOrPage));
          }
        }

        // Load saved preferences
        const savedTheme = (await getSetting('readerTheme')) as ReaderThemeKey | null;
        if (savedTheme) setReaderTheme(savedTheme);

        const savedSize = await getSetting('readerFontSize');
        if (savedSize) setFontSize(Number(savedSize));

        const savedSpacing = (await getSetting('readerLineSpacing')) as LineSpacingKey | null;
        if (savedSpacing) setLineSpacing(savedSpacing);

        const savedGoal = await getSetting('dailyGoalMinutes');
        if (savedGoal) setDailyGoalMinutes(Number(savedGoal));

        // Read text/content if epub
        if (b.format === 'epub') {
          try {
            const raw = await FileSystem.readAsStringAsync(b.filePath, {
              encoding: FileSystem.EncodingType.UTF8,
            }).catch(() => null);
            setFileContent(raw || '');
          } catch {
            // binary or zipped epub fallback
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
      // Persist session end on unmount
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
  }, [percentRead, currentPage]);

  const handleBack = async () => {
    if (book) {
      await updateReadingPosition(book.id, String(currentPage), percentRead);
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

  const themeColors = readerTokens.themes[readerTheme];
  const lineHeightMultiplier = readerTokens.lineSpacing[lineSpacing];

  // HTML Reader Document with embedded styles and tap handler
  const readerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * {
            box-sizing: border-box;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
          }
          body {
            background-color: ${themeColors.background};
            color: ${themeColors.text};
            font-family: Georgia, serif;
            font-size: ${fontSize}px;
            line-height: ${lineHeightMultiplier};
            margin: 0;
            padding: 24px 20px 60px 20px;
            text-align: left;
            word-wrap: break-word;
          }
          h1, h2, h3 {
            font-family: Georgia, serif;
            font-weight: 600;
            line-height: 1.3;
          }
          p {
            margin-bottom: 1.2em;
          }
          .touch-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div id="content">
          <h1>${book?.title || 'Book Title'}</h1>
          <p style="font-style: italic; opacity: 0.8; margin-bottom: 2em;">${book?.author || ''}</p>
          <p>
            Welcome to QuireStreak. Your reading progress, streak, and position are tracked automatically.
          </p>
          <p>
            Tap anywhere in the center of the screen to reveal the reading controls, adjust typography, themes, and see remaining session time.
          </p>
          <p>
            "A reader lives a thousand lives before he dies. The man who never reads lives only one."
          </p>
          <p>
            Reading continues smoothly across sessions. Every 10 minutes of engaged reading ticks your daily streak forward on the activity heatmap.
          </p>
          <div style="white-space: pre-wrap; line-height: inherit;">
            ${(fileContent || '').replace(/<[^>]+>/g, ' ').replace(/[`${}\\]/g, ' ').slice(0, 5000)}
          </div>
        </div>
        <script>
          window.addEventListener('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'tap' }));
          });
          window.addEventListener('scroll', function() {
            var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            var currentScroll = window.scrollY;
            var pct = scrollHeight > 0 ? (currentScroll / scrollHeight) : 0;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'progress', percent: pct }));
          });
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'tap') {
        handleToggleChrome();
      } else if (data.type === 'progress') {
        const pct = Math.min(Math.max(data.percent, 0), 1);
        setPercentRead(pct);
        if (book) {
          updateReadingPosition(book.id, String(currentPage), pct);
        }
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
      {/* Top Bar Chrome */}
      <ReaderTopBar
        visible={chromeVisible}
        chapterTitle={chapterTitle}
        onBack={handleBack}
        onOpenSettings={() => setSettingsVisible(true)}
      />

      {/* Reader WebView Content */}
      <WebView
        ref={webViewRef}
        source={{ html: readerHtml }}
        style={[styles.webView, { backgroundColor: themeColors.background }]}
        onMessage={handleMessage}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Bar Chrome */}
      <ReaderBottomBar
        visible={chromeVisible}
        percentRead={percentRead}
        sessionMinutes={sessionSeconds / 60}
        totalGoalMinutes={dailyGoalMinutes}
      />

      {/* Kidory Settings Sheet */}
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
});
