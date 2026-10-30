import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  useFonts,
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import { ThemeProvider, useTheme } from './src/hooks/useTheme';
import { TodayScreen } from './src/screens/TodayScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { StreakScreen } from './src/screens/StreakScreen';
import { StackDetailScreen } from './src/screens/StackDetailScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { TodayIcon, LibraryIcon, DiscoverIcon, StreakIcon } from './src/components/TabIcons';
import { size, space } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.paper,
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTitle: '',
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.settingsHeaderButton}
            accessibilityLabel="Open settings"
          >
            <Text style={[styles.settingsGear, { color: colors.muted }]}>⚙</Text>
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          height: size.tabBar + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 11,
          lineHeight: 14,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color }) => <TodayIcon color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: ({ color }) => <LibraryIcon color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color }) => <DiscoverIcon color={color} size={22} />,
        }}
      />
      <Tab.Screen
        name="Streak"
        component={StreakScreen}
        options={{
          tabBarLabel: 'Streak',
          tabBarIcon: ({ color }) => <StreakIcon color={color} size={22} />,
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { colors, scheme } = useTheme();

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.paper,
      card: colors.paper,
      text: colors.ink,
      border: colors.hairline,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="StackDetail" component={StackDetailScreen} />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent fontsLoaded={fontsLoaded} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { scheme } = useTheme();

  return (
    <View style={styles.container}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsHeaderButton: {
    minWidth: size.tapTarget,
    minHeight: size.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.gutter,
  },
  settingsGear: {
    fontSize: 20,
  },
});
