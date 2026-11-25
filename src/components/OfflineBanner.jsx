// src/components/OfflineBanner.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../ThemeProvider';

export default function OfflineBanner({ manualOffline = false }) {
  const { theme } = useTheme();
  const [isOffline, setIsOffline] = useState(manualOffline);

  useEffect(() => {
    // On web, navigator.onLine is standard and reliable
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOffline(!window.navigator.onLine || manualOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      // Only flag offline if isConnected is strictly false
      const offline = state.isConnected === false;
      setIsOffline(offline || manualOffline);
    });

    return () => unsubscribe();
  }, [manualOffline]);

  if (!isOffline) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.primary,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="Offline banner: Offline, showing saved feed"
    >
      <Text
        style={[
          styles.text,
          {
            color: theme.colors.onPrimary,
            fontFamily: theme.typography.bodyMedium,
            fontSize: theme.typography.smallSize + 1,
          },
        ]}
      >
        Offline, showing saved feed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
