/**
 * Material 3 Expressive — design tokens murni (tidak bergantung warna).
 * Sumber: Material Design 3 shape scale & elevation spec.
 */

/** M3 shape scale (dalam px, dp≈px di RN). Dipakai buat borderRadius komponen Android. */
export const m3Shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  /** M3 Expressive nambahin extraLarge2/3 buat komponen besar (FAB, sheet handle area, dsb) */
  extraLarge2: 32,
  extraLarge3: 36,
  full: 999,
} as const;

export type M3ShapeKey = keyof typeof m3Shape;

/**
 * M3 elevation levels 0–5. `dp` dipakai buat prop `elevation` RN Android
 * (native shadow otomatis dari sistem). `surfaceTintOpacity` dipakai buat
 * overlay tint warna primary di atas surface — teknik asli M3 buat
 * ngasih efek "surface makin naik makin ke-tint warna brand", dipakai
 * di `material3Colors.ts` buat generate tangga `surfaceContainer`.
 */
export const m3Elevation = {
  level0: { dp: 0, surfaceTintOpacity: 0 },
  level1: { dp: 1, surfaceTintOpacity: 0.05 },
  level2: { dp: 3, surfaceTintOpacity: 0.08 },
  level3: { dp: 6, surfaceTintOpacity: 0.11 },
  level4: { dp: 8, surfaceTintOpacity: 0.12 },
  level5: { dp: 12, surfaceTintOpacity: 0.14 },
} as const;

export type M3ElevationKey = keyof typeof m3Elevation;

/** Helper: style object siap-pakai buat `<View style={...}>` di Android (native elevation shadow). */
export function m3ElevationStyle(level: M3ElevationKey) {
  const { dp } = m3Elevation[level];
  return {
    elevation: dp,
    shadowColor: "#000000",
    shadowOpacity: dp === 0 ? 0 : 0.2,
    shadowRadius: dp,
    shadowOffset: { width: 0, height: Math.ceil(dp / 2) },
  } as const;
}

/**
 * M3 Expressive motion — durasi & easing. Dipakai mulai Checkpoint 5
 * (animasi/transisi), disiapkan dari sekarang biar konsisten dari awal.
 */
export const m3Motion = {
  duration: {
    short1: 50,
    short2: 100,
    short3: 150,
    short4: 200,
    medium1: 250,
    medium2: 300,
    medium3: 350,
    medium4: 400,
    long1: 450,
    long2: 500,
    long3: 550,
    long4: 600,
    extraLong1: 700,
    extraLong2: 800,
  },
  easing: {
    standard: [0.2, 0, 0, 1] as [number, number, number, number],
    standardAccelerate: [0.3, 0, 1, 1] as [number, number, number, number],
    standardDecelerate: [0, 0, 0, 1] as [number, number, number, number],
    emphasized: [0.2, 0, 0, 1] as [number, number, number, number],
    emphasizedAccelerate: [0.3, 0, 0.8, 0.15] as [number, number, number, number],
    emphasizedDecelerate: [0.05, 0.7, 0.1, 1] as [number, number, number, number],
  },
} as const;