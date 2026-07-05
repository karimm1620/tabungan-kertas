import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { accentByKey, radius, spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { GlassCard } from "./GlassCard";

export const FLOATING_TAB_BAR_HEIGHT = 64;
export const FLOATING_TAB_BAR_MARGIN = spacing.md;

const TAB_META: Record<string, { icon: string; label: string }> = {
  index: { icon: "🎯", label: "Goals" },
  history: { icon: "📜", label: "History" },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      useNativeDriver: true,
      damping: 20,
      stiffness: 220,
      mass: 0.8,
    }).start();
  }, [state.index, indicatorAnim]);

  const routeCount = state.routes.length;
  const innerPadding = 4;
  const segmentWidth =
    containerWidth > 0 ? (containerWidth - innerPadding * 2) / routeCount : 0;

  const translateX = indicatorAnim.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * segmentWidth),
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: insets.bottom + FLOATING_TAB_BAR_MARGIN },
      ]}
      pointerEvents="box-none"
    >
      <GlassCard
        tintColor={colors.surface + "E6"}
        radiusSize={radius.pill}
        style={styles.capsule}
        onLayout={handleLayout}
      >
        {segmentWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              {
                width: segmentWidth,
                backgroundColor: accentByKey.lavender.base,
                transform: [{ translateX }],
              },
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TAB_META[route.name] ?? { icon: "•", label: route.name };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              <Text style={styles.icon}>{meta.icon}</Text>
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused
                      ? colors.textPrimary
                      : colors.textSecondary,
                  },
                ]}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
  },
  capsule: {
    flexDirection: "row",
    height: FLOATING_TAB_BAR_HEIGHT,
    padding: 4,
    alignItems: "center",
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radius.pill,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
});
