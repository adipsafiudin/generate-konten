# ShopeeContent Generator

Aplikasi Next.js untuk membuat draft konten Threads bagi kreator affiliate Shopee. Data produk diisi manual karena short URL affiliate Shopee tidak di-fetch langsung dari browser.

## Fitur

- Form input produk Shopee.
- Generate 2 post Threads: storytelling dan rekomendasi + link.
- API route internal `/api/generate` memakai Groq.
- Tombol salin per post dan salin semua.
- Generate ulang, retry saat gagal, dan history 5 hasil terakhir di `localStorage`.

## Setup

Install dependency:

```bash
npm install
```

Buat file `.env.local` dari contoh:

```bash
cp .env.local.example .env.local
```

Isi API key Groq:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

`GROQ_MODEL` opsional. Jika kosong, aplikasi memakai `llama-3.3-70b-versatile`.

## Menjalankan

```bash
npm run dev
```

Buka `http://localhost:3000`.

## API

`POST /api/generate`

Request:

```json
{
  "shopeeUrl": "https://s.shopee.co.id/xxx",
  "productName": "HAN RIVER Vacuum Cleaner 5-in-1",
  "productPrice": "",
  "productRating": "5.0 bintang",
  "productDesc": "Suction 20000Pa, 5 attachment, ringan",
  "audience": "anak kos, punya hewan peliharaan"
}
```

Response sukses:

```json
{
  "post1": "...",
  "post2": "..."
}
```

Response error:

```json
{
  "error": "Pesan error yang jelas"
}
```

## Catatan

Jangan masukkan API key asli ke repository. Simpan hanya di `.env.local`.
