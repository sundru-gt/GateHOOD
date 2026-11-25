import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/ThemeProvider';
import Chip from '../../src/components/Chip';
import PrimaryButton from '../../src/components/PrimaryButton';
import { composeNotice } from '../../src/services/noticeService';

export default function ComposeNoticeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audienceType, setAudienceType] = useState('all');
  const [selectedTowers, setSelectedTowers] = useState(['A']);
  const [specificUnitsInput, setSpecificUnitsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const toggleTower = (t) => {
    if (selectedTowers.includes(t)) {
      if (selectedTowers.length > 1) {
        setSelectedTowers(selectedTowers.filter((item) => item !== t));
      }
    } else {
      setSelectedTowers([...selectedTowers, t]);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Field', 'Please enter a title for the notice.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Missing Field', 'Please enter the notice body.');
      return;
    }

    setPublishing(true);
    try {
      let audience = { type: 'all', towers: [], units: [] };
      let targetCount = 102;

      if (audienceType === 'towers') {
        audience = {
          type: 'towers',
          towers: selectedTowers,
          units: [],
        };
        targetCount = selectedTowers.length * 34;
      } else if (audienceType === 'units') {
        const parsedUnits = specificUnitsInput
          .split(',')
          .map((u) => u.trim().toUpperCase())
          .filter(Boolean);

        if (parsedUnits.length === 0) {
          Alert.alert('Missing Units', 'Please enter at least one unit (e.g. A-1204, B-101).');
          setPublishing(false);
          return;
        }

        audience = {
          type: 'units',
          towers: [],
          units: parsedUnits,
        };
        targetCount = parsedUnits.length;
      }

      await composeNotice({
        title,
        body,
        audience,
        pinned: isPinned,
        targetCount,
      });

      Alert.alert('Published', 'The notice has been published to residents successfully.', [
        {
          text: 'View Notices',
          onPress: () => router.push('/notices'),
        },
      ]);
    } catch (err) {
      console.warn('Error publishing notice:', err);
      Alert.alert('Publish Error', err.message || 'Failed to publish notice.');
    } finally {
      setPublishing(false);
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
          { paddingBottom: isDark ? 80 : 110 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            styles.heading,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
              fontSize: theme.typography.titleSize + 4,
            },
          ]}
        >
          Compose Notice
        </Text>
        <Text
          style={[
            styles.subheading,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.bodyFont,
              fontSize: theme.typography.baseSize - 1,
            },
          ]}
        >
          Send construction milestones, approvals, or inspections directly to buyers.
        </Text>

        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
              fontSize: 14,
            },
          ]}
        >
          Notice Title
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Tower A 14th Slab Pouring Completed"
          placeholderTextColor={theme.colors.muted}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              borderRadius: theme.shape.smallRadius,
              color: theme.colors.text,
              fontFamily: theme.typography.bodyMedium,
            },
          ]}
        />

        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
              fontSize: 14,
            },
          ]}
        >
          Notice Body
        </Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Provide specific details about the progress or instructions..."
          placeholderTextColor={theme.colors.muted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[
            styles.textArea,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              borderRadius: theme.shape.smallRadius,
              color: theme.colors.text,
              fontFamily: theme.typography.bodyFont,
            },
          ]}
        />

        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
              fontSize: 14,
            },
          ]}
        >
          Send to Audience
        </Text>
        <View style={styles.chipRow}>
          <Chip
            label="Everyone"
            selected={audienceType === 'all'}
            onPress={() => setAudienceType('all')}
          />
          <Chip
            label="Selected Towers"
            selected={audienceType === 'towers'}
            onPress={() => setAudienceType('towers')}
          />
          <Chip
            label="Specific Units"
            selected={audienceType === 'units'}
            onPress={() => setAudienceType('units')}
          />
        </View>

        {audienceType === 'towers' && (
          <View style={styles.subSelectorBox}>
            <Text
              style={[
                styles.subLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.bodyFont,
                  fontSize: theme.typography.smallSize + 1,
                },
              ]}
            >
              Select targeted towers:
            </Text>
            <View style={styles.chipRow}>
              {['A', 'B', 'C'].map((t) => (
                <Chip
                  key={t}
                  label={`Tower ${t}`}
                  selected={selectedTowers.includes(t)}
                  onPress={() => toggleTower(t)}
                />
              ))}
            </View>
          </View>
        )}

        {audienceType === 'units' && (
          <View style={styles.subSelectorBox}>
            <Text
              style={[
                styles.subLabel,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.bodyFont,
                  fontSize: theme.typography.smallSize + 1,
                },
              ]}
            >
              Enter unit IDs separated by commas (e.g. A-1204, B-1002):
            </Text>
            <TextInput
              value={specificUnitsInput}
              onChangeText={setSpecificUnitsInput}
              placeholder="A-1204, B-1002, C-501"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="characters"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.line,
                  borderRadius: theme.shape.smallRadius,
                  color: theme.colors.text,
                  fontFamily: theme.typography.bodyMedium,
                },
              ]}
            />
          </View>
        )}

        <View
          style={[
            styles.switchRow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              borderRadius: theme.shape.smallRadius,
            },
          ]}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text
              style={[
                styles.switchTitle,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.headingFont,
                  fontSize: 15,
                },
              ]}
            >
              Pin to Top of Feed
            </Text>
            <Text
              style={[
                styles.switchSubtitle,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.bodyFont,
                  fontSize: theme.typography.smallSize,
                },
              ]}
            >
              Pinned notices stay prominent for buyers until unpinned.
            </Text>
          </View>

          <Switch
            value={isPinned}
            onValueChange={setIsPinned}
            trackColor={{ false: theme.colors.line, true: theme.colors.primary }}
            thumbColor={theme.colors.onPrimary}
          />
        </View>

        <PrimaryButton
          title="Publish Notice"
          onPress={handlePublish}
          loading={publishing}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  heading: {
    letterSpacing: -0.5,
  },
  subheading: {
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 110,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  subSelectorBox: {
    marginBottom: 16,
  },
  subLabel: {
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    marginVertical: 6,
  },
  switchTitle: {
    marginBottom: 2,
  },
  switchSubtitle: {},
});