import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { radius } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { formatIDR } from '../utils/currency';
import { GlassCard } from './GlassCard';

interface JarProgressProps {
  currentAmount: number;
  targetAmount: number;
  accentBase: string;
  accentDeep: string;
}

const JAR_HEIGHT = 220;

/**
 * Signature visual aplikasi: "jar tabungan" — metafora nabung dalam toples kaca.
 * Cairan pastel mengisi toples sesuai progress, dengan strip glass di bagian
 * atas sebagai pantulan cahaya (memakai GlassCard supaya tetap terasa "kaca"
 * walau di Android tanpa native blur, dan tetap kontras di dark mode).
 */
export function JarProgress({ currentAmount, targetAmount, accentBase, accentDeep }: JarProgressProps) {
  const { colors, typography } = useTheme();
  const percent = targetAmount > 0 ? Math.min(1, currentAmount / targetAmount) : 0;
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [percent]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, JAR_HEIGHT - 8],
  });

  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.jarBody}>
        {/* Cairan tabungan */}
        <Animated.View
          style={[
            styles.liquid,
            {
              height: fillHeight,
              backgroundColor: accentBase,
            },
          ]}
        >
          <View style={[styles.liquidTopShine, { backgroundColor: accentDeep }]} />
        </Animated.View>

        {/* Pantulan kaca di atas toples */}
        <GlassCard style={styles.rimGlass} radiusSize={radius.lg} tintColor={colors.glassTintLight} />

        {/* Info di tengah toples */}
        <View style={styles.centerInfo} pointerEvents="none">
          <Text style={styles.percentText}>{Math.round(percent * 100)}%</Text>
          <Text style={styles.amountText}>{formatIDR(currentAmount)}</Text>
          <Text style={styles.targetText}>dari {formatIDR(targetAmount)}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors'], typography: ReturnType<typeof useTheme>['typography']) {
  return StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    jarBody: {
      width: 200,
      height: JAR_HEIGHT,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.glassBorder,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    liquid: {
      width: '100%',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    liquidTopShine: {
      height: 6,
      width: '100%',
      opacity: 0.6,
    },
    rimGlass: {
      position: 'absolute',
      top: 14,
      left: 14,
      right: 14,
      height: 36,
    },
    centerInfo: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentText: {
      ...typography.title,
      fontSize: 30,
    },
    amountText: {
      ...typography.subtitle,
      marginTop: 4,
    },
    targetText: {
      ...typography.caption,
      marginTop: 2,
    },
  });
}
