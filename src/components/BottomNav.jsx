import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';

export default function BottomNav({
  tabs = [],
  activeTab,
  onSelectTab,
}) {
  const { theme, isDark } = useTheme();

  if (!isDark) {
    return (
      <View style={styles.floatingContainer}>
        <View
          style={[
            styles.floatingPill,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              borderRadius: theme.colors.bottomNavRadius,
              padding: theme.colors.bottomNavInset,
            },
          ]}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                activeOpacity={0.8}
                onPress={() => onSelectTab(tab.id)}
                style={[
                  styles.lightTab,
                  {
                    backgroundColor: isActive ? theme.colors.tabActiveBg : 'transparent',
                    borderRadius: 24,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? theme.colors.tabActiveText : theme.colors.tabInactiveText,
                      fontFamily: isActive ? theme.typography.headingFont : theme.typography.bodyMedium,
                      fontSize: theme.typography.smallSize + 2,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.darkContainer,
        {
          backgroundColor: theme.colors.bottomNavBg,
          borderTopColor: theme.colors.bottomNavLine,
        },
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            onPress={() => onSelectTab(tab.id)}
            style={styles.darkTab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            {isActive ? (
              <View
                style={[
                  styles.activeTopBar,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            ) : null}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? theme.colors.tabActiveText : theme.colors.tabInactiveText,
                  fontFamily: isActive ? theme.typography.headingFont : theme.typography.bodyMedium,
                  fontSize: theme.typography.smallSize + 2,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 99,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  lightTab: {
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  darkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    minHeight: 56,
  },
  darkTab: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeTopBar: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 3,
  },
  tabLabel: {
    letterSpacing: 0.2,
  },
});