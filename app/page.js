"use client";

import { useEffect, useMemo, useState } from "react";

const initialForm = {
  shopeeUrl: "",
  productName: "",
  productPrice: "",
  productRating: "",
  productDesc: "",
  audience: ""
};

const loadingMessages = [
  "Menganalisis produk...",
  "Nulis cerita...",
  "Cari hook yang pas...",
  "Hampir selesai..."
];

function Field({ label, name, value, onChange, placeholder, required, multiline }) {
  const baseClass =
    "w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-stone-800">
        {label}
        {required ? <span className="text-orange-600"> *</span> : null}
      </span>
      {multiline ? (
        <textarea
          className={`${baseClass} min-h-24`}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <input
          className={baseClass}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function LoadingState() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % loadingMessages.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="rounded-md border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
        {loadingMessages[index]}
      </div>
    </div>
  );
}

function ResultCard({ title, purpose, content, onCopy }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await onCopy(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Threads</p>
          <h3 className="text-base font-bold text-stone-950">{title}</h3>
          <p className="text-sm text-stone-500">{purpose}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-800 transition hover:border-orange-400 hover:bg-orange-50"
        >
          {copied ? "Tersalin" : "Salin"}
        </button>
      </div>
      <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md bg-stone-950 p-4 font-mono text-sm leading-6 text-stone-50">
        {content}
      </pre>
    </article>
  );
}

function HistoryList({ history, onSelect }) {
  if (!history.length) {
    return null;
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">History</h2>
      <div className="mt-3 grid gap-2">
        {history.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="rounded-md border border-stone-200 px-3 py-2 text-left transition hover:border-teal-500 hover:bg-teal-50"
          >
            <span className="block text-sm font-semibold text-stone-950">{item.productName}</span>
            <span className="block truncate text-xs text-stone-500">{item.shopeeUrl}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [lastForm, setLastForm] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("shopee-content-history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved).slice(0, 5));
      } catch {
        window.localStorage.removeItem("shopee-content-history");
      }
    }
  }, []);

  const canRegenerate = useMemo(() => Boolean(lastForm), [lastForm]);

  function updateHistory(entry) {
    setHistory((current) => {
      const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 5);
      window.localStorage.setItem("shopee-content-history", JSON.stringify(next));
      return next;
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  async function generate(payload) {
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, value.trim()])
    );

    if (!cleanPayload.shopeeUrl || !cleanPayload.productName) {
      setError("Link Shopee dan nama produk wajib diisi.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(cleanPayload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generate gagal. Coba lagi.");
      }

      const entry = {
        id: `${Date.now()}-${cleanPayload.productName}`,
        ...cleanPayload,
        ...data
      };

      setResult(data);
      setLastForm(cleanPayload);
      updateHistory(entry);
    } catch (caughtError) {
      setError(caughtError.message || "Generate gagal. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    generate(form);
  }

  function handleHistorySelect(item) {
    const nextForm = {
      shopeeUrl: item.shopeeUrl,
      productName: item.productName,
      productPrice: item.productPrice,
      productRating: item.productRating,
      productDesc: item.productDesc,
      audience: item.audience
    };

    setForm(nextForm);
    setLastForm(nextForm);
    setResult({ post1: item.post1, post2: item.post2 });
    setError("");
  }

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[430px_1fr] lg:px-8">
      <section className="grid content-start gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-teal-700">
            Shopee Affiliate
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight text-stone-950 sm:text-4xl">
            ShopeeContent Generator
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
            Buat draft Threads yang terasa personal, natural, dan siap dipakai untuk
            storytelling serta link rekomendasi.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
        >
          <Field
            label="Link Affiliate Shopee"
            name="shopeeUrl"
            value={form.shopeeUrl}
            onChange={handleChange}
            placeholder="https://s.shopee.co.id/..."
            required
          />
          <Field
            label="Nama Produk"
            name="productName"
            value={form.productName}
            onChange={handleChange}
            placeholder="HAN RIVER Vacuum Cleaner 5-in-1"
            required
          />
          <Field
            label="Harga (opsional, tidak ditulis)"
            name="productPrice"
            value={form.productPrice}
            onChange={handleChange}
            placeholder="Rp199.000, hanya referensi internal"
          />
          <Field
            label="Rating / Terjual"
            name="productRating"
            value={form.productRating}
            onChange={handleChange}
            placeholder="5.0 bintang, 10rb+ terjual"
          />
          <Field
            label="Deskripsi / Keunggulan"
            name="productDesc"
            value={form.productDesc}
            onChange={handleChange}
            placeholder="Suction 20000Pa, 5 attachment, ringan"
            multiline
          />
          <Field
            label="Target Pembaca"
            name="audience"
            value={form.audience}
            onChange={handleChange}
            placeholder="anak kos, ibu rumah tangga, pemilik hewan"
          />

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:bg-orange-300"
            >
              {isLoading ? "Generating..." : "Generate Konten"}
            </button>
            <button
              type="button"
              disabled={isLoading || !canRegenerate}
              onClick={() => lastForm && generate(lastForm)}
              className="rounded-md border border-stone-300 px-4 py-3 text-sm font-bold text-stone-800 transition hover:border-teal-500 hover:bg-teal-50 disabled:text-stone-400"
            >
              Generate Ulang
            </button>
          </div>

          {error && lastForm ? (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => generate(lastForm)}
              className="rounded-md bg-stone-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-stone-700 disabled:bg-stone-400"
            >
              Retry
            </button>
          ) : null}
        </form>

        <HistoryList history={history} onSelect={handleHistorySelect} />
      </section>

      <section className="grid content-start gap-4">
        {isLoading ? <LoadingState /> : null}

        {result ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div>
                <h2 className="text-lg font-black text-stone-950">Hasil Konten</h2>
                <p className="text-sm text-stone-500">Dua post terpisah untuk Threads.</p>
              </div>
              <button
                type="button"
                onClick={() => copyText(`${result.post1}\n\n---\n\n${result.post2}`)}
                className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800"
              >
                Salin Semua
              </button>
            </div>

            <ResultCard
              title="Post 1 - Storytelling"
              purpose="Engagement tanpa link dan tanpa harga"
              content={result.post1}
              onCopy={copyText}
            />
            <ResultCard
              title="Post 2 - Rekomendasi + Link"
              purpose="Konversi dengan CTA halus"
              content={result.post2}
              onCopy={copyText}
            />
          </>
        ) : (
          <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-stone-300 bg-white/70 p-8 text-center">
            <div>
              <h2 className="text-xl font-black text-stone-950">Draft akan muncul di sini</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
                Isi data produk secara manual, lalu generator akan membuat post storytelling
                dan post rekomendasi yang siap disalin.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
