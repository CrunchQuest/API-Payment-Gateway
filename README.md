# Doku Payment NodeJS

Contoh penggunaan API Doku untuk menghasilkan URL pembayaran dan memeriksa pembayaran berdasarkan nomor invoice dengan menggunakan teknologi NodeJS.

## Cara Penggunaan

### 1. Clone Repository

```bash
git clone https://github.com/CrunchQuest/API-Payment-Gateway.git
```

### 2. Masuk Ke Folder

Pindah ke direktori proyek yang telah di-clone.

```bash
cd ./doku_payment_nodejs/
```

### 3. Instalasi Dependensi

Jalankan perintah berikut untuk menginstal semua dependensi yang diperlukan:

```bash
npm install
```

### 4. Generate Payment Url

Silakan ganti `client_id`, `secret_key`, dan `jsonBody` (terkait detail order).

### 5. Cek Pembayaran

Silakan ganti `client_id`, `secret_key`, dan `invoice_number`.

### 6. Menggunakan API

Masukkan ini ke dalam body raw Postman:

```json
{
  "orderId": "isi Service Request ID",
  "customerId": "Isi Users ID"
}
```

### 7. Jalankan API

Jalankan tautan ini di Postman:

```bash
http://localhost:3000/api/getPaymentLink
```

## Dependencies

- **axios**
- **crypto**
- **uuid**

## Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT.
&copy; Hak Cipta CrunchQuest 2024


