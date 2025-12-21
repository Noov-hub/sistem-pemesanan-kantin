
# 🏗️ Architectural Decisions & Future Roadmap

> **Catatan untuk Pengembang Selanjutnya:** > Dokumen ini berisi rekam jejak keputusan desain (Architectural Decision Records/ADR) dan panduan pengembangan fitur keamanan di masa depan. Mohon dibaca sebelum melakukan refactoring besar.

## 1. Desain "Open Access" vs. Keamanan Data

### Kondisi Saat Ini
Sistem Kantin FPMIPA saat ini menerapkan kebijakan **Open Access** untuk sisi pelanggan (*Customer Interface*). Pelanggan dapat memesan dan memantau pesanan tanpa perlu *login*, registrasi, atau autentikasi.

### Alasan Desain (Trade-off)
Kami memilih pendekatan ini dengan pertimbangan:
* **User Experience (UX) Frictionless:** Prioritas utama adalah kecepatan. Mahasiswa cenderung enggan menggunakan aplikasi kantin jika harus melalui proses *sign-up* dan *login* yang memakan waktu hanya untuk membeli makan siang.
* **Efisiensi Antrian:** Mengurangi potensi antrian fisik yang disebabkan oleh pelanggan yang lupa password atau masalah teknis saat login.

### Risiko & Mitigasi
* **Risiko:** Transparansi data pesanan. Siapa saja yang memiliki URL monitor dapat melihat status pesanan (meskipun data sensitif pribadi tidak ditampilkan).
* **Rencana Pengembangan (Roadmap):**
    * [ ] Implementasi **Session Token** di `localStorage` browser agar riwayat pesanan hanya persisten di perangkat pengguna.
    * [ ] Opsi **"Login Sukarela"** (Guest vs Registered User) untuk fitur simpan favorit atau riwayat jangka panjang.

## 2. Validasi Input & Autentikasi Modern

### Kondisi Saat Ini
* Pembuatan akun staf (Kasir/Dapur) hanya dapat dilakukan oleh **Admin** melalui *seeding* database atau dashboard internal.
* Validasi input sisi server menggunakan *Parameterized Query* (aman dari SQL Injection), namun validasi konten (sanitasi teks) masih dasar.

### Rencana Pengembangan (To-Do)
Jika sistem ini dibuka untuk pendaftaran publik (Mahasiswa), fitur berikut **WAJIB** diimplementasikan:

#### A. Autentikasi
* [ ] **OAuth 2.0 (Google Login):** Integrasi dengan akun Google/Kampus untuk autentikasi yang aman dan mudah.
* [ ] **Email Verification:** Mencegah pembuatan akun spam.

#### B. Validasi & Keamanan Input
Jika user diizinkan membuat Username sendiri:
* [ ] **Strict Validation:** Gunakan library seperti `express-validator` atau `joi`.
* [ ] **Profanity Filter:** Mencegah penggunaan kata-kata kasar pada nama pemesan/username.
* [ ] **Anti-Impersonation:** Mencegah penggunaan nama seperti "Admin", "System", "Kasir".
* [ ] **Input Sanitization:** Pastikan semua input di-*escape* untuk mencegah XSS (Cross-Site Scripting) pada layar publik (Monitor).
