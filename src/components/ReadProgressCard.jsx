import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../ThemeProvider';

export default function ReadProgressCard({
  notice,
  onPressCard,
  onViewNotRead,
  onTogglePin,
}) {
  const { theme } = useTheme();

  const {
    title = '',
    pinned = false,
    readCount = 0,
    targetCount = 1,
    audience,
  } = notice || {};

  const effectiveTarget = targetCount > 0 ? targetCount : 1;
  const pct = Math.min(100, Math.round((readCount / effectiveTarget) * 100));
  const unreadCount = Math.max(0, targetCount - readCount);

  const getAudienceLabel = () => {
    if (!audience) return 'Everyone';
    if (audience.type === 'all') return 'Everyone';
    if (audience.type === 'towers') {
      return audience.towers?.length === 1 ? `Tower ${audience.towers[0]}` : `Towers: ${audience.towers?.join(', ')}`;
    }
    if (audience.type === 'units') {
      return audience.units?.length === 1 ? `Unit ${audience.units[0]}` : `${audience.units?.length} Units`;
    }
    return 'Everyone';
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.line,
          borderRadius: theme.shape.cardRadius,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          {pinned ? (
            <View
              style={[
                styles.pinnedBadge,
                {
                  backgroundColor: theme.colors.pillPinnedBg,
                  borderRadius: theme.shape.smallRadius,
                },
              ]}
            >
              <Text
                style={[
                  styles.pinnedText,
                  {
                    color: theme.colors.pillPinnedText,
                    fontFamily: theme.typography.bodyBold,
                    fontSize: theme.typography.smallSize,
                  },
                ]}
              >
                Pinned
              </Text>
            </View>
          ) : null}

          <View
            style={[
              styles.audienceBadge,
              {
                borderColor: theme.colors.line,
                borderRadius: theme.shape.smallRadius,
              },
            ]}
          >
            <Text
              style={[
                styles.audienceText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.bodyMedium,
                  fontSize: theme.typography.smallSize,
                },
              ]}
            >
              {getAudienceLabel()}
            </Text>
          </View>
        </View>

        {onTogglePin ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onTogglePin}
            style={[
              styles.pinButton,
              {
                borderColor: pinned ? theme.colors.primary : theme.colors.line,
                backgroundColor: pinned ? theme.colors.surface : 'transparent',
                borderRadius: theme.shape.smallRadius,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={pinned ? 'Unpin notice' : 'Pin notice'}
          >
            <Text
              style={[
                styles.pinButtonText,
                {
                  color: pinned ? theme.colors.primary : theme.colors.muted,
                  fontFamily: theme.typography.bodyMedium,
                  fontSize: theme.typography.smallSize,
                },
              ]}
            >
              {pinned ? 'Unpin' : 'Pin'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPressCard}
        style={styles.contentArea}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontFamily: theme.typography.headingFont,
              fontSize: 18,
            },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>

        <View
          style={[
            styles.progressBarTrack,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.line,
              borderRadius: 5,
            },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${pct}%`,
                backgroundColor: theme.colors.primary,
                borderRadius: 5,
              },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <Text
            style={[
              styles.countText,
              {
                color: theme.colors.text,
                fontFamily: theme.typography.bodyBold,
                fontSize: theme.typography.baseSize - 1,
              },
            ]}
          >
            {readCount} of {targetCount} read ({pct}%)
          </Text>

          {unreadCount > 0 && onViewNotRead ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onViewNotRead}
              style={styles.notReadLink}
              accessibilityRole="button"
              accessibilityLabel={`View ${unreadCount} who haven't read`}
            >
              <Text
                style={[
                  styles.linkText,
                  {
                    color: theme.colors.primary,
                    fontFamily: theme.typography.headingFont,
                    fontSize: theme.typography.smallSize + 1,
                  },
                ]}
              >
                View {unreadCount} unread →
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.allReadText,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.bodyMedium,
                  fontSize: theme.typography.smallSize,
                },
              ]}
            >
              All read
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderWidth: 1,
    marginVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinnedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pinnedText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  audienceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  audienceText: {},
  pinButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  pinButtonText: {},
  contentArea: {},
  title: {
    marginBottom: 12,
  },
  progressBarTrack: {
    height: 10,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 0.5,
    marginBottom: 10,
  },
  progressBarFill: {
    height: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  countText: {},
  notReadLink: {
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontWeight: '700',
  },
  allReadText: {},
});