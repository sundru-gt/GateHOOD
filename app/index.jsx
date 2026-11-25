import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUserProfile } from '../src/services/authService';
import { useTheme } from '../src/ThemeProvider';

export default function Index() {
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const profile = await getCurrentUserProfile();
        if (!isMounted) return;

        if (profile?.role === 'buyer') {
          router.replace('/my-unit');
        } else if (profile?.role === 'builder') {
          router.replace('/residents');
        } else {
          router.replace('/join');
        }
      } catch (err) {
        if (isMounted) router.replace('/join');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
