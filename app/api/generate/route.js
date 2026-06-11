import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FORBIDDEN_OUTPUT_TERMS = ["aku", "saya", "kamu", "gue", "lo", "harga", "harganya"];

function normalize(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeGeneratedPost(value) {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildPrompt(data) {
  return `Peran: kreator konten perempuan Indonesia yang menulis untuk akun sendiri, bukan untuk brand.
Isi akun fokus pada review produk-produk yang dipakai perempuan dalam keseharian.
Gaya tulisan personal, jujur, observasional, dan tidak pernah terasa seperti iklan.
Tulis seperti orang yang benar-benar sedang cerita setelah nyobain barangnya.
Bahasanya santai-rapi: kayak ngobrol di Threads, bukan artikel, bukan skrip iklan.
Jangan terlalu gaul, tapi jangan kaku.

Buatkan 2 post Threads untuk produk ini:

Nama: ${data.productName}
Harga: JANGAN disebutkan sama sekali. Jangan tulis nominal, kata "harga", atau kata "harganya".
Rating: ${data.productRating || "-"}
Keunggulan: ${data.productDesc || "-"}
Target: ${data.audience || "-"}
Link: ${data.shopeeUrl}

---

ATURAN KETAT:

1. JANGAN pernah referensikan engagement orang lain. Dilarang keras:
   - "banyak yang dm nanya"
   - "yang komen kemarin"
   - "ramai yang nanya"
   - "makanya gue share"
   Konten harus berdiri sendiri dan tetap natural meskipun 0 like, 0 komentar.

2. Anti gaya AI / copywriting:
   - Jangan pakai kalimat pembuka template seperti "pernah nggak sih", "jujur awalnya skeptis", "ini dia", "solusinya", "game changer", "wajib punya", "auto", "worth it banget", "recommended banget"
   - Jangan pakai struktur terlalu rapi: masalah → solusi → benefit → CTA
   - Jangan terdengar seperti review marketplace atau caption brand
   - Jangan terlalu banyak klaim besar, superlatif, atau janji hasil
   - Jangan mengulang nama produk lebih dari 1x per post
   - Jangan pakai bullet, nomor, heading, atau format list
   - Jangan membuat semua baris terdengar seperti punchline
   - Jangan terlalu banyak slang. Pakai bahasa sehari-hari secukupnya
   - Jangan pakai bahasa formal seperti "produk ini sangat membantu", "dapat digunakan untuk", "memiliki kualitas yang baik", "sangat cocok bagi", "memberikan pengalaman"
   - Jangan menutup dengan kalimat kesimpulan kaku seperti "secara keseluruhan" atau "produk ini menjadi pilihan yang tepat"

3. Gaya penulisan:
   - Semua lowercase
   - Jangan pakai kata "aku", "saya", "kamu", "lo", "gue"
   - Pakai pendekatan observasi halus, misalnya "awalnya keliatan biasa aja", "dipakai beberapa hari baru kerasa", "bagian kecil yang ternyata kepake"
   - Boleh pakai subjek impersonal seperti "rasanya", "jadinya", "bagian ini", "dipakainya", "pas dipakai", "kalau lagi..."
   - Kalimat pendek, satu ide satu baris, tapi jangan semua baris sama panjang
   - Jeda baris untuk dramatisasi dan timing
   - Spesifik dan bisa divisualisasikan, bukan generik
   - Terasa seperti catatan personal yang halus, bukan jualan
   - Emoji sparingly, hanya di momen yang pas
   - Bahasa natural: "tuh", "sih", "ga", "nggak", "emang", "udah", "kayak", "agak", "lumayan", "ternyata", "nggak nyangka"
   - Sudut pandang perempuan yang review barang untuk kebutuhan perempuan, tapi jangan karikatural
   - Boleh menyebut konteks perempuan jika relevan: tas, meja makeup, kamar, skincare, rambut, outfit, kerja, kuliah, rumah, atau rutinitas harian
   - Jangan memaksakan kata "cewek", "girls", "bestie", atau vibes terlalu gen z kalau produknya tidak cocok
   - Boleh ada detail kecil yang manusiawi: kebiasaan, keraguan kecil, momen biasa, atau kekurangan ringan
   - Boleh terdengar sedikit tidak sempurna, asal tetap enak dibaca

4. Ritme manusia:
   - Campur kalimat pendek dan sedang
   - Boleh pakai fragmen kalimat seperti "dan ternyata...", "kecil sih, tapi kerasa", "bagian yang paling kepake justru..."
   - Boleh ada 1 kalimat yang terdengar seperti mikir sambil ngetik
   - Sisipkan 1 observasi spesifik yang tidak terdengar generik
   - Sisipkan 1 trade-off kecil kalau relevan, misalnya "bukan yang paling premium, tapi..."
   - Hindari ending yang terlalu manis atau terlalu menjual
   - Jangan terlalu sempurna secara tata bahasa. Natural lebih penting daripada rapi banget

5. POST 1 — storytelling + review (TANPA link, TANPA harga):
   - Hook pertama harus terasa seperti potongan cerita nyata, bukan clickbait
   - Cerita spesifik dan relatable, bukan generik
   - Bangun rasa penasaran soal produknya
   - Akhiri dengan kalimat yang tinggalkan rasa penasaran
     TANPA menjanjikan share di post berikutnya secara eksplisit
   - 6-8 paragraf pendek

6. POST 2 — rekomendasi + link (dipost lain waktu):
   - Mulai natural, bisa berdiri sendiri tanpa baca Post 1
   - CTA halus: "kalau penasaran, linknya di sini" bukan "beli sekarang"
   - Jangan sebut harga, harganya, nominal, murah, mahal, diskon, promo, atau value for money
   - Tutup dengan kalimat yang bikin orang merasa rugi kalau skip,
     tapi tanpa drama berlebihan
   - 3-4 paragraf pendek

7. Kata terlarang di output:
   - "aku"
   - "saya"
   - "kamu"
   - "gue"
   - "lo"
   - "harga"
   - "harganya"

PROSES SEBELUM MENJAWAB:
- Tulis draft pertama.
- Baca ulang diam-diam.
- Kalau ada kalimat yang terasa seperti AI, iklan, template viral, terlalu formal, atau terlalu "jualan", ganti dengan kalimat yang lebih biasa.
- Kalau terdengar seperti artikel/review marketplace, ubah jadi seperti orang sedang cerita ke mutual Threads.
- Kalau masih ada kata terlarang, tulis ulang sampai bersih.
- Pastikan hasil akhir terasa seperti orang Indonesia yang nulis cepat, tapi masih punya taste.

---

PENTING: Kembalikan HANYA JSON valid tanpa markdown, tanpa penjelasan:
{"post1": "isi post 1 dengan \\\\n untuk baris baru", "post2": "isi post 2 dengan \\\\n untuk baris baru"}`;
}

function parseGroqContent(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  if (!parsed || typeof parsed.post1 !== "string" || typeof parsed.post2 !== "string") {
    throw new Error("Format respons AI tidak sesuai.");
  }

  return {
    post1: normalizeGeneratedPost(parsed.post1),
    post2: normalizeGeneratedPost(parsed.post2)
  };
}

function findForbiddenTerms(result) {
  const text = `${result.post1}\n${result.post2}`.toLowerCase();

  return FORBIDDEN_OUTPUT_TERMS.filter((term) => {
    const pattern = new RegExp(`(^|[^a-z0-9_])${term}([^a-z0-9_]|$)`, "i");
    return pattern.test(text);
  });
}

function buildRevisionPrompt(result, terms) {
  return `Revisi JSON berikut agar terdengar lebih halus, natural, dan tidak formal.

Aturan revisi:
- Jangan mengubah tujuan Post 1 dan Post 2.
- Jangan tambah markdown atau penjelasan.
- Jangan pakai kata terlarang ini: ${terms.join(", ")}
- Jangan sebut harga, nominal, murah, mahal, diskon, promo, atau harganya.
- Jangan pakai "aku", "saya", "kamu", "gue", atau "lo".
- Pakai pendekatan observasi halus, bukan ajakan langsung.
- Tetap lowercase.
- Tetap santai-rapi.

JSON yang perlu direvisi:
${JSON.stringify(result)}

Kembalikan HANYA JSON valid:
{"post1": "isi post 1", "post2": "isi post 2"}`;
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body harus berupa JSON valid." }, { status: 400 });
  }

  const data = {
    shopeeUrl: normalize(body.shopeeUrl),
    productName: normalize(body.productName),
    productPrice: normalize(body.productPrice),
    productRating: normalize(body.productRating),
    productDesc: normalize(body.productDesc),
    audience: normalize(body.audience)
  };

  if (!data.shopeeUrl || !data.productName) {
    return NextResponse.json(
      { error: "Link Shopee dan nama produk wajib diisi." },
      { status: 400 }
    );
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY belum diset di .env.local." },
      { status: 500 }
    );
  }

  try {
    const callGroq = async (messages, maxCompletionTokens = 2000) => {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || DEFAULT_MODEL,
          messages,
          temperature: 0.86,
          top_p: 0.9,
          frequency_penalty: 0.35,
          presence_penalty: 0.2,
          max_completion_tokens: maxCompletionTokens,
          response_format: { type: "json_object" }
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload?.error?.message || "Gagal menghubungi Groq. Coba beberapa saat lagi.";
        return { error: message, status: response.status };
      }

      return { content: payload?.choices?.[0]?.message?.content };
    };

    const baseSystemMessage = {
      role: "system",
      content:
        "Tulis konten affiliate natural untuk kreator perempuan Indonesia. Akunnya berisi review produk yang dipakai perempuan dalam keseharian. Prioritaskan rasa manusia, detail konkret, dan bahasa santai-rapi seperti ngobrol di Threads. Output tidak boleh memakai kata aku, saya, kamu, gue, lo, harga, atau harganya. Jangan terdengar seperti AI, brand, artikel, review marketplace, atau copywriter iklan."
    };

    const groqResponse = await callGroq([
      baseSystemMessage,
      {
        role: "user",
        content: buildPrompt(data)
      }
    ]);

    if (groqResponse.error) {
      return NextResponse.json({ error: groqResponse.error }, { status: groqResponse.status });
    }

    if (!groqResponse.content) {
      return NextResponse.json(
        { error: "Groq tidak mengembalikan konten." },
        { status: 502 }
      );
    }

    let parsed = parseGroqContent(groqResponse.content);
    const forbiddenTerms = findForbiddenTerms(parsed);

    if (forbiddenTerms.length) {
      const revisionResponse = await callGroq(
        [
          baseSystemMessage,
          {
            role: "user",
            content: buildRevisionPrompt(parsed, forbiddenTerms)
          }
        ],
        1600
      );

      if (!revisionResponse.error && revisionResponse.content) {
        parsed = parseGroqContent(revisionResponse.content);
      }
    }

    const remainingForbiddenTerms = findForbiddenTerms(parsed);

    if (remainingForbiddenTerms.length) {
      return NextResponse.json(
        {
          error: `AI masih memakai kata yang dihindari: ${remainingForbiddenTerms.join(", ")}. Silakan generate ulang.`
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message =
      error instanceof SyntaxError
        ? "Respons AI bukan JSON valid. Silakan generate ulang."
        : error.message || "Terjadi kesalahan saat generate konten.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
