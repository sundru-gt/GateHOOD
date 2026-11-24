import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from './theme';

const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  themePreference: 'system',
  setThemePreference: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = '@gatehood_theme_preference';

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreference] = useState('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreference(saved);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const setThemePreference = async (pref) => {
    setPreference(pref);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
    }
  };

  const toggleTheme = () => {
    const activeIsDark = preference === 'system' ? systemColorScheme === 'dark' : preference === 'dark';
    const nextPref = activeIsDark ? 'light' : 'dark';
    setThemePreference(nextPref);
  };

  const activeMode = preference === 'system' ? (systemColorScheme || 'light') : preference;
  const isDark = activeMode === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark,
      themePreference: preference,
      setThemePreference,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
