import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../ThemeProvider';

export default function GreetingHeader({
  greeting = 'Good morning',
  name = 'Resident',
  onAvatarPress,
  rightAction,
}) {
  const { theme } = useTheme();

  const getInitials = (text) => {
    if (!text) return 'GH';
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.greeting,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.bodyFont,
              fontSize: theme.typography.smallSize + 2,
            },
          ]}
          numberOfLines={1}
        >
          {greeting}
        </Text>
        <Text
          style={[
            styles.name,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
              fontSize: theme.typography.titleSize,
            },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>

      <View style={styles.actions}>
        {rightAction}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAvatarPress}
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.shape.cardRadius > 15 ? 22 : 8,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Profile avatar for ${name}`}
        >
          <Text
            style={[
              styles.avatarText,
              {
                color: theme.colors.onPrimary,
                fontFamily: theme.typography.headingFont,
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    marginBottom: 2,
  },
  name: {
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
});