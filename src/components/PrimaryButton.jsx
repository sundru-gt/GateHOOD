import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../ThemeProvider';

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
}) {
  const { theme } = useTheme();

  let bgColor = theme.colors.primary;
  let textColor = theme.colors.onPrimary;
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (variant === 'secondary') {
    bgColor = theme.colors.surface;
    textColor = theme.colors.text;
    borderColor = theme.colors.line;
    borderWidth = 1;
  } else if (variant === 'outline') {
    bgColor = 'transparent';
    textColor = theme.colors.text;
    borderColor = theme.colors.line;
    borderWidth = 1.5;
  } else if (variant === 'danger') {
    bgColor = theme.colors.error;
    textColor = theme.colors.onPrimary;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? theme.colors.line : bgColor,
          borderColor,
          borderWidth,
          borderRadius: theme.shape.buttonRadius,
          minHeight: 54,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: disabled ? theme.colors.muted : textColor,
              fontFamily: theme.typography.headingFont,
              fontSize: theme.typography.baseSize,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});