import { useEffect, useState } from 'react';
import {
  Cloud, CloudRain, CloudSnow, CloudSun, Calendar, Clock, MapPin, RefreshCw, BookOpen, Wind,
  FileText, BookMarked, Library, Sun, Zap,
} from 'lucide-react';
import { weatherVisual } from '../lib/visuals';
import BrandLogo from './BrandLogo';
import type { ScienceItem, Settlement, WorldSnapshot } from '../lib/worldData';
import { formatWindPair, SCIENCE_KIND_LABEL } from '../lib/worldData';

type ThemeClasses = {
  bg: string;
  text: string;
  textMuted: string;
  ring: string;
  lightBg: string;
  lightBgMuted: string;
  surfaceTint: string;
};

type Props = {
  darkMode: boolean;
  activeTheme: ThemeClasses;
  settlement: Settlement | null;
  locationQuery: string;
  searchResults: Settlement[];
  searching: boolean;
  world: WorldSnapshot | null;
  loadingWorld: boolean;
  onLocationQueryChange: (q: string) => void;
  onSelectSettlement: (s: Settlement) => void;
  onRefresh: () => void;
  onScienceBrief: () => void;
  scienceBrief: string;
  loadingBrief: boolean;
};

export default function SmartHubPanel({
  darkMode,
  activeTheme,
  settlement,
  locationQuery,
  searchResults,
  searching,
  world,
  loadingWorld,
  onLocationQueryChange,
  onSelectSettlement,
  onRefresh,
  onScienceBrief,
  scienceBrief,
  loadingBrief,
}: Props) {
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  useEffect(() => {
    const first = world?.scienceTopics?.[0]?.field;
    if (first) setOpenTopic(first);
  }, [world?.fetchedAt]);

  const card = darkMode
    ? 'bg-slate-800/50 border-slate-700/60'
    : 'bg-white border-slate-100';

  const kindStyle: Record<ScienceItem['kind'], string> = {
    makale: `${activeTheme.lightBg} ${activeTheme.text} dark:bg-slate-800/50 dark:text-slate-200`,
    kitap: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    yayin: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  };

  const renderScienceList = (items: ScienceItem[], emptyLabel: string) => {
    if (items.length === 0) {
      return <p className="text-[10px] text-slate-400 italic py-1">{emptyLabel}</p>;
    }
    return (
      <ul className="space-y-2.5">
        {items.map((s) => (
          <li key={s.id} className="border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${kindStyle[s.kind]}`}>
                {SCIENCE_KIND_LABEL[s.kind]}
              </span>
              <span className="text-[9px] text-slate-400">{s.date}</span>
            </div>
            <p className="font-bold leading-snug">{s.title}</p>
            <p className="text-slate-500 mt-1 line-clamp-3 leading-relaxed">{s.summary}</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {s.source}
              {s.authors ? ` · ${s.authors}` : ''}
            </p>
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[10px] ${activeTheme.textMuted} hover:underline inline-block mt-0.5`}
              >
                Kaynağı aç
              </a>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`p-6 rounded-2xl border shadow-sm ${card}`}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <BrandLogo size={22} variant="mark" />
              Zeka Merkezi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Saatlik hava, namaz vakitleri, takvim ve güncel bilim — ücretsiz açık kaynaklarla otomatik güncellenir.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={!settlement || loadingWorld}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-bold text-white ${activeTheme.bg} disabled:opacity-50`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingWorld ? 'animate-spin' : ''}`} />
            Verileri Yenile
          </button>
        </div>

        <div className="relative mb-4">
          <label htmlFor="location-search" className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
            Yerleşim yeri (ilçe, belde, köy)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="location-search"
                type="text"
                value={locationQuery}
                onChange={(e) => onLocationQueryChange(e.target.value)}
                placeholder="Örn: Kadıköy, Merkez, Çankaya, Urla..."
                className={`w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
          </div>
          {searching && (
            <p className="text-[10px] text-slate-400 mt-1">Konum aranıyor…</p>
          )}
          {searchResults.length > 0 && (
            <ul className={`mt-2 rounded-xl border overflow-hidden max-h-48 overflow-y-auto ${
              darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
            }`}>
              {searchResults.map((s) => (
                <li key={`${s.lat}-${s.lon}-${s.name}`}>
                  <button
                    type="button"
                    onClick={() => onSelectSettlement(s)}
                    className={`w-full text-left text-xs px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      settlement?.lat === s.lat && settlement?.lon === s.lon ? activeTheme.lightBg : ''
                    }`}
                  >
                    <span className="font-bold">{s.displayName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {settlement && (
          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
            Aktif konum: {settlement.displayName}
            {world && (
              <span className="text-slate-400 ml-2">
                (Son güncelleme: {new Date(world.fetchedAt).toLocaleTimeString('tr-TR')})
              </span>
            )}
          </p>
        )}
      </div>

      {!world && !loadingWorld && (
        <p className="text-sm text-slate-500 text-center py-8">
          Başlamak için yukarıdan yerleşim yeri seçin.
        </p>
      )}

      {loadingWorld && (
        <p className="text-sm text-slate-500 text-center py-8">
          Zeka Merkezi verileri yükleniyor… Bilim akışı küresel kaynaklardan çekilip Türkçeye çevriliyor; bu biraz sürebilir.
        </p>
      )}

      {world && !loadingWorld && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-5 rounded-2xl border ${card}`}>
            <h3 className="font-extrabold text-sm flex items-center gap-2 mb-3">
              <Cloud className={activeTheme.text} />
              Saatlik Hava Durumu
            </h3>
            <p className="text-2xl font-black mb-1">
              {world.currentTemp ?? '—'}°C
              <span className="text-xs font-normal text-slate-400 ml-2">{world.weather[0]?.label}</span>
            </p>
            {(() => {
              const now = world.weather[0];
              const wind = now ? formatWindPair(now.windSpeedMs) : null;
              const gust = now ? formatWindPair(now.windGustMs) : null;
              if (!wind) return null;
              return (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <Wind className="h-3.5 w-3.5" />
                    Rüzgar: {wind.ms} m/s · {wind.kmh} km/sa
                  </span>
                  {gust && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Ani: {gust.ms} m/s · {gust.kmh} km/sa
                    </span>
                  )}
                </p>
              );
            })()}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {world.weather.map((h) => {
                const wind = formatWindPair(h.windSpeedMs);
                const gust = formatWindPair(h.windGustMs);
                const wx = weatherVisual(h.label);
                const WxIcon = wx.icon === 'sun' ? Sun
                  : wx.icon === 'rain' ? CloudRain
                    : wx.icon === 'snow' ? CloudSnow
                      : wx.icon === 'storm' ? Zap
                        : wx.icon === 'wind' ? Wind
                          : CloudSun;
                return (
                  <div
                    key={h.time}
                    className={`flex-shrink-0 min-w-[92px] text-center p-2.5 rounded-xl border text-[10px] transition-shadow hover:shadow-md ${
                      darkMode ? 'border-slate-700' : 'border-slate-100'
                    } ${wx.tileBg}`}
                  >
                    <p className="font-bold">{h.hourLabel}</p>
                    <WxIcon className={`h-5 w-5 mx-auto my-1.5 ${wx.accent}`} />
                    <p className="text-sm font-extrabold">{h.temp}°</p>
                    <p className="text-slate-400 truncate text-[9px]">{h.label}</p>
                    {wind && (
                      <p className="text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        <Wind className="h-3 w-3 inline-block mr-0.5" />
                        {wind.ms} m/s
                        <br />
                        {wind.kmh} km/sa
                      </p>
                    )}
                    {gust && (
                      <p className="text-amber-600 dark:text-amber-400 font-bold mt-0.5 leading-tight">
                        Ani {gust.ms} m/s
                        <br />
                        {gust.kmh} km/sa
                      </p>
                    )}
                    {h.precipProb > 30 && (
                      <p className="text-sky-500 flex items-center justify-center gap-0.5 mt-1">
                        <CloudRain className="h-3 w-3" />
                        %{h.precipProb}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${card}`}>
            <h3 className="font-extrabold text-sm flex items-center gap-2 mb-3">
              <Clock className={activeTheme.text} />
              Namaz Vakitleri (Diyanet)
            </h3>
            <p className="text-[10px] text-slate-400 mb-3">{world.prayer.date} · Hicri: {world.prayer.hijriDate}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['İmsak', world.prayer.imsak],
                ['Güneş', world.prayer.gunes],
                ['Öğle', world.prayer.ogle],
                ['İkindi', world.prayer.ikindi],
                ['Akşam', world.prayer.aksam],
                ['Yatsı', world.prayer.yatsi],
              ].map(([label, time]) => (
                <div
                  key={label}
                  className={`px-3 py-2 rounded-lg border ${
                    world.prayer.nextPrayer.startsWith(label as string)
                      ? `${activeTheme.lightBg} border-transparent font-bold`
                      : darkMode
                        ? 'border-slate-700'
                        : 'border-slate-100'
                  }`}
                >
                  <span className="text-slate-400 text-[10px] block">{label}</span>
                  {time}
                </div>
              ))}
            </div>
            <p className={`text-[10px] mt-3 ${activeTheme.textMuted} font-bold`}>
              Sıradaki: {world.prayer.nextPrayer} — {world.prayer.nextPrayerTime}
            </p>
          </div>

          <div className={`p-5 rounded-2xl border ${card}`}>
            <h3 className="font-extrabold text-sm flex items-center gap-2 mb-3">
              <Calendar className={activeTheme.text} />
              Takvim & Etkinlikler
            </h3>
            <p className="text-sm font-bold">{world.calendar.dayName}</p>
            <p className="text-xs text-slate-500">{world.calendar.gregorianDate}</p>
            <p className="text-xs text-slate-500 mt-1">Hicri: {world.calendar.hijriDate || world.prayer.hijriDate}</p>
            {world.calendar.yksCountdownDays != null && (
              <p className="text-xs font-bold text-rose-500 mt-2">
                YKS&apos;ye yaklaşık {world.calendar.yksCountdownDays} gün
              </p>
            )}
            <ul className="mt-3 space-y-1.5 text-xs">
              {world.calendar.upcomingEvents.map((e) => (
                <li key={`${e.date}-${e.title}`} className="flex justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                  <span>{e.title}</span>
                  <span className="text-slate-400 shrink-0">{e.date}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`p-5 rounded-2xl border lg:col-span-2 ${card}`}>
            <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <BookOpen className={activeTheme.text} />
                  Güncel Bilim Akışı
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  Dünya genelinden OpenAlex ile anlık makale, kitap ve yayınlar — başlık ve özetler Türkçeye çevrilir.
                </p>
              </div>
              <button
                type="button"
                onClick={onScienceBrief}
                disabled={loadingBrief}
                className="text-[10px] font-bold px-2 py-1 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 shrink-0"
              >
                {loadingBrief ? 'Hazırlanıyor…' : 'AI Özet'}
              </button>
            </div>

            <div className="space-y-2 max-h-[28rem] overflow-y-auto scrollbar-thin text-xs pr-1">
              {(world.scienceTopics ?? []).map((topic) => {
                const total = topic.articles.length + topic.books.length + topic.publications.length;
                const isOpen = openTopic === topic.field;
                return (
                  <div
                    key={topic.field}
                    className={`rounded-xl border overflow-hidden ${
                      darkMode ? 'border-slate-700' : 'border-slate-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenTopic(isOpen ? null : topic.field)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left font-bold ${
                        isOpen ? activeTheme.lightBg : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{topic.field}</span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {total} kayıt · {isOpen ? '▲' : '▼'}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <p className={`text-[10px] font-extrabold uppercase ${activeTheme.textMuted} flex items-center gap-1 mb-2`}>
                            <FileText className="h-3.5 w-3.5" />
                            Makaleler
                          </p>
                          {renderScienceList(topic.articles, 'Bu konuda yeni makale bulunamadı.')}
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase text-emerald-600 flex items-center gap-1 mb-2">
                            <BookMarked className="h-3.5 w-3.5" />
                            Kitaplar
                          </p>
                          {renderScienceList(topic.books, 'Bu konuda yeni kitap bulunamadı.')}
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase text-amber-600 flex items-center gap-1 mb-2">
                            <Library className="h-3.5 w-3.5" />
                            Yayınlar
                          </p>
                          {renderScienceList(topic.publications, 'Bu konuda yeni bölüm/yayın bulunamadı.')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {(world.scienceTopics ?? []).length === 0 && (
                <p className="text-slate-500 text-center py-6">Bilim akışı yüklenemedi. Verileri yenileyin.</p>
              )}
            </div>

            {scienceBrief && (
              <div className={`mt-4 p-3 rounded-xl text-xs whitespace-pre-wrap leading-relaxed ${
                darkMode ? 'bg-slate-900/70' : activeTheme.surfaceTint
              }`}>
                {scienceBrief}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
