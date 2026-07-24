import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, LayoutAnimation, PanResponder, Platform, UIManager } from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const LONG_PRESS_DURATION_MS = 350;
const MOVE_CANCEL_THRESHOLD = 8;

interface UseDragReorderOptions<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  /** Tinggi SERAGAM tiap item (termasuk margin/gap) — dipakai buat kalkulasi kapan posisi ke-swap. */
  itemHeight: number;
  onReorderCommit: (newItems: T[]) => void;
}

/**
 * Long-press + drag buat reorder list, dipicu dari HANDLE terpisah (bukan
 * seluruh card) — item card di app ini (`GoalCard`/`HabitRow`) udah dibungkus
 * `SwipeableRow` (swipe kiri/kanan) dari Checkpoint 2b, jadi drag vertikal
 * TIDAK bisa dipasang di touch area yang sama tanpa rebutan gesture sama
 * Swipeable punya PanResponder sendiri. Handle kecil terpisah = gak ada
 * konflik gesture sama sekali, dan gak perlu Reanimated (app ini emang gak
 * pakai Reanimated — lihat PROJECT_CONTEXT.md).
 *
 * Cara pakai: attach `getHandlePanResponder(item).panHandlers` ke View kecil
 * (drag handle icon) di tiap row, render `order` (bukan `items` asli) buat
 * urutan yang lagi di-drag keliatan real-time, dan style row yang lagi
 * di-drag pakai `draggingKey`+`dragY` biar ngambang ikutin jari.
 */
export function useDragReorder<T>({
  items,
  keyExtractor,
  itemHeight,
  onReorderCommit,
}: UseDragReorderOptions<T>) {
  const [order, setOrder] = useState(items);
  const orderRef = useRef(order);
  orderRef.current = order;

  const draggingKeyRef = useRef<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const startIndexRef = useRef(0);
  const currentIndexRef = useRef(0);

  // Sinkron urutan dari props MASUK ke state lokal — tapi JANGAN pas lagi
  // proses drag, biar urutan yang lagi digeser gak "ketimpa" balik data lama
  // dari parent yang belum sempat ke-refresh (race antara reorder lokal vs
  // prop yang baru nyusul update).
  useEffect(() => {
    if (draggingKeyRef.current === null) {
      setOrder(items);
    }
  }, [items]);

  const getHandlePanResponder = useCallback(
    (item: T) => {
      const key = keyExtractor(item);
      const timerState = { timer: null as ReturnType<typeof setTimeout> | null, activated: false };

      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => !timerState.activated,
        onPanResponderGrant: () => {
          timerState.activated = false;
          timerState.timer = setTimeout(() => {
            timerState.activated = true;
            draggingKeyRef.current = key;
            startIndexRef.current = orderRef.current.findIndex(
              (it) => keyExtractor(it) === key,
            );
            currentIndexRef.current = startIndexRef.current;
            dragY.setValue(0);
            setDraggingKey(key);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          }, LONG_PRESS_DURATION_MS);
        },
        onPanResponderMove: (_, gesture) => {
          if (!timerState.activated) {
            if (
              Math.abs(gesture.dy) > MOVE_CANCEL_THRESHOLD ||
              Math.abs(gesture.dx) > MOVE_CANCEL_THRESHOLD
            ) {
              if (timerState.timer) clearTimeout(timerState.timer);
            }
            return;
          }

          dragY.setValue(gesture.dy);

          const shift = Math.round(gesture.dy / itemHeight);
          const newIndex = Math.min(
            Math.max(startIndexRef.current + shift, 0),
            orderRef.current.length - 1,
          );
          if (newIndex !== currentIndexRef.current) {
            const next = [...orderRef.current];
            const [moved] = next.splice(currentIndexRef.current, 1);
            next.splice(newIndex, 0, moved);
            currentIndexRef.current = newIndex;
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setOrder(next);
          }
        },
        onPanResponderRelease: () => {
          if (timerState.timer) clearTimeout(timerState.timer);
          if (timerState.activated) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            draggingKeyRef.current = null;
            setDraggingKey(null);
            dragY.setValue(0);
            onReorderCommit(orderRef.current);
          }
          timerState.activated = false;
        },
        onPanResponderTerminate: () => {
          if (timerState.timer) clearTimeout(timerState.timer);
          timerState.activated = false;
          if (draggingKeyRef.current === key) {
            draggingKeyRef.current = null;
            setDraggingKey(null);
            dragY.setValue(0);
          }
        },
      });
    },
    [itemHeight, keyExtractor, onReorderCommit, dragY],
  );

  return { order, draggingKey, dragY, getHandlePanResponder };
}

/**
 * Reinterleave hasil reorder dari SUBSET (misal "habit yang due hari ini")
 * balik ke LIST PENUH, tanpa ngerusak posisi relatif item yang gak keliatan
 * di subset itu (misal habit yang cuma due hari lain). Item yang ADA di
 * subset digantiin urutan barunya (`reorderedSubset`, sequential), item yang
 * GAK ada di subset tetap di slot relatifnya masing-masing.
 *
 * Perlu ini karena Today screen cuma nampilin habit yang due HARI INI (subset
 * dari semua habit) — drag-reorder di situ gak boleh nulis ulang sort_order
 * cuma buat subset itu doang (bakal nabrak/nyisain gap sama habit yang lagi
 * gak keliatan).
 */
export function mergeReorderedSubsetIntoFullList<T>(
  fullList: T[],
  keyExtractor: (item: T) => string,
  reorderedSubset: T[],
): T[] {
  const subsetIds = new Set(reorderedSubset.map(keyExtractor));
  let subsetCursor = 0;
  return fullList.map((item) =>
    subsetIds.has(keyExtractor(item)) ? reorderedSubset[subsetCursor++] : item,
  );
}
