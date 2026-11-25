import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { useTheme } from '../ThemeProvider';

export default function EmptyState({
  title = 'No notices yet',
  message = 'When construction updates or announcements are posted, they will appear here.',
  action,
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.svgWrapper}>
        <Svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <Rect
            x="24"
            y="30"
            width="52"
            height="80"
            rx="8"
            fill={theme.colors.surface}
            stroke={theme.colors.line}
            strokeWidth="2"
          />
          <Rect x="32" y="40" width="12" height="12" rx="3" fill={theme.colors.line} />
          <Rect x="54" y="40" width="12" height="12" rx="3" fill={theme.colors.line} />
          <Rect x="32" y="60" width="12" height="12" rx="3" fill={theme.colors.line} />
          <Rect x="54" y="60" width="12" height="12" rx="3" fill={theme.colors.line} />
          <Rect x="32" y="80" width="12" height="12" rx="3" fill={theme.colors.line} />
          <Rect x="54" y="80" width="12" height="12" rx="3" fill={theme.colors.line} />
          <Circle
            cx="85"
            cy="45"
            r="24"
            fill={theme.colors.bg}
            stroke={theme.colors.primary}
            strokeWidth="2.5"
          />
          <Path
            d="M75 42H95M75 48H89"
            stroke={theme.colors.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <Circle cx="85" cy="55" r="2" fill={theme.colors.primary} />
        </Svg>
      </View>

      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontFamily: theme.typography.headingFont,
            fontSize: theme.typography.titleSize - 2,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.message,
          {
            color: theme.colors.muted,
            fontFamily: theme.typography.bodyFont,
            fontSize: theme.typography.baseSize,
          },
        ]}
      >
        {message}
      </Text>

      {action ? <View style={styles.actionWrapper}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 260,
  },
  svgWrapper: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  actionWrapper: {
    marginTop: 20,
    width: '100%',
    maxWidth: 240,
  },
});