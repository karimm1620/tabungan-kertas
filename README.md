# Tabungan Kertas

Tabungan Kertas adalah aplikasi sederhana untuk membantu mencatat tabungan berdasarkan target yang ingin dicapai. Kamu bisa membuat beberapa goal, menambahkan gambar atau emoji sebagai ikon, melihat progres tabungan melalui animasi jar, dan mengaktifkan pengingat harian agar lebih konsisten menabung.

Semua data disimpan langsung di perangkat, sehingga aplikasi dapat digunakan sepenuhnya secara offline tanpa perlu akun.

## Download

Download sekarang **[GitHub Releases](../../releases)**.

> Jika muncul peringatan keamanan (Play Protect), pilih **"Install Anyway" / "Tetap Instal"** (ini normal karena aplikasi belum di-publish ke Google Play Store).

## Features

- Membuat goal tabungan dengan target nominal, gambar, atau emoji.
- Visualisasi progres menggunakan animasi jar yang akan terisi sesuai jumlah tabungan.
- Menambah maupun menarik saldo kapan saja dengan riwayat transaksi yang tersimpan.
- Halaman history untuk melihat seluruh aktivitas tabungan.
- Mengurutkan dan memfilter goal berdasarkan kebutuhan.
- Undo setelah menghapus goal agar tidak langsung hilang permanen.
- Mendukung dark mode mengikuti tema perangkat.
- Reminder harian dengan waktu yang bisa diatur.
- Efek glass pada antarmuka (Liquid Glass native di iOS 26+, blur/pastel di platform lain).
- Seluruh data disimpan secara lokal menggunakan AsyncStorage.

## Tech Stack

| Teknologi | Digunakan untuk |
| ---------- | --------------- |
| Expo (React Native) | Framework utama |
| Expo Router | Navigasi |
| TypeScript | Bahasa pemrograman |
| Zustand | State management & persistence |
| AsyncStorage | Penyimpanan data lokal |
| expo-notifications | Reminder harian |
| expo-image-picker | Memilih gambar |
| expo-file-system | Menyimpan gambar |
| expo-glass-effect | Efek glass |
| expo-blur | Fallback glass effect |
| Animated API | Animasi |

## Struktur Project

```text
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    history.tsx
  goal/
    add.tsx
    [id].tsx

src/
  components/
  hooks/
  store/
  theme/
  types/
  utils/
```

## License

[LICENSE](./LICENSE).