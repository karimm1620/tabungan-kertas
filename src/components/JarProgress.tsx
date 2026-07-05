import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { radius } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { formatIDR } from "../utils/currency";
import { GlassCard } from "./GlassCard";

interface JarProgressProps {
  currentAmount: number;
  targetAmount: number;
  accentBase: string;
  accentDeep: string;
}

const JAR_HEIGHT = 220;
const SPARKLES = ["✨", "🎉", "⭐️", "🎊", "✨", "🎉"];

/**
 * Signature visual aplikasi: "jar tabungan" — metafora nabung dalam toples kaca.
 * Cairan pastel mengisi toples sesuai progress. Begitu goal tercapai (100%),
 * jar melakukan "bounce" sekali + semburan sparkle + glow lembut yang terus
 * berkedip selama goal itu masih tercapai.
 */
export function JarProgress({
  currentAmount,
  targetAmount,
  accentBase,
  accentDeep,
}: JarProgressProps) {
  const { colors, typography } = useTheme();
  const percent =
    targetAmount > 0 ? Math.min(1, currentAmount / targetAmount) : 0;
  const isComplete = percent >= 1;

  const fillAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef(
    SPARKLES.map(() => new Animated.Value(0)),
  ).current;
  const wasCompleteRef = useRef(false);
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Isi cairan mengikuti progress
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: percent,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [percent, fillAnim]);

  // Trigger celebration SEKALI setiap kali goal baru transisi jadi 100%
  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.08,
          duration: 220,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      sparkleAnims.forEach((a) => a.setValue(0));
      Animated.stagger(
        70,
        sparkleAnims.map((a) =>
          Animated.timing(a, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ),
      ).start();
    }
    wasCompleteRef.current = isComplete;
  }, [isComplete, bounceAnim, sparkleAnims]);

  // Glow lembut berulang selama goal masih dalam status tercapai
  useEffect(() => {
    if (isComplete) {
      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1300,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1300,
            useNativeDriver: true,
          }),
        ]),
      );
      glowLoopRef.current.start();
    } else {
      glowLoopRef.current?.stop();
      glowAnim.setValue(0);
    }
    return () => glowLoopRef.current?.stop();
  }, [isComplete, glowAnim]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, JAR_HEIGHT - 8],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.4],
  });
  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 8,
        },
        glowRing: {
          position: "absolute",
          width: 200,
          height: JAR_HEIGHT,
          borderRadius: radius.xl,
        },
        jarBody: {
          width: 200,
          height: JAR_HEIGHT,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.glassBorder,
          overflow: "hidden",
          justifyContent: "flex-end",
        },
        liquid: {
          width: "100%",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        liquidTopShine: {
          height: 6,
          width: "100%",
          opacity: 0.6,
        },
        rimGlass: {
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          height: 36,
        },
        centerInfo: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
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
        sparkle: {
          position: "absolute",
          fontSize: 20,
        },
      }),
    [colors, typography],
  );

  return (
    <View style={styles.wrapper}>
      {isComplete && (
        <Animated.View
          style={[
            styles.glowRing,
            {
              backgroundColor: accentDeep,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
      )}

      <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
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
            <View
              style={[styles.liquidTopShine, { backgroundColor: accentDeep }]}
            />
          </Animated.View>

          {/* Pantulan kaca di atas toples */}
          <GlassCard
            style={styles.rimGlass}
            radiusSize={radius.lg}
            tintColor="rgba(255,255,255,0.25)"
          />

          {/* Info di tengah toples */}
          <View style={styles.centerInfo} pointerEvents="none">
            <Text style={styles.percentText}>{Math.round(percent * 100)}%</Text>
            <Text style={styles.amountText}>{formatIDR(currentAmount)}</Text>
            <Text style={styles.targetText}>
              {isComplete
                ? "Goal tercapai! 🎉"
                : `dari ${formatIDR(targetAmount)}`}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Semburan sparkle saat baru mencapai 100% */}
      {SPARKLES.map((emoji, index) => {
        const offsetX = (index - (SPARKLES.length - 1) / 2) * 26;
        const anim = sparkleAnims[index];
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -70],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1, 0],
        });
        return (
          <Animated.Text
            key={index}
            style={[
              styles.sparkle,
              {
                top: JAR_HEIGHT / 2,
                left: "50%",
                marginLeft: offsetX - 10,
                opacity,
                transform: [{ translateY }],
              },
            ]}
            pointerEvents="none"
          >
            {emoji}
          </Animated.Text>
        );
      })}
    </View>
  );
}
