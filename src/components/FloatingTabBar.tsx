import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { MATERIAL_NAV_BAR_HEIGHT, MaterialNavigationBar } from "./MaterialNavigationBar";

/**
 * Dulu dispatcher iOS capsule / Android docked bar (lihat ui-registry.md
 * versi lama) — capsule iOS udah dihapus total di Checkpoint 0 (Android-only).
 * Nama file dipertahankan biar gak nge-cascade rename ke tempat lain yang
 * mengimpor ini; isinya sekarang cuma re-export `MaterialNavigationBar`.
 */
export const FLOATING_TAB_BAR_HEIGHT = MATERIAL_NAV_BAR_HEIGHT;
export const FLOATING_TAB_BAR_MARGIN = 0;

export function FloatingTabBar(props: BottomTabBarProps) {
  return <MaterialNavigationBar {...props} />;
}