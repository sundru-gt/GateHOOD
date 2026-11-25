import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';

export default function Chip({
  label,
  selected = false,
  onPress,
  count,
  style,
}) {
  const { theme } = useTheme();

  const bgColor = selected ? theme.colors.chipSelectedBg : theme.colors.chipUnselectedBg;
  const textColor = selected ? theme.colors.chipSelectedText : theme.colors.chipUnselectedText;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: bgColor,
          borderColor: selected ? bgColor : theme.colors.chipBorder,
          borderRadius: theme.shape.chipRadius,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}${count !== undefined ? ` (${count})` : ''}`}
    >
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontFamily: selected ? theme.typography.bodyBold : theme.typography.bodyMedium,
            fontSize: theme.typography.smallSize + 2,
          },
        ]}
      >
        {label}
      </Text>
      {count !== undefined ? (
        <Text
          style={[
            styles.count,
            {
              color: textColor,
              opacity: 0.75,
              fontFamily: theme.typography.bodyMedium,
              fontSize: theme.typography.smallSize,
            },
          ]}
        >
          {count}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginRight: 8,
  },
  label: {
    letterSpacing: 0.1,
  },
  count: {
    fontWeight: '600',
  },
});