# Dokumentasi Struktur Folder dan File Backend Lapor AA

Berikut adalah penjelasan lengkap mengenai struktur folder dan file pada proyek backend Lapor AA. Dokumentasi ini menggunakan bahasa Indonesia dan bertujuan untuk memberikan gambaran menyeluruh tentang fungsi dan hubungan antar bagian dalam proyek.

---

## Struktur Folder Utama

```
backend-lapor-AA/
├── app.js
├── config/
├── controllers/
├── middlewares/
├── models/
├── repositories/
├── routes/
├── services/
│   ├── components/
│   └── responseMessage/
├── utils/
├── public/
│   ├── assets/
│   └── uploads/
├── logs/
├── package.json
├── package-lock.json
└── README.md
```

---

## Penjelasan Folder dan File

### 1. `app.js`
File utama untuk menjalankan aplikasi Express.js. Mengatur middleware global, routing, dan konfigurasi server.

### 2. `config/`
Folder berisi konfigurasi aplikasi, seperti database, environment variables, dan konfigurasi server.

- `database.js` : Konfigurasi koneksi database MongoDB.
- `environment.js` : Variabel lingkungan (environment variables).
- `server.js` : Konfigurasi server Express.

### 3. `controllers/`
Berisi file yang mengatur logika pengendalian (controller) untuk berbagai endpoint API.

- `botController.js` : Mengelola pesan masuk dari WhatsApp dan mengarahkan ke service yang sesuai.
- `dashboardController.js` : Mengelola data untuk dashboard, seperti statistik laporan.
- `messageController.js` : Mengatur pengiriman pesan WhatsApp dan pengelolaan media.
- `webhookController.js` dan `webhookVerification.js` : Mengelola webhook untuk integrasi dengan WhatsApp API.

### 4. `middlewares/`
Berisi middleware Express, seperti autentikasi dan otorisasi.

- `authMiddleware.js` : Middleware untuk memeriksa token JWT dan mengamankan endpoint.

### 5. `models/`
Berisi definisi skema Mongoose untuk koleksi MongoDB.

- `UserProfile.js` : Skema data profil pengguna.
- `UserLogin.js` : Skema data login pengguna.
- `UserSession.js` : Skema sesi pengguna untuk manajemen state.
- `Report.js` : Skema laporan yang dibuat oleh pengguna.
- `Tindakan.js` : Skema tindakan atau tindak lanjut dari laporan.
- `messageModel.js` : Skema penyimpanan pesan WhatsApp.

### 6. `repositories/`
Berisi lapisan akses data (data access layer) yang berinteraksi langsung dengan model.

- `userRepo.js` : Operasi CRUD untuk data pengguna.
- `userProfileRepo.js` : Operasi CRUD untuk profil pengguna.
- `userLoginRepo.js` : Operasi login pengguna.
- `userSessionRepo.js` : Manajemen sesi pengguna.
- `reportRepo.js` : Operasi CRUD untuk laporan.
- `tindakanRepo.js` : Operasi CRUD untuk tindakan laporan.
- Repositori lain seperti `distribusiRepo.js`, `efisiensiRepo.js`, dll untuk fitur statistik dan analitik.

### 7. `routes/`
Berisi definisi routing API Express.

- `userRoutes.js` : Routing untuk operasi pengguna.
- `reportRoutes.js` : Routing untuk operasi laporan.
- `tindakanRoutes.js` : Routing untuk operasi tindakan laporan.
- `messageRoutes.js` : Routing untuk pengiriman pesan.
- `webhookRoutes.js` : Routing webhook WhatsApp.

### 8. `services/`
Berisi logika bisnis utama aplikasi.

- `botFlowService.js` : Pengatur alur percakapan WhatsApp bot.
- `components/` : Modul-modul handler untuk berbagai bagian alur bot, seperti:
  - `signupHandler.js` : Penanganan pendaftaran pengguna.
  - `createReportHandler.js` : Penanganan pembuatan laporan.
  - `checkReportHandler.js` : Penanganan pengecekan status laporan.
  - `mainMenuHandler.js` : Penanganan menu utama bot.
  - `spamHandler.js` : Penanganan deteksi dan pencegahan spam.
- `responseMessage/` : Berisi template dan fungsi pesan balasan untuk berbagai skenario bot.

### 9. `utils/`
Berisi utilitas dan helper functions yang digunakan di berbagai bagian aplikasi.

- Contoh: `generateSessionId.js`, `findWilayahFromPoint.js`, `imageHelper.js`, dll.

### 10. `public/`
Folder untuk file statis yang dapat diakses publik.

- `assets/` : Gambar dan aset statis lainnya.
- `uploads/` : File yang diupload oleh pengguna, seperti foto laporan.

### 11. `logs/`
Folder untuk menyimpan file log aplikasi.

---

## Alur Kerja Utama

1. **Pesan WhatsApp masuk** diterima oleh `botController.js`.
2. Pesan diteruskan ke `botFlowService.js` yang mengatur alur percakapan sesuai sesi pengguna.
3. Handler spesifik di `services/components/` mengelola langkah-langkah seperti pendaftaran, pembuatan laporan, dan pengecekan laporan.
4. Data disimpan dan diambil melalui `repositories/` yang berinteraksi dengan `models/`.
5. Pesan balasan dikirim melalui `messageController.js` menggunakan WhatsApp API.
6. Status laporan dan tindak lanjut dikelola melalui `routes/tindakanRoutes.js` dan `routes/reportRoutes.js`.
7. Dashboard dan statistik dihasilkan oleh `controllers/dashboardController.js` dan layanan terkait.

---

## Catatan

- Struktur ini mengikuti pola MVC (Model-View-Controller) dengan tambahan service layer untuk logika bisnis.
- Penggunaan session pada `userSession` untuk mengelola state percakapan WhatsApp.
- Penanganan spam terpusat di `spamHandler.js` untuk menjaga kualitas interaksi bot.
- Pesan balasan menggunakan template yang terorganisir di folder `responseMessage`.

---

Dokumentasi ini dapat diperbarui sesuai perkembangan proyek. Jika ada pertanyaan atau butuh penjelasan lebih lanjut, silakan hubungi tim pengembang.
