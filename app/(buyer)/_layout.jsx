import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../../src/components/BottomNav';
import { useTheme } from '../../src/ThemeProvider';

export default function BuyerLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const tabs = [
    { id: 'my-unit', label: 'My Unit' },
    { id: 'updates', label: 'Updates' },
    { id: 'join', label: 'Join' },
  ];

  let activeTab = 'my-unit';
  if (pathname.includes('/updates')) activeTab = 'updates';
  else if (pathname.includes('/join')) activeTab = 'join';

  const handleSelectTab = (tabId) => {
    if (tabId === 'my-unit') router.push('/my-unit');
    else if (tabId === 'updates') router.push('/updates');
    else if (tabId === 'join') router.push('/join');
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
