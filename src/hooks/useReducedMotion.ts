import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Baca setting aksesibilitas "Kurangi gerakan" / "Reduce Motion" dari OS
 * (Settings > Accessibility di iOS & Android). Dipakai buat mempersingkat
 * atau nge-skip animasi non-esensial bagi user yang sensitif terhadap
 * motion (motion sickness, vestibular disorder, dll) — sebelumnya app ini
 * SAMA SEKALI gak menghormati setting ini di komponen animasi manapun.
 *
 * Reaktif: kalau user ganti setting ini saat app lagi jalan (tanpa restart),
 * komponen yang pakai hook ini otomatis ikut update.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value) => setReduced(value),
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}