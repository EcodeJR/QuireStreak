import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { palette, ColorScheme, Colors } from '../theme';

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: Colors;
  setScheme: (s: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  colors: palette.light,
  setScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useRNColorScheme() as ColorScheme ?? 'light';
  const [scheme, setScheme] = useState<ColorScheme>(system);

  useEffect(() => {
    setScheme(system);
  }, [system]);

  return (
    <ThemeContext.Provider value={{ scheme, colors: palette[scheme], setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
