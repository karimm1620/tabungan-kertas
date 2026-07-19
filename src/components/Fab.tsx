import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { m3ElevationStyle, m3Motion, m3Shape } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";

interface FabProps {
  onPress: () => void;
  icon?: string;
  accessibilityLabel: string;
  bottomOffset: number;
}

export function Fab({ onPress, icon = "+", accessibilityLabel, bottomOffset }: FabProps) {
  const { material3 } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scale, { toValue: 0.92, duration: m3Motion.duration.short2, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 250 }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { bottom: bottomOffset, transform: [{ scale }] }]} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        android_ripple={{ color: material3.onPrimaryContainer }}
        style={[
          styles.fab,
          m3ElevationStyle("level3"),
          { backgroundColor: material3.primaryContainer, borderRadius: m3Shape.large },
        ]}
      >
        <Text style={[styles.icon, { color: material3.onPrimaryContainer }]}>{icon}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", right: 16 },
  fab: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 28, fontWeight: "400", marginTop: -2 },
});