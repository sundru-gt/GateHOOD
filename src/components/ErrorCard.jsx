import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';
import PrimaryButton from './PrimaryButton';

export default function ErrorCard({
  title = 'Something went wrong',
  message = 'Failed to load data. Please check your connection and try again.',
  onRetry,
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.error,
          borderRadius: theme.shape.cardRadius,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.error,
          },
        ]}
      >
        <Text style={[styles.iconText, { color: theme.colors.onPrimary }]}>!</Text>
      </View>

      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontFamily: theme.typography.headingFont,
            fontSize: 18,
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

      {onRetry ? (
        <PrimaryButton
          title="Retry"
          onPress={onRetry}
          variant="outline"
          style={styles.retryButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderWidth: 1.5,
    marginVertical: 12,
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 20,
    fontWeight: '800',
  },
  title: {
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
  },
  retryButton: {
    minWidth: 140,
    minHeight: 46,
  },
});