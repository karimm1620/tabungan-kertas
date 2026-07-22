const fontFamily = "sans-serif";
const fontFamilyMedium = "sans-serif-medium";

/**
 * Full M3 type scale (15 role resmi dari spec Material Design 3).
 * Disiapkan dari Checkpoint 1 walau baru dipakai sebagian sekarang —
 * checkpoint navigasi/komponen baru (nav label, FAB, bottom sheet, chip)
 * bakal butuh role yang gak ada di skema lama app ini (typography.ts lama
 * cuma punya 7 role custom).
 */
export function buildM3FullTypeScale(onSurface: string, onSurfaceVariant: string) {
  return {
    displayLarge: { fontFamily, fontSize: 57, lineHeight: 64, fontWeight: "400" as const, letterSpacing: -0.25, color: onSurface },
    displayMedium: { fontFamily, fontSize: 45, lineHeight: 52, fontWeight: "400" as const, letterSpacing: 0, color: onSurface },
    displaySmall: { fontFamily, fontSize: 36, lineHeight: 44, fontWeight: "400" as const, letterSpacing: 0, color: onSurface },

    headlineLarge: { fontFamily, fontSize: 32, lineHeight: 40, fontWeight: "400" as const, letterSpacing: 0, color: onSurface },
    headlineMedium: { fontFamily, fontSize: 28, lineHeight: 36, fontWeight: "700" as const, letterSpacing: -0.3, color: onSurface },
    headlineSmall: { fontFamily, fontSize: 24, lineHeight: 32, fontWeight: "700" as const, letterSpacing: 0, color: onSurface },

    titleLarge: { fontFamily: fontFamilyMedium, fontSize: 22, lineHeight: 28, letterSpacing: 0, color: onSurface },
    titleMedium: { fontFamily: fontFamilyMedium, fontSize: 16, lineHeight: 24, letterSpacing: 0.15, color: onSurface },
    titleSmall: { fontFamily: fontFamilyMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.1, color: onSurface },

    bodyLarge: { fontFamily, fontSize: 16, lineHeight: 24, fontWeight: "400" as const, letterSpacing: 0.5, color: onSurface },
    bodyMedium: { fontFamily, fontSize: 14, lineHeight: 20, fontWeight: "400" as const, letterSpacing: 0.25, color: onSurface },
    bodySmall: { fontFamily, fontSize: 12, lineHeight: 16, fontWeight: "400" as const, letterSpacing: 0.4, color: onSurfaceVariant },

    labelLarge: { fontFamily: fontFamilyMedium, fontSize: 14, lineHeight: 20, letterSpacing: 0.1, color: onSurface },
    labelMedium: { fontFamily: fontFamilyMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.5, color: onSurfaceVariant },
    labelSmall: { fontFamily: fontFamilyMedium, fontSize: 11, lineHeight: 16, letterSpacing: 0.5, color: onSurfaceVariant },
  };
}

export type M3FullTypeScale = ReturnType<typeof buildM3FullTypeScale>;

/**
 * Mapping ke 7 role semantik yang UDAH DIPAKAI di seluruh komponen app ini
 * (display/title/subtitle/body/caption/label/amount) — supaya di Checkpoint 1
 * ini gak ada satupun komponen yang perlu diubah kodenya.
 */
function buildTypographyFromScale(scale: M3FullTypeScale) {
  return {
    display: scale.headlineMedium,
    title: scale.titleLarge,
    subtitle: scale.titleMedium,
    body: scale.bodyMedium,
    caption: scale.bodySmall,
    label: { ...scale.labelMedium, textTransform: "uppercase" as const },
    amount: scale.headlineSmall,
  };
}

/**
 * 7 role semantik yang dipakai di seluruh komponen app ini
 * (display/title/subtitle/body/caption/label/amount) — mapping dari full
 * M3 type scale di atas. Satu-satunya sumber tipe `Typography` sekarang
 * (dulu ada versi terpisah di `theme/typography.ts` buat iOS, sudah
 * dihapus di Checkpoint 0 — lihat ui-registry.md).
 */
export type Typography = ReturnType<typeof buildTypographyFromScale>;

export function buildMaterial3Typography(
  textPrimary: string,
  textSecondary: string,
): Typography {
  const scale = buildM3FullTypeScale(textPrimary, textSecondary);
  return buildTypographyFromScale(scale);
}