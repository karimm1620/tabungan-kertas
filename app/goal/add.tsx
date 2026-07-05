import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppAlert } from "../../src/components/AppAlert";
import { EmojiPicker } from "../../src/components/EmojiPicker";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { accentByKey, radius, spacing } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/useTheme";
import { formatThousands, parseThousands } from "../../src/utils/currency";
import {
  ImagePermissionDeniedError,
  pickGoalImage,
} from "../../src/utils/imageStorage";

export default function AddGoalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { colors, typography, isDark } = useTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();

  const goal = useGoalsStore((state) =>
    id ? state.getGoalById(id) : undefined,
  );
  const addGoal = useGoalsStore((state) => state.addGoal);
  const updateGoal = useGoalsStore((state) => state.updateGoal);

  const [name, setName] = useState("");
  const [targetDisplay, setTargetDisplay] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [emoji, setEmoji] = useState<string | undefined>("🎯");
  const [pickerBusy, setPickerBusy] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetDisplay(formatThousands(String(goal.targetAmount)));
      setImageUri(goal.imageUri);
      setEmoji(goal.emoji ?? "🎯");
    }
  }, [goal]);

  const handlePickImage = async () => {
    setPickerBusy(true);
    try {
      const uri = await pickGoalImage();
      if (uri) {
        setImageUri(uri);
      }
    } catch (error) {
      if (error instanceof ImagePermissionDeniedError) {
        showAlert(
          "Izin diperlukan",
          "Aplikasi butuh akses galeri untuk memilih gambar goal. Aktifkan izin di pengaturan device.",
        );
      } else {
        showAlert("Gagal memilih gambar", "Coba lagi beberapa saat lagi.");
      }
    } finally {
      setPickerBusy(false);
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const amount = parseThousands(targetDisplay);

    if (!trimmedName) {
      showAlert("Nama goal kosong", "Kasih nama dulu buat goal tabunganmu.");
      return;
    }
    if (amount <= 0) {
      showAlert(
        "Target belum diisi",
        "Masukkan target nominal yang mau dicapai.",
      );
      return;
    }

    if (isEditMode && id) {
      updateGoal(id, {
        name: trimmedName,
        targetAmount: amount,
        imageUri,
        emoji,
      });
    } else {
      addGoal({ name: trimmedName, targetAmount: amount, imageUri, emoji });
    }
    router.back();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
        },
        label: {
          ...typography.label,
          marginBottom: spacing.sm,
          marginTop: spacing.lg,
        },
        imageRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        imagePicker: {
          width: 88,
          height: 88,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1.5,
          borderColor: colors.glassBorder,
          borderStyle: "dashed",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        imagePreview: {
          width: "100%",
          height: "100%",
        },
        imagePickerText: {
          ...typography.caption,
          textAlign: "center",
        },
        removeImageBtn: {
          marginLeft: spacing.md,
        },
        removeImageText: {
          ...typography.caption,
          color: accentByKey.rose.deep,
        },
        input: {
          ...typography.body,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderWidth: 1,
          borderColor: colors.glassBorder,
        },
        currencyInputWrap: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          paddingHorizontal: spacing.md,
        },
        currencyPrefix: {
          ...typography.subtitle,
          color: colors.textSecondary,
          marginRight: spacing.xs,
        },
        currencyInput: {
          ...typography.amount,
          flex: 1,
          paddingVertical: spacing.md,
        },
        saveButton: {
          marginTop: spacing.xl,
          backgroundColor: accentByKey.lavender.deep,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          alignItems: "center",
        },
        saveButtonText: {
          ...typography.subtitle,
          color: colors.textInverse,
        },
      }),
    [colors, typography],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      key={isDark ? "dark" : "light"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>Gambar / Ikon</Text>
        <View style={styles.imageRow}>
          <Pressable
            onPress={handlePickImage}
            disabled={pickerBusy}
            style={styles.imagePicker}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <Text style={styles.imagePickerText}>
                {pickerBusy ? "..." : "📷\nUpload"}
              </Text>
            )}
          </Pressable>
          {imageUri ? (
            <Pressable
              onPress={() => setImageUri(undefined)}
              style={styles.removeImageBtn}
            >
              <Text style={styles.removeImageText}>
                Hapus gambar, pakai emoji
              </Text>
            </Pressable>
          ) : null}
        </View>

        {!imageUri && (
          <>
            <Text style={styles.label}>Atau pilih emoji</Text>
            <EmojiPicker selected={emoji} onSelect={setEmoji} />
          </>
        )}

        <Text style={styles.label}>Nama Goal</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Misal: iPhone 17, Liburan ke Bali"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>Target Nominal</Text>
        <View style={styles.currencyInputWrap}>
          <Text style={styles.currencyPrefix}>Rp</Text>
          <TextInput
            value={targetDisplay}
            onChangeText={(text) => setTargetDisplay(formatThousands(text))}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            style={styles.currencyInput}
          />
        </View>

        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>
            {isEditMode ? "Simpan Perubahan" : "Buat Goal"}
          </Text>
        </Pressable>
      </ScrollView>

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </KeyboardAvoidingView>
  );
}
