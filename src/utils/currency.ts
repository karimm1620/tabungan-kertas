const formatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function formatIDR(amount: number): string {
  return formatter.format(Math.max(0, Math.round(amount)));
}

/** Format angka polos dengan pemisah ribuan, buat ditampilkan di input field */
export function formatThousands(value: string): string {
  const digitsOnly = value.replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digitsOnly));
}

export function parseThousands(value: string): number {
  const digitsOnly = value.replace(/[^0-9]/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
}

export function clampPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, current / target));
}
