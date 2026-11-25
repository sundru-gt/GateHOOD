import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../ThemeProvider';

export default function Skeleton({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}) {
  const { theme } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: theme.colors.line,
          borderRadius: borderRadius !== undefined ? borderRadius : theme.shape.smallRadius,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.skeletonCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.line,
          borderRadius: theme.shape.cardRadius,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Skeleton width={80} height={20} borderRadius={theme.shape.smallRadius} />
        <Skeleton width={50} height={14} borderRadius={4} />
      </View>
      <Skeleton width="85%" height={22} borderRadius={6} style={{ marginVertical: 10 }} />
      <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
      <Skeleton width="70%" height={16} borderRadius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonCard: {
    padding: 18,
    borderWidth: 1,
    marginVertical: 8,
    minHeight: 120,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});