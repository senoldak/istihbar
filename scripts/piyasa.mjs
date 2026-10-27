// Ekonomi kartının verisi (vesaire spec 2026-10-28 §7.3): on satır, değer + günlük + haftalık değişim. Grafik yok.
// Kaynak: Yahoo Finance günlük kapanışlar (anahtarsız chart uç noktası); yanıt vermezse Stooq CSV. Kartta kaynak adı yok.
// Günlük değişim son iki geçerli kapanıştan, haftalık 7 takvim günü önceki son geçerli kapanıştan; değer yoksa satır '—'.

const YAHOO = (s) => `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=1mo&interval=1d`;
const STOOQ = (s) => `https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`;
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; istihbar)' };
const SURE = 10_000; // asılı kalan istek Actions işini (5 dk) durdurmasın
const GUN = 86_400_000;
const ONS_GRAM = 31.1035;

// bicim: değerin karttaki yazımı; birim: değişimin birimi ('%' ya da 'bp').
export const SEMBOLLER = [
  { ad: 'Dolar / TL', yahoo: 'USDTRY=X', stooq: 'usdtry', bicim: (x) => sayi(x, 2) },
  { ad: 'Avro / TL', yahoo: 'EURTRY=X', stooq: 'eurtry', bicim: (x) => sayi(x, 2) },
  { ad: 'Dolar / Yen', yahoo: 'JPY=X', stooq: 'usdjpy', bicim: (x) => sayi(x, 2) },
  { ad: 'Gram altın', turet: 'gram', bicim: (x) => `${sayi(x, 0)} TL` },
  { ad: 'BIST 100', yahoo: 'XU100.IS', stooq: 'xu100', bicim: (x) => sayi(x, 0) },
  { ad: 'Nasdaq 100', yahoo: '^NDX', stooq: '^ndx', bicim: (x) => sayi(x, 0) },
  { ad: 'KOSPI', yahoo: '^KS11', stooq: '^kospi', bicim: (x) => sayi(x, 0) },
  { ad: 'Hang Seng', yahoo: '^HSI', stooq: '^hsi', bicim: (x) => sayi(x, 0) },
  { ad: 'ABD 10 yıllık', yahoo: '^TNX', stooq: '10usy.b', bicim: (x) => `%${sayi(x, 2)}`, birim: 'bp' },
  { ad: 'Brent', yahoo: 'BZ=F', stooq: 'cb.f', bicim: (x) => `$${sayi(x, 2)}` },
];
const ALTIN = { yahoo: 'GC=F', stooq: 'xauusd' };

export function sayi(x, basamak) {
  const [t, o] = x.toFixed(basamak).split('.');
  return t.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (o ? `,${o}` : '');
}

// Seri: [{ t (ms), k (kapanış) }], eskiden yeniye, geçersiz kapanışlar atılmış.
async function yahooSeri(sembol, fetchFn) {
  const r = await fetchFn(YAHOO(sembol), { headers: UA, signal: AbortSignal.timeout(SURE) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const s = (await r.json())?.chart?.result?.[0];
  const t = s?.timestamp ?? [];
  const k = s?.indicators?.quote?.[0]?.close ?? [];
  return t.map((x, i) => ({ t: x * 1000, k: k[i] })).filter((p) => Number.isFinite(p.k));
}
async function stooqSeri(sembol, fetchFn) {
  const r = await fetchFn(STOOQ(sembol), { headers: UA, signal: AbortSignal.timeout(SURE) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.text())
    .trim()
    .split('\n')
    .slice(1)
    .map((l) => l.split(','))
    .map((c) => ({ t: Date.parse(`${c[0]}T00:00:00Z`), k: Number(c[4]) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.k))
    .slice(-31);
}
async function seri(s, fetchFn) {
  try {
    const y = await yahooSeri(s.yahoo, fetchFn);
    if (y.length >= 2) return y;
  } catch {}
  try {
    const q = await stooqSeri(s.stooq, fetchFn);
    if (q.length >= 2) return q;
  } catch {}
  return null;
}

const gunAnahtari = (t) => new Date(t).toISOString().slice(0, 10);
// Gram altın: ons altının her kapanışı, aynı günün (yoksa önceki son) dolar/TL kapanışıyla.
function gramSeri(altin, dolar) {
  if (!altin || !dolar) return null;
  const sonuc = [];
  for (const p of altin) {
    const d = dolar.filter((x) => gunAnahtari(x.t) <= gunAnahtari(p.t)).at(-1);
    if (d) sonuc.push({ t: p.t, k: (p.k * d.k) / ONS_GRAM });
  }
  return sonuc.length >= 2 ? sonuc : null;
}

function degisimler(s, birim) {
  const son = s.at(-1);
  const once = s.at(-2);
  const hafta = s.filter((p) => p.t <= son.t - 7 * GUN).at(-1);
  const fark = (a, b) => (birim === 'bp' ? (a - b) * 100 : ((a - b) / b) * 100);
  return { gunluk: once ? fark(son.k, once.k) : null, haftalik: hafta ? fark(son.k, hafta.k) : null };
}

/** Dönüş: { satirlar: [{ ad, deger, gunluk, haftalik, birim }], eksik }. */
export async function piyasaVerisi(fetchFn = fetch) {
  const seriler = await Promise.all(SEMBOLLER.filter((s) => s.yahoo).map(async (s) => [s.ad, await seri(s, fetchFn)]));
  const harita = new Map(seriler);
  harita.set('Gram altın', gramSeri(await seri(ALTIN, fetchFn), harita.get('Dolar / TL')));
  let eksik = 0;
  const satirlar = SEMBOLLER.map((s) => {
    const sr = harita.get(s.ad);
    const birim = s.birim ?? '%';
    if (!sr) {
      eksik++;
      return { ad: s.ad, deger: '—', gunluk: null, haftalik: null, birim };
    }
    return { ad: s.ad, deger: s.bicim(sr.at(-1).k), ...degisimler(sr, birim), birim };
  });
  return { satirlar, eksik };
}
