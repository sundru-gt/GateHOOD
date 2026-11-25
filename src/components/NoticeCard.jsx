import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, AccessibilityInfo } from 'react-native';
import { useTheme } from '../ThemeProvider';

export default function NoticeCard({
  notice,
  isRead = false,
  onPress,
  showAudience = true,
  rightAction,
}) {
  const { theme } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
    } else {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [reduceMotion]);

  const {
    title = '',
    body = '',
    pinned = false,
    createdAt,
    audience,
  } = notice || {};

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

  const formatDate = (val) => {
    if (!val) return '';
    try {
      const date = val.toDate ? val.toDate() : new Date(val);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.line,
            borderRadius: theme.shape.cardRadius,
            opacity: isRead ? 0.7 : 1.0,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${pinned ? 'Pinned notice: ' : ''}${isRead ? 'Read: ' : 'Unread: '}${title}`}
      >
        <View style={styles.headerRow}>
          <View style={styles.badgeGroup}>
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

            {showAudience ? (
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
            ) : null}
          </View>

          <View style={styles.rightHeader}>
            {createdAt ? (
              <Text
                style={[
                  styles.dateText,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.bodyFont,
                    fontSize: theme.typography.smallSize,
                  },
                ]}
              >
                {formatDate(createdAt)}
              </Text>
            ) : null}

            {!isRead ? (
              <View
                style={[
                  styles.unreadDot,
                  { backgroundColor: theme.colors.unreadDot },
                ]}
                accessibilityLabel="Unread"
              />
            ) : null}

            {rightAction}
          </View>
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
          numberOfLines={2}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.body,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.bodyFont,
              fontSize: theme.typography.baseSize,
            },
          ]}
          numberOfLines={3}
        >
          {body}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderWidth: 1,
    marginVertical: 6,
    minHeight: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
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
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {},
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  body: {
    lineHeight: 22,
  },
});