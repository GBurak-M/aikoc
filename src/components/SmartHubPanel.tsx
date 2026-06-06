import {
  Cloud, CloudRain, Calendar, Clock, MapPin, RefreshCw, Sparkles, BookOpen,
} from 'lucide-react';
import type { Settlement, WorldSnapshot } from '../lib/worldData';

type ThemeClasses = {
  bg: string;
  text: string;
  ring: string;
  lightBg: string;
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
  const card = darkMode
    ? 'bg-slate-800/50 border-slate-700/60'
    : 'bg-white border-slate-100';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`p-6 rounded-2xl border shadow-sm ${card}`}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Sparkles className={`h-5 w-5 ${activeTheme.text}`} />
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
        <p className="text-sm text-slate-500 text-center py-8">Zeka Merkezi verileri yükleniyor…</p>
      )}

      {world && !loadingWorld && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-5 rounded-2xl border ${card}`}>
            <h3 className="font-extrabold text-sm flex items-center gap-2 mb-3">
              <Cloud className={activeTheme.text} />
              Saatlik Hava Durumu
            </h3>
            <p className="text-2xl font-black mb-4">
              {world.currentTemp ?? '—'}°C
              <span className="text-xs font-normal text-slate-400 ml-2">{world.weather[0]?.label}</span>
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {world.weather.map((h) => (
                <div
                  key={h.time}
                  className={`flex-shrink-0 min-w-[72px] text-center p-2 rounded-xl border text-[10px] ${
                    darkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <p className="font-bold">{h.hourLabel}</p>
                  <p className="text-sm font-extrabold my-1">{h.temp}°</p>
                  <p className="text-slate-400 truncate">{h.label}</p>
                  {h.precipProb > 30 && (
                    <p className="text-sky-500 flex items-center justify-center gap-0.5 mt-1">
                      <CloudRain className="h-3 w-3" />
                      %{h.precipProb}
                    </p>
                  )}
                </div>
              ))}
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
            <p className="text-[10px] mt-3 text-indigo-500 font-bold">
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

          <div className={`p-5 rounded-2xl border ${card}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <BookOpen className={activeTheme.text} />
                Güncel Bilim Akışı
              </h3>
              <button
                type="button"
                onClick={onScienceBrief}
                disabled={loadingBrief}
                className="text-[10px] font-bold px-2 py-1 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                {loadingBrief ? 'Hazırlanıyor…' : 'AI Özet'}
              </button>
            </div>
            <ul className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin text-xs">
              {world.science.map((s) => (
                <li key={s.id} className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-[9px] font-bold uppercase text-indigo-500">{s.field}</span>
                  <p className="font-bold mt-0.5 leading-snug">{s.title}</p>
                  <p className="text-slate-500 mt-1 line-clamp-2">{s.summary}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{s.date} · {s.source}</p>
                  {s.url && (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-indigo-500 hover:underline"
                    >
                      Kaynağı aç
                    </a>
                  )}
                </li>
              ))}
            </ul>
            {scienceBrief && (
              <div className={`mt-4 p-3 rounded-xl text-xs whitespace-pre-wrap leading-relaxed ${
                darkMode ? 'bg-slate-900/70' : 'bg-indigo-50/50'
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
