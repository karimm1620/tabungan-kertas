import React from 'react';
import { Appearance, Pressable, StyleSheet, Text, View } from 'react-native';
import { accentByKey, errorFallbackColors, radius, spacing } from '../theme/colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary WAJIB pakai class component — gak ada versi hook-nya di
 * React. Karena class component gak bisa pakai hook useTheme(), kita baca
 * skema warna langsung lewat Appearance.getColorScheme() (non-reactive,
 * tapi cukup buat fallback screen yang jarang muncul ini).
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDark = Appearance.getColorScheme() === 'dark';
    const colors = isDark ? errorFallbackColors.dark : errorFallbackColors.light;

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.emoji}>😵</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Ada yang gak beres</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Aplikasi mengalami error yang gak terduga. Coba muat ulang — kalau masih
          terjadi, tutup dan buka lagi aplikasinya.
        </Text>
        <Pressable
          onPress={this.handleReset}
          style={[styles.button, { backgroundColor: accentByKey.lavender.deep }]}
          accessibilityRole="button"
          accessibilityLabel="Coba muat ulang aplikasi"
        >
          <Text style={styles.buttonText}>Coba Lagi</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});