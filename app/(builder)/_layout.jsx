import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../src/components/BottomNav';
import { useTheme } from '../../src/ThemeProvider';

export default function BuilderLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const tabs = [
    { id: 'residents', label: 'Residents' },
    { id: 'notices', label: 'Notices' },
    { id: 'compose', label: 'Compose' },
  ];

  let activeTab = 'residents';
  if (pathname.includes('/notices')) activeTab = 'notices';
  else if (pathname.includes('/compose')) activeTab = 'compose';

  const handleSelectTab = (tabId) => {
    if (tabId === 'residents') router.push('/residents');
    else if (tabId === 'notices') router.push('/notices');
    else if (tabId === 'compose') router.push('/compose');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        <Slot />
      </View>

      <View style={{ paddingBottom: isDark ? insets.bottom : 0 }}>
        <BottomNav
          tabs={tabs}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
