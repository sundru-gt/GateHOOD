import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';

export default function StatTile({
  label,
  value,
  subtitle,
  highlight = false,
  style,
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.line,
          borderRadius: theme.shape.smallRadius,
        },
        style,
      ]}
      accessible={true}
      accessibilityLabel={`${label}: ${value}${subtitle ? `, ${subtitle}` : ''}`}
    >
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.muted,
            fontFamily: theme.typography.bodyMedium,
            fontSize: theme.typography.smallSize,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: highlight ? theme.colors.primary : theme.colors.text,
            fontFamily: theme.typography.headingFont,
            fontSize: theme.typography.bigNumberSize,
            fontWeight: theme.typography.bigNumberWeight,
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.bodyFont,
              fontSize: theme.typography.smallSize,
            },
          ]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    padding: 14,
    borderWidth: 1,
    minHeight: 80,
    justifyContent: 'center',
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
  },
});