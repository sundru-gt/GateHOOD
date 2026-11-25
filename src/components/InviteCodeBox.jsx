import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';

export default function InviteCodeBox({
  value,
  onChangeText,
  error,
  placeholder = 'A1204-7KQ',
  editable = true,
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.box,
          {
            borderColor: theme.colors.error,
            borderRadius: theme.shape.smallRadius,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={(txt) => onChangeText && onChangeText(txt.toUpperCase().replace(/\s/g, ''))}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.muted}
          editable={editable}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
              fontSize: 26,
            },
          ]}
          accessibilityLabel="Invite code input"
          accessibilityHint="Enter your unique invite code"
        />
      </View>
      {error ? (
        <Text
          style={[
            styles.errorText,
            {
              color: theme.colors.error,
              fontFamily: theme.typography.bodyMedium,
              fontSize: theme.typography.smallSize + 1,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  box: {
    minHeight: 64,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    letterSpacing: 4,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
});