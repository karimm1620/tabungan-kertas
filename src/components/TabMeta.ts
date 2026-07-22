import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type React from "react";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface TabMetaEntry {
  icon: IconName;
  /** Dipakai pas tab AKTIF — kalau gak diisi, `icon` dipakai buat dua-duanya (cuma beda warna). */
  iconActive?: IconName;
  label: string;
}

export const TAB_META: Record<string, TabMetaEntry> = {
  index: { icon: "calendar-check-outline", iconActive: "calendar-check", label: "Today" },
  goals: { icon: "target", label: "Goals" },
  history: { icon: "history", label: "History" },
  settings: { icon: "cog-outline", iconActive: "cog", label: "Settings" },
};