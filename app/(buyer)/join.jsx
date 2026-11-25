import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/ThemeProvider';
import InviteCodeBox from '../../src/components/InviteCodeBox';
import PrimaryButton from '../../src/components/PrimaryButton';
import { redeemInviteCode, loginAsBuilder } from '../../src/services/authService';

export default function JoinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showBuilderInput, setShowBuilderInput] = useState(false);
  const [builderPin, setBuilderPin] = useState('');

  const handleJoin = async () => {
    if (!code || !code.trim()) {
      setError('Please enter your invite code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const redeemed = await redeemInviteCode(code);
      setSuccess(`Welcome to Unit ${redeemed.tower}-${redeemed.unit}. Linking your unit...`);
      setTimeout(() => {
        router.replace('/my-unit');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid invite code.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuilderLogin = async () => {
    try {
      setError('');
      await loginAsBuilder(builderPin);
      router.replace('/residents');
    } catch (err) {
      setError(err.message || 'Invalid Builder PIN.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: isDark ? 90 : 120 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Text
            style={[
              styles.brand,
              {
                color: theme.colors.primary,
                fontFamily: theme.typography.headingFont,
                fontSize: 20,
              },
            ]}
          >
            GATEHOOD
          </Text>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.themeToggle,
              {
                borderColor: theme.colors.line,
                borderRadius: theme.shape.smallRadius,
              },
            ]}
            accessibilityLabel="Toggle theme"
          >
            <Text
              style={[
                styles.themeToggleText,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.bodyMedium,
                  fontSize: theme.typography.smallSize,
                },
              ]}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerArea}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontFamily: theme.typography.headingFont,
                fontSize: theme.typography.titleSize + 6,
              },
            ]}
          >
            Join Your Residence
          </Text>
          <Text
            style={[
              styles.helperText,
              {
                color: theme.colors.muted,
                fontFamily: theme.typography.bodyFont,
                fontSize: theme.typography.baseSize,
              },
            ]}
          >
            Enter the unique invite code provided by your project builder (e.g. A1204-7KQ) to access real-time construction updates.
          </Text>
        </View>

        <InviteCodeBox
          value={code}
          onChangeText={(val) => {
            setCode(val);
            if (error) setError('');
          }}
          error={error}
        />

        {success ? (
          <View
            style={[
              styles.successBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.primary,
                borderRadius: theme.shape.smallRadius,
              },
            ]}
          >
            <Text
              style={[
                styles.successText,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.headingFont,
                  fontSize: theme.typography.baseSize,
                },
              ]}
            >
              {success}
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          title="Join Residence"
          onPress={handleJoin}
          loading={loading}
          disabled={!code.trim() || loading}
          style={{ marginTop: 12 }}
        />

        <View style={styles.builderToggleArea}>
          <TouchableOpacity
            onPress={() => setShowBuilderInput(!showBuilderInput)}
            style={styles.builderToggleBtn}
          >
            <Text
              style={[
                styles.builderToggleText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.bodyMedium,
                  fontSize: theme.typography.smallSize + 1,
                },
              ]}
            >
              {showBuilderInput ? 'Hide Builder Login' : 'Builder login →'}
            </Text>
          </TouchableOpacity>

          {showBuilderInput && (
            <View
              style={[
                styles.builderBox,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.line,
                  borderRadius: theme.shape.cardRadius,
                },
              ]}
            >
              <Text
                style={[
                  styles.builderBoxTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.headingFont,
                    fontSize: 16,
                  },
                ]}
              >
                Builder Access PIN
              </Text>
              <InviteCodeBox
                value={builderPin}
                onChangeText={setBuilderPin}
                placeholder="4826"
              />
              <PrimaryButton
                title="Enter Builder Dashboard"
                onPress={handleBuilderLogin}
                variant="secondary"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brand: {
    letterSpacing: 2,
    fontWeight: '800',
  },
  themeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  themeToggleText: {
    fontWeight: '600',
  },
  headerArea: {
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  helperText: {
    lineHeight: 22,
  },
  successBox: {
    padding: 14,
    borderWidth: 1.5,
    marginVertical: 10,
    alignItems: 'center',
  },
  successText: {
    textAlign: 'center',
  },
  builderToggleArea: {
    marginTop: 32,
    alignItems: 'center',
  },
  builderToggleBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  builderToggleText: {
    textDecorationLine: 'underline',
  },
  builderBox: {
    width: '100%',
    padding: 20,
    borderWidth: 1,
    marginTop: 16,
  },
  builderBoxTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
});