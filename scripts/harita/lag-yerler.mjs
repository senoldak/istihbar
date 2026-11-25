// brand/harita/yerler.json üretici (bir kez çalışır). Kaynak: Natural Earth ne_10m_populated_places_simple (kamu malı),
// DBF'den JSON'a çevrilmiş hâli. Kullanım: node scripts/harita/lag-yerler.mjs <yerler-ham.json>
// İller: 81 il merkezi (NE'de "Admin-1 capital" kaydı; yoksa il poligonunun kutu merkezi), Türkçe adla.
// Şehirler: dünya başkentleri, nüfusu ≥ 1 milyon olanlar ve ≥ 250 bin bölge merkezleri (Türkiye hariç), saat dilimiyle (yalnız güvenilir eşleşmede).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const kok = (y) => fileURLToPath(new URL(`../../brand/harita/${y}`, import.meta.url));
const TR = JSON.parse(fs.readFileSync(kok('turkiye.json'), 'utf8'));
const ham = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const sade = (s) =>
  s.toLocaleLowerCase('tr').replace(/[ıi̇]/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

// turkiye.json il adı (sade) → Türkçe yazım. turkiye.json'daki bozuk yazımlar (K. Maras, Kinkkale, Zinguldak) burada düzelir.
const IL_TR = {
  adana: 'Adana', adiyaman: 'Adıyaman', afyonkarahisar: 'Afyonkarahisar', agri: 'Ağrı', aksaray: 'Aksaray', amasya: 'Amasya', ankara: 'Ankara', antalya: 'Antalya', ardahan: 'Ardahan', artvin: 'Artvin', aydin: 'Aydın', balikesir: 'Balıkesir', bartin: 'Bartın', batman: 'Batman', bayburt: 'Bayburt', bilecik: 'Bilecik', bingol: 'Bingöl', bitlis: 'Bitlis', bolu: 'Bolu', burdur: 'Burdur', bursa: 'Bursa', denizli: 'Denizli', diyarbakir: 'Diyarbakır', duzce: 'Düzce', edirne: 'Edirne', elazig: 'Elazığ', erzincan: 'Erzincan', erzurum: 'Erzurum', eskisehir: 'Eskişehir', gaziantep: 'Gaziantep', giresun: 'Giresun', gumushane: 'Gümüşhane', hakkari: 'Hakkari', hatay: 'Hatay', isparta: 'Isparta', istanbul: 'İstanbul', izmir: 'İzmir', igdir: 'Iğdır', 'k maras': 'Kahramanmaraş', karabuk: 'Karabük', karaman: 'Karaman', kars: 'Kars', kastamonu: 'Kastamonu', kayseri: 'Kayseri', kilis: 'Kilis', kinkkale: 'Kırıkkale', kirklareli: 'Kırklareli', kirsehir: 'Kırşehir', kocaeli: 'Kocaeli', konya: 'Konya', kutahya: 'Kütahya', malatya: 'Malatya', manisa: 'Manisa', mardin: 'Mardin', mersin: 'Mersin', mugla: 'Muğla', mus: 'Muş', nevsehir: 'Nevşehir', nigde: 'Niğde', ordu: 'Ordu', osmaniye: 'Osmaniye', rize: 'Rize', sakarya: 'Sakarya', samsun: 'Samsun', sanliurfa: 'Şanlıurfa', siirt: 'Siirt', sinop: 'Sinop', sirnak: 'Şırnak', sivas: 'Sivas', tekirdag: 'Tekirdağ', tokat: 'Tokat', trabzon: 'Trabzon', tunceli: 'Tunceli', usak: 'Uşak', van: 'Van', yalova: 'Yalova', yozgat: 'Yozgat', zinguldak: 'Zonguldak', canakkale: 'Çanakkale', cankiri: 'Çankırı', corum: 'Çorum',
};
// İl merkezinin NE'deki adı il adından farklı olanlar.
const MERKEZ_AD = { hatay: 'antakya', kocaeli: 'izmit', mersin: 'icel', 'k maras': 'kahramanmaras', sakarya: 'sakarya', afyonkarahisar: 'afyon', kinkkale: 'kirikkale', zinguldak: 'zonguldak', igdir: 'igdir' };

const kutuMerkez = (hs) => {
  const r = hs.slice().sort((a, b) => b.length - a.length)[0];
  const xs = r.map((p) => p[0]);
  const ys = r.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};
const nokta = (k) => [Math.round(Number(k.longitude) * 1e4) / 1e4, Math.round(Number(k.latitude) * 1e4) / 1e4];
const trKayit = ham.filter((k) => k.adm0_a3 === 'TUR');

const iller = TR.iller.map((il) => {
  const s = sade(il.ad);
  const ad = IL_TR[s];
  if (!ad) throw new Error(`Türkçe adı yok: ${il.ad}`);
  const aranan = MERKEZ_AD[s] ?? s;
  const k =
    trKayit.find((x) => x.featurecla === 'Admin-1 capital' && sade(x.nameascii) === aranan) ??
    trKayit.find((x) => sade(x.nameascii) === aranan) ??
    trKayit.find((x) => x.featurecla === 'Admin-1 capital' && sade(x.adm1name) === s && sade(x.nameascii) !== 'kilis');
  return { ad, ad_sade: sade(ad), nokta: k ? nokta(k) : kutuMerkez(il.halkalar).map((v) => Math.round(v * 1e4) / 1e4), kaynak: k ? 'ne' : 'poligon' };
});
if (iller.length !== 81) throw new Error(`il sayısı ${iller.length}`);

// Türkçede yerleşik adı farklı olan şehirler (NE nameascii, sade → Türkçe).
const SEHIR_TR = {
  athens: 'Atina', moscow: 'Moskova', cairo: 'Kahire', damascus: 'Şam', tehran: 'Tahran', baghdad: 'Bağdat', jerusalem: 'Kudüs', beirut: 'Beyrut', kiev: 'Kiev', kyiv: 'Kiev', bogota: 'Bogota', warsaw: 'Varşova', vienna: 'Viyana', prague: 'Prag', rome: 'Roma', lisbon: 'Lizbon', london: 'Londra', brussels: 'Brüksel', beijing: 'Pekin', 'new delhi': 'Yeni Delhi', 'mexico city': 'Meksiko', copenhagen: 'Kopenhag', belgrade: 'Belgrad', bucharest: 'Bükreş', sofia: 'Sofya', 'the hague': 'Lahey', geneva: 'Cenevre', munich: 'Münih', cologne: 'Köln', venice: 'Venedik', naples: 'Napoli', milan: 'Milano', florence: 'Floransa', moscow2: 'Moskova', 'saint petersburg': 'St. Petersburg', 'st petersburg': 'St. Petersburg', 'tel aviv-yafo': 'Tel Aviv', 'tel aviv yafo': 'Tel Aviv', aleppo: 'Halep', mecca: 'Mekke', medina: 'Medine', riyadh: 'Riyad', kabul: 'Kabil', tbilisi: 'Tiflis', baku: 'Bakü', yerevan: 'Erivan', tunis: 'Tunus', algiers: 'Cezayir', tripoli: 'Trablus', 'kuwait city': 'Kuveyt', 'panama city': 'Panama', 'washington dc': 'Washington', 'washington d c': 'Washington', 'new york': 'New York', nicosia: 'Lefkoşa', valletta: 'Valletta', stockholm: 'Stockholm', helsinki: 'Helsinki', oslo: 'Oslo', reykjavik: 'Reykjavik', dublin: 'Dublin', amsterdam: 'Amsterdam', paris: 'Paris', berlin: 'Berlin', madrid: 'Madrid', budapest: 'Budapeşte', minsk: 'Minsk', chisinau: 'Kişinev', skopje: 'Üsküp', sarajevo: 'Saraybosna', tirana: 'Tiran', podgorica: 'Podgorica', zagreb: 'Zagreb', ljubljana: 'Ljubljana', bratislava: 'Bratislava', vilnius: 'Vilnius', riga: 'Riga', tallinn: 'Tallinn', amman: 'Amman', doha: 'Doha', 'abu dhabi': 'Abu Dabi', dubai: 'Dubai', muscat: 'Maskat', sanaa: 'Sana', islamabad: 'İslamabad', karachi: 'Karaçi', dhaka: 'Dakka', tashkent: 'Taşkent', astana: 'Astana', bishkek: 'Bişkek', dushanbe: 'Duşanbe', ashgabat: 'Aşkabat', 'ulaanbaatar': 'Ulan Batur', seoul: 'Seul', pyongyang: 'Pyongyang', tokyo: 'Tokyo', hanoi: 'Hanoi', bangkok: 'Bangkok', 'kuala lumpur': 'Kuala Lumpur', singapore: 'Singapur', jakarta: 'Cakarta', manila: 'Manila', canberra: 'Canberra', wellington: 'Wellington', ottawa: 'Ottawa', havana: 'Havana', caracas: 'Karakas', lima: 'Lima', santiago: 'Santiago', 'buenos aires': 'Buenos Aires', brasilia: 'Brasilia', 'rio de janeiro': 'Rio de Janeiro', 'sao paulo': 'São Paulo', montevideo: 'Montevideo', asuncion: 'Asunción', 'la paz': 'La Paz', quito: 'Quito', khartoum: 'Hartum', 'addis ababa': 'Addis Ababa', nairobi: 'Nairobi', lagos: 'Lagos', abuja: 'Abuja', rabat: 'Rabat', casablanca: 'Kazablanka', kinshasa: 'Kinşasa', mogadishu: 'Mogadişu', pretoria: 'Pretorya', 'cape town': 'Cape Town', johannesburg: 'Johannesburg',
};

// Saat dilimi: önce IANA adının şehir kısmı (America/Bogota → bogota); yoksa ülke tek dilimliyse başkentinki.
// Birden çok dilimli ülkelerde başkent yedeği kullanılmaz (yerel saat yanlış olmasın; kartta TSİ kalır).
const COK_DILIMLI = new Set(['USA', 'CAN', 'RUS', 'BRA', 'AUS', 'MEX', 'IDN', 'KAZ', 'COD', 'CHL', 'ECU', 'ESP', 'PRT', 'NZL', 'FRA', 'KIR', 'FSM', 'MNG', 'GRL', 'DNK', 'PNG', 'ATA', 'UMI', 'NLD', 'GBR', 'NOR', 'ARG']);
const dilimler = new Map();
for (const z of Intl.supportedValuesOf('timeZone')) {
  const sehir = sade(z.split('/').at(-1).replace(/_/g, ' '));
  if (!dilimler.has(sehir)) dilimler.set(sehir, z);
}
const baskent = new Map(ham.filter((k) => k.featurecla === 'Admin-0 capital').map((k) => [k.adm0_a3, k]));

const sehirler = ham
  .filter((k) => k.adm0_a3 !== 'TUR' && (k.featurecla === 'Admin-0 capital' || Number(k.pop_max) >= 1_000_000 || (k.featurecla === 'Admin-1 capital' && Number(k.pop_max) >= 250_000)))
  .map((k) => {
    const s = sade(k.nameascii);
    const kendi = dilimler.get(s) ?? null;
    const bk = baskent.get(k.adm0_a3);
    const yedek = !COK_DILIMLI.has(k.adm0_a3) && bk ? dilimler.get(sade(bk.nameascii)) ?? null : null;
    const ad = SEHIR_TR[s] ?? k.name;
    return { ad, ad_sade: sade(ad), ad_ham: s, ulke: k.adm0_a3, nokta: nokta(k), nufus: Number(k.pop_max), baskent: k.featurecla === 'Admin-0 capital', saatDilimi: COK_DILIMLI.has(k.adm0_a3) ? kendi : kendi ?? yedek };
  });

fs.writeFileSync(kok('yerler.json'), JSON.stringify({ kaynak: 'Natural Earth 1:10m populated places (kamu malı)', iller, sehirler }));
console.log(`iller ${iller.length} (poligondan ${iller.filter((i) => i.kaynak === 'poligon').length}), şehirler ${sehirler.length}, saat dilimli ${sehirler.filter((s) => s.saatDilimi).length}`);
