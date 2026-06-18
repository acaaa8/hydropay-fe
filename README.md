# Hydropay Frontend

Dokumentasi untuk menjalankan *user interface* Hydropay secara lokal dan cara melakukan uji coba (*testing*) transaksi pembayaran.

## Cara Menjalankan Aplikasi Lokal

Karena aplikasi ini dibangun tanpa *bundler* yang rumit (hanya HTML, CSS, dan Javascript murni), cara paling cepat untuk menyajikannya di browser adalah menggunakan web server bawaan dari Python.

1. Buka **Terminal** Anda.
2. Pastikan Anda sedang berada di dalam direktori proyek ini.
3. Jalankan perintah berikut:
   ```bash
   python3 -m http.server 8000
   ```
4. Buka browser kesayangan Anda dan kunjungi: **[http://localhost:8000](http://localhost:8000)**

*(Penting: Pastikan juga Anda sudah menyalakan service backend API Anda di port 3000 agar fitur koneksi database/Midtrans berjalan dengan normal).*

---

## Cara Melakukan Simulasi Pembayaran (Midtrans Sandbox)

Saat sistem sedang terhubung ke lingkungan **Sandbox (Uji Coba)**, QR Code (QRIS) yang dihasilkan oleh Midtrans adalah QR *dummy* (simulasi). **Anda tidak bisa men-scan QR tersebut menggunakan aplikasi *real* di HP Anda seperti GoPay asli atau BRImo, karena pasti akan ditolak.**

Untuk menyimulasikan transaksi sukses, ikuti langkah-langkah berikut:

1. Pada layar frontend Hydropay Anda, pilih pesanan volume air hingga QR Code muncul di layar.
2. Klik kanan pada gambar QR Code tersebut, lalu pilih **"Copy image address"** (Salin alamat gambar) atau salin *link* gambar tersebut. Link ini adalah *endpoint* URL QR resmi dari Midtrans.
3. Buka *tab* baru di browser dan kunjungi alat **[Simulator QRIS Sandbox Midtrans](https://simulator.sandbox.midtrans.com/qris/index)**.
4. Pada Simulator Midtrans, Anda tidak perlu mengunduh gambar. Cukup *Paste* (tempelkan) *link / endpoint* QR yang baru saja Anda salin ke kolom input teks yang disediakan (atau fitur scan dari URL jika tersedia).
5. Setelah QR terbaca oleh simulator, klik tombol **Pay** (Bayar).
6. Proses pembayaran kini tercatat sebagai LUNAS (*Settlement / PAID*) di server Midtrans.
7. Lihat kembali layar frontend Hydropay Anda! Sistem yang sedang melakukan *polling* otomatis akan mendeteksi status "PAID" dan layar akan segera berpindah ke tahap pengisian air (Dispensing).
