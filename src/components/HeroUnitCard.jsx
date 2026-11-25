// src/components/HeroUnitCard.jsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, AccessibilityInfo } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../ThemeProvider';

export default function HeroUnitCard({
  unitNumber = '1204',
  tower = 'Tower A',
  config = '3BHK',
  progressPct = 68,
  daysToPossession = 142,
}) {
  const { theme, isDark } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const animProgress = useRef(new Animated.Value(0)).current;

  const size = 88;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [strokeOffset, setStrokeOffset] = useState(circumference);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const targetOffset = circumference * (1 - progressPct / 100);
    if (reduceMotion) {
      setStrokeOffset(targetOffset);
    } else {
      animProgress.setValue(0);
      const listenerId = animProgress.addListener(({ value }) => {
        setStrokeOffset(circumference * (1 - value));
      });

      Animated.timing(animProgress, {
        toValue: progressPct / 100,
        duration: 900,
        useNativeDriver: false,
      }).start();

      return () => {
        animProgress.removeListener(listenerId);
      };
    }
  }, [progressPct, reduceMotion, circumference]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.heroBg,
          borderColor: theme.colors.heroBorder,
          borderWidth: theme.colors.heroBorderWidth,
          borderRadius: theme.shape.heroRadius,
        },
      ]}
      accessible={true}
      accessibilityLabel={`Unit ${unitNumber}, ${tower}, ${config}. Construction ${progressPct} percent complete, ${daysToPossession} days to possession.`}
    >
      <View style={styles.leftContent}>
        <View style={styles.badgeRow}>
          <Text
            style={[
              styles.towerConfig,
              {
                color: theme.colors.heroMuted,
                fontFamily: theme.typography.bodyMedium,
                fontSize: theme.typography.baseSize - 1,
              },
            ]}
          >
            {tower} · {config}
          </Text>
        </View>

        <Text
          style={[
            styles.unitNumber,
            {
              color: theme.colors.heroText,
              fontFamily: theme.typography.headingFont,
              fontSize: 36,
              fontWeight: theme.typography.bigNumberWeight,
            },
          ]}
        >
          {unitNumber}
        </Text>

        <View style={styles.daysRow}>
          <Text
            style={[
              styles.daysValue,
              {
                color: isDark ? theme.colors.heroText : theme.colors.primary,
                fontFamily: theme.typography.headingFont,
                fontSize: theme.typography.baseSize,
                fontWeight: '700',
              },
            ]}
          >
            {daysToPossession} days
          </Text>
          <Text
            style={[
              styles.daysLabel,
              {
                color: theme.colors.heroMuted,
                fontFamily: theme.typography.bodyFont,
                fontSize: theme.typography.smallSize + 1,
              },
            ]}
          >
            to possession
          </Text>
        </View>
      </View>

      <View style={styles.ringWrapper}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.heroRingTrack}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.heroRing}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.ringInnerLabel}>
          <Text
            style={[
              styles.ringPctText,
              {
                color: theme.colors.heroText,
                fontFamily: theme.typography.headingFont,
                fontSize: 16,
                fontWeight: '700',
              },
            ]}
          >
            {Math.round(progressPct)}%
          </Text>
          <Text
            style={[
              styles.ringSubText,
              {
                color: theme.colors.heroMuted,
                fontFamily: theme.typography.bodyFont,
                fontSize: 9,
                textTransform: 'uppercase',
              },
            ]}
          >
            Done
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 140,
    marginVertical: 12,
  },
  leftContent: {
    flex: 1,
  },
  badgeRow: {
    marginBottom: 4,
  },
  towerConfig: {
    letterSpacing: 0.2,
  },
  unitNumber: {
    letterSpacing: -1,
    marginVertical: 2,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  daysValue: {
    letterSpacing: -0.2,
  },
  daysLabel: {},
  ringWrapper: {
    width: 88,
    height: 88,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  svg: {
    position: 'absolute',
  },
  ringInnerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPctText: {
    letterSpacing: -0.5,
  },
  ringSubText: {
    letterSpacing: 0.5,
  },
});
