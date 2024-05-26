# Doku Payment NodeJS

Contoh penggunaan API Doku untuk generate payment url dan check pembayaran berdasarkan nomor invoice dengan teknologi NodeJS

## Dependencies

- **axios**
- **crypto**
- **uuid**

## Cara Penggunaan

Untuk menggunakan proyek ini, ikuti langkah-langkah berikut:

1. **Clone Repository**

   ```bash
   git clone https://github.com/CrunchQuest/API-Payment-Gateway.git
   ```

2. **Masuk Ke Folder**
   Masuk ke direktori proyek yang telah di-clone

   ```bash
   cd ./doku_payment_nodejs/
   ```

3. **Instalasi Dependensi**
   Jalankan perintah berikut untuk menginstal semua dependensi yang diperlukan:

   ```bash
   npm install
   ```

4. **Generate Payment Url**
   Silahkan ganti client_id, secret_key dan jsonBody (terkait detail order)

5. **Cek Payment**
   Silahkan ganti client_id, secret_key dan invoice_number

6. **Using Api**
   Masukkan ini ke body raw Postman

   ```bash
  "orderId": "isi Service Request ID",
  "customerId": "Isi Users ID"
   ```

   Run this link on the postman

   ```bash
   http://localhost:3000/api/getPaymentLink
   ```

## Lisensi

Proyek ini dilisensikan di bawah MIT License.
&copy; Copyright CrunchQuest 2024
