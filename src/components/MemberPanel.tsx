import React, { useMemo, useState } from 'react';
import {
  BarChart3, BookOpen, ClipboardList, GraduationCap, History, LogOut, Search,
  Target, TrendingUp, Upload, User, Users,
} from 'lucide-react';
import type { GradeLevel } from '../data/mebCurriculum';
import { getCurriculumForGrade } from '../data/mebCurriculum';
import { runMemberCoachOnce } from '../lib/backgroundCoach';
import {
  getAcademicSemester,
  loadCurriculumState,
  updateEducationProfile,
  type MemberCurriculumState,
} from '../lib/memberEducation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Exam } from '../lib/exams';
import { buildStudyTimeReport } from '../lib/studyTimeAdvisor';
import {
  computeAllPeriodStats,
  PERIOD_LABELS,
  type GrowthPeriod,
} from '../lib/memberAnalytics';
import {
  addHomework,
  addTopicTrack,
  deleteHomework,
  deleteTopicTrack,
  getMemberDisplayName,
  loadMemberActivity,
  logMemberSearch,
  logoutMember,
  searchMembers,
  updateHomework,
  updateTopicTrack,
  type MemberAccount,
  type MemberActivity,
} from '../lib/membership';

type ThemeClasses = {
  bg: string;
  text: string;
  ring: string;
  lightBg: string;
  hover: string;
  chartStroke?: string;
};

type Props = {
  darkMode: boolean;
  activeTheme: ThemeClasses;
  member: MemberAccount;
  exams: Exam[];
  completedTasks: number;
  totalTasks: number;
  curriculumTick?: number;
  onLogout: () => void;
  onActivityChange: () => void;
  onCurriculumRefresh?: () => void;
};

type PanelSection =
  | 'ozet'
  | 'mufredat'
  | 'arama'
  | 'ziyaret'
  | 'yukleme'
  | 'odev'
  | 'konu'
  | 'gelisim'
  | 'uye_ara';

const SECTIONS: { id: PanelSection; label: string; icon: typeof User }[] = [
  { id: 'ozet', label: 'Özet', icon: User },
  { id: 'mufredat', label: 'Müfredat Koçluğu', icon: GraduationCap },
  { id: 'gelisim', label: 'Gelişim', icon: TrendingUp },
  { id: 'odev', label: 'Ödev', icon: ClipboardList },
  { id: 'konu', label: 'Konu', icon: BookOpen },
  { id: 'arama', label: 'Arama Geçmişi', icon: Search },
  { id: 'ziyaret', label: 'Ziyaretler', icon: History },
  { id: 'yukleme', label: 'Yüklemeler', icon: Upload },
  { id: 'uye_ara', label: 'Üye Ara', icon: Users },
];

export default function MemberPanel({
  darkMode,
  activeTheme,
  member,
  exams,
  completedTasks,
  totalTasks,
  curriculumTick = 0,
  onLogout,
  onActivityChange,
  onCurriculumRefresh,
}: Props) {
  const [section, setSection] = useState<PanelSection>('ozet');
  const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>('monthly');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [activity, setActivity] = useState<MemberActivity>(() => loadMemberActivity(member.id));

  const [hwTitle, setHwTitle] = useState('');
  const [hwSubject, setHwSubject] = useState('Matematik');
  const [hwDue, setHwDue] = useState('');
  const [hwNotes, setHwNotes] = useState('');

  const [tpSubject, setTpSubject] = useState('Matematik');
  const [tpTopic, setTpTopic] = useState('');
  const [tpProgress, setTpProgress] = useState(0);
  const [tpTarget, setTpTarget] = useState('');
  const [tpNotes, setTpNotes] = useState('');

  const [eduSchool, setEduSchool] = useState('');
  const [eduGrade, setEduGrade] = useState<GradeLevel>('11');
  const [eduMahalle, setEduMahalle] = useState('');
  const [eduIlce, setEduIlce] = useState('');
  const [eduIl, setEduIl] = useState('');
  const [eduUlke, setEduUlke] = useState('Türkiye');

  const curriculumState = useMemo(
    (): MemberCurriculumState | null => loadCurriculumState(member.id),
    [member.id, curriculumTick],
  );

  const latestReport = curriculumState?.coachReports[0];
  const education = curriculumState?.education;

  const refresh = () => {
    setActivity(loadMemberActivity(member.id));
    onActivityChange();
  };

  const card = darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-100';

  const periodStats = useMemo(
    () => computeAllPeriodStats(exams, activity.homework, activity.topics, activity.snapshots),
    [exams, activity],
  );

  const activeStats = periodStats.find((p) => p.period === growthPeriod) ?? periodStats[2];

  const studyPlan = useMemo(() => {
    const grade = education?.effectiveGrade ?? '11';
    return buildStudyTimeReport(exams, grade);
  }, [exams, education?.effectiveGrade]);

  const memberSearchResults = useMemo(() => {
    if (!memberSearchQuery.trim()) return [];
    return searchMembers(memberSearchQuery).filter((m) => m.id !== member.id);
  }, [memberSearchQuery, member.id]);

  const handleMemberSearch = () => {
    if (!memberSearchQuery.trim()) return;
    logMemberSearch(member.id, memberSearchQuery, 'uye');
    refresh();
  };

  const handleAddHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim()) return;
    addHomework(member.id, {
      title: hwTitle.trim(),
      subject: hwSubject,
      dueDate: hwDue || new Date().toISOString().split('T')[0],
      status: 'bekliyor',
      notes: hwNotes,
    });
    setHwTitle('');
    setHwNotes('');
    refresh();
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tpTopic.trim()) return;
    addTopicTrack(member.id, {
      subject: tpSubject,
      topic: tpTopic.trim(),
      progress: tpProgress,
      targetDate: tpTarget || new Date().toISOString().split('T')[0],
      notes: tpNotes,
    });
    setTpTopic('');
    setTpNotes('');
    setTpProgress(0);
    refresh();
  };

  const handleLogout = () => {
    logoutMember();
    onLogout();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

  const syncEducationForm = () => {
    if (!education) return;
    setEduSchool(education.school);
    setEduGrade(education.registeredGrade);
    setEduMahalle(education.mahalle);
    setEduIlce(education.ilce);
    setEduIl(education.il);
    setEduUlke(education.ulke);
  };

  const handleSaveEducation = (e: React.FormEvent) => {
    e.preventDefault();
    updateEducationProfile(member.id, {
      school: eduSchool,
      registeredGrade: eduGrade,
      mahalle: eduMahalle,
      ilce: eduIlce,
      il: eduIl,
      ulke: eduUlke,
    });
    runMemberCoachOnce({
      member,
      exams,
      completedTasks,
      totalTasks,
    });
    onCurriculumRefresh?.();
    onActivityChange();
  };

  const handleRefreshCoach = () => {
    runMemberCoachOnce({ member, exams, completedTasks, totalTasks });
    onCurriculumRefresh?.();
    onActivityChange();
  };

  const curriculumSubjects = education
    ? getCurriculumForGrade(education.effectiveGrade).subjects
    : [];

  const semester = getAcademicSemester();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`p-6 rounded-2xl border shadow-sm ${card}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <User className={`h-5 w-5 ${activeTheme.text}`} />
              Üye Paneli
            </h2>
            <p className="text-sm font-bold mt-1">{getMemberDisplayName(member)}</p>
            <p className="text-[10px] text-slate-500">{member.email} · {member.phone}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
              Üyelik: {new Date(member.createdAt).toLocaleDateString('tr-TR')}
              {education && (
                <> · {education.effectiveGrade === 'mezun' ? 'Mezun' : `${education.effectiveGrade}. sınıf`}</>
              )}
            </p>
            {curriculumState?.lastBackgroundRunAt && (
              <p className="text-[9px] text-indigo-500 mt-0.5">
                Yerel AI koç: {formatDate(curriculumState.lastBackgroundRunAt)} (arka planda aktif)
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Üye Çıkışı
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`flex items-center gap-1.5 text-[10px] px-3 py-2 rounded-xl font-bold border transition-all ${
              section === id
                ? `${activeTheme.bg} text-white border-transparent`
                : darkMode
                  ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {section === 'ozet' && (
        <>
        <div className={`p-5 rounded-2xl border mb-4 ${card}`}>
          <h3 className="font-extrabold text-sm mb-2 flex items-center gap-2">
            <Target className={`h-4 w-4 ${activeTheme.text}`} />
            Günlük ders çalışma önerisi
          </h3>
          <p className="text-xs text-slate-500 mb-3">{studyPlan.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {studyPlan.subjects.slice(0, 6).map((p) => (
              <div key={p.subject} className={`text-xs p-2.5 rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <span className="font-bold">{p.subject}</span>
                <span className={`float-right font-black ${activeTheme.text}`}>{p.minutes} dk</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Deneme', value: exams.length, icon: Target },
            { label: 'Arama', value: activity.searchHistory.length, icon: Search },
            { label: 'Ziyaret', value: activity.visits.length, icon: History },
            { label: 'Yükleme', value: activity.uploads.length, icon: Upload },
            { label: 'Ödev', value: activity.homework.length, icon: ClipboardList },
            { label: 'Konu', value: activity.topics.length, icon: BookOpen },
            { label: 'Görev', value: `${completedTasks}/${totalTasks}`, icon: BarChart3 },
            { label: 'Anlık Net Ort.', value: activeStats.avgNet || '—', icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className={`p-4 rounded-2xl border ${card}`}>
              <Icon className={`h-4 w-4 mb-2 ${activeTheme.text}`} />
              <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
              <p className="text-xl font-black">{value}</p>
            </div>
          ))}
        </div>
        </>
      )}

      {section === 'mufredat' && (
        <div className="space-y-4">
          {!education ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Müfredat profili henüz oluşturulmadı. Çıkış yapıp tekrar giriş yapın veya eğitim bilgilerini kaydedin.
            </p>
          ) : (
            <>
              <div className={`p-5 rounded-2xl border ${card}`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-extrabold text-sm flex items-center gap-2">
                      <GraduationCap className={`h-4 w-4 ${activeTheme.text}`} />
                      Kişisel Müfredat Koçluğu
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">
                      MEB + YÖK · {education.curriculumLabel} · Dönem: {semester === 'yaz' ? 'Yaz' : `${semester}. dönem`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshCoach}
                    className={`text-[10px] px-3 py-1.5 rounded-lg font-bold text-white ${activeTheme.bg}`}
                  >
                    Raporu Yenile
                  </button>
                </div>
                {latestReport ? (
                  <div className="space-y-3">
                    <p className="text-xs leading-relaxed">{latestReport.summary}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {latestReport.prioritySubjects.map((ps) => (
                        <div
                          key={ps.subject}
                          className={`p-3 rounded-xl border text-xs ${darkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-100 bg-slate-50'}`}
                        >
                          <p className="font-bold text-sm mb-1">{ps.subject}</p>
                          <p className="text-slate-500 mb-2">
                            Odak: {ps.weakTopics.join(', ') || 'Genel tekrar'}
                          </p>
                          <p className="text-indigo-600 dark:text-indigo-400">{ps.recommendation}</p>
                        </div>
                      ))}
                    </div>
                    <div className={`p-3 rounded-xl border text-xs ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                      <p className="font-bold mb-2">Haftalık plan</p>
                      <ul className="space-y-1 text-slate-500">
                        {latestReport.weeklyPlan.map((line) => (
                          <li key={line}>• {line}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Son rapor: {formatDate(latestReport.generatedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Koçluk raporu hazırlanıyor…</p>
                )}
              </div>

              <div className={`p-5 rounded-2xl border ${card}`}>
                <h3 className="font-extrabold text-sm mb-3">Eğitim profili</h3>
                <form onSubmit={handleSaveEducation} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <input
                    value={eduSchool || education.school}
                    onChange={(e) => setEduSchool(e.target.value)}
                    onFocus={syncEducationForm}
                    placeholder="Okul"
                    className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <select
                    value={eduGrade || education.registeredGrade}
                    onChange={(e) => setEduGrade(e.target.value as GradeLevel)}
                    onFocus={syncEducationForm}
                    className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  >
                    {(['9', '10', '11', '12', 'mezun'] as GradeLevel[]).map((g) => (
                      <option key={g} value={g}>{g === 'mezun' ? 'Mezun' : `${g}. Sınıf`}</option>
                    ))}
                  </select>
                  <input
                    value={eduMahalle || education.mahalle}
                    onChange={(e) => setEduMahalle(e.target.value)}
                    onFocus={syncEducationForm}
                    placeholder="Mahalle / Köy"
                    className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <input
                    value={eduIlce || education.ilce}
                    onChange={(e) => setEduIlce(e.target.value)}
                    onFocus={syncEducationForm}
                    placeholder="İlçe"
                    className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <input
                    value={eduIl || education.il}
                    onChange={(e) => setEduIl(e.target.value)}
                    onFocus={syncEducationForm}
                    placeholder="İl"
                    className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <input
                    value={eduUlke || education.ulke}
                    onChange={(e) => setEduUlke(e.target.value)}
                    onFocus={syncEducationForm}
                    placeholder="Ülke"
                    className={`px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                  <button type="submit" className={`md:col-span-2 py-2.5 rounded-xl font-bold text-white ${activeTheme.bg}`}>
                    Profili Kaydet ve Müfredatı Güncelle
                  </button>
                </form>
                <p className="text-[10px] text-slate-400 mt-3">
                  Kayıt sınıfı: {education.registeredGrade === 'mezun' ? 'Mezun' : `${education.registeredGrade}. sınıf`}
                  {' · '}Güncel: {education.effectiveGrade === 'mezun' ? 'Mezun' : `${education.effectiveGrade}. sınıf`}
                  {education.yksField && ` · Alan: ${education.yksField}`}
                </p>
                {education.gradeHistory.length > 0 && (
                  <div className="mt-3 text-[10px] text-slate-500 space-y-1">
                    <p className="font-bold uppercase">Sınıf geçmişi (otomatik)</p>
                    {education.gradeHistory.slice(0, 3).map((g) => (
                      <p key={g.at}>
                        {g.from} → {g.to}: {g.reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className={`p-5 rounded-2xl border ${card}`}>
                <h3 className="font-extrabold text-sm mb-3">Müfredat haritası</h3>
                <p className="text-[10px] text-slate-500 mb-4">{education.mebFramework}</p>
                <div className="space-y-4">
                  {curriculumSubjects.map((subj) => {
                    const topics = curriculumState?.topicProgress.filter((t) => t.subjectId === subj.id) ?? [];
                    return (
                      <div key={subj.id}>
                        <p className="text-xs font-bold mb-2">{subj.name}</p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {subj.topics.map((topic) => {
                            const prog = topics.find((t) => t.topicId === topic.id);
                            const pct = prog?.progress ?? 0;
                            const status = prog?.status ?? 'eksik';
                            return (
                              <div
                                key={topic.id}
                                className={`p-2 rounded-lg border text-[10px] ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}
                              >
                                <div className="flex justify-between mb-1">
                                  <span>{topic.name}</span>
                                  <span className={
                                    status === 'tamam' ? 'text-emerald-500' : status === 'devam' ? 'text-amber-500' : 'text-rose-500'
                                  }>
                                    {status}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full">
                                  <div className={`h-full rounded-full ${activeTheme.bg}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {section === 'gelisim' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PERIOD_LABELS) as GrowthPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setGrowthPeriod(p)}
                className={`text-[10px] px-3 py-1.5 rounded-lg font-bold ${
                  growthPeriod === p ? `${activeTheme.bg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Deneme sayısı" value={String(activeStats.examCount)} card={card} />
            <StatBox
              label="Ortalama net"
              value={activeStats.examCount ? String(activeStats.avgNet) : '—'}
              delta={activeStats.netDelta}
              card={card}
            />
            <StatBox
              label="Doğruluk %"
              value={activeStats.examCount ? `%${activeStats.avgAccuracy}` : '—'}
              delta={activeStats.accuracyDelta}
              card={card}
            />
            <StatBox
              label="Ödev tamamlama"
              value={`${activeStats.homeworkDone}/${activeStats.homeworkTotal}`}
              card={card}
            />
            <StatBox label="Konu ilerleme" value={`%${activeStats.topicAvgProgress}`} card={card} />
          </div>

          {activeStats.chartPoints.length > 0 ? (
            <div className={`p-5 rounded-2xl border ${card}`}>
              <h3 className="font-extrabold text-sm mb-4">{PERIOD_LABELS[growthPeriod]} net grafiği</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeStats.chartPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="label" fontSize={9} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <YAxis fontSize={10} stroke={darkMode ? '#94a3b8' : '#64748b'} />
                    <Tooltip />
                    <Line type="monotone" dataKey="net" stroke={activeTheme.chartStroke ?? '#6366f1'} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">
              Bu dönem için yeterli deneme verisi yok. Panel sekmesinden deneme ekleyin.
            </p>
          )}
        </div>
      )}

      {section === 'odev' && (
        <div className={`p-5 rounded-2xl border ${card} space-y-4`}>
          <h3 className="font-extrabold text-sm">Ödev Takip</h3>
          <form onSubmit={handleAddHomework} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={hwTitle}
              onChange={(e) => setHwTitle(e.target.value)}
              placeholder="Ödev başlığı"
              className={`text-xs px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              required
            />
            <select
              value={hwSubject}
              onChange={(e) => setHwSubject(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            >
              {['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="date"
              value={hwDue}
              onChange={(e) => setHwDue(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            />
            <input
              value={hwNotes}
              onChange={(e) => setHwNotes(e.target.value)}
              placeholder="Not (isteğe bağlı)"
              className={`text-xs px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            />
            <button type="submit" className={`md:col-span-2 text-xs py-2.5 rounded-xl font-bold text-white ${activeTheme.bg}`}>
              Ödev Ekle
            </button>
          </form>
          <div className="space-y-2">
            {activity.homework.length === 0 && (
              <p className="text-xs text-slate-500">Henüz ödev kaydı yok.</p>
            )}
            {activity.homework.map((h) => (
              <div key={h.id} className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border text-xs ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div>
                  <p className="font-bold">{h.title}</p>
                  <p className="text-slate-400">{h.subject} · Son: {h.dueDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={h.status}
                    onChange={(e) => {
                      updateHomework(member.id, h.id, { status: e.target.value as typeof h.status });
                      refresh();
                    }}
                    className={`text-[10px] px-2 py-1 rounded-lg border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                  >
                    <option value="bekliyor">Bekliyor</option>
                    <option value="devam">Devam</option>
                    <option value="tamamlandi">Tamamlandı</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { deleteHomework(member.id, h.id); refresh(); }}
                    className="text-rose-500 font-bold"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'konu' && (
        <div className={`p-5 rounded-2xl border ${card} space-y-4`}>
          <h3 className="font-extrabold text-sm">Konu Takip</h3>
          <form onSubmit={handleAddTopic} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={tpSubject}
              onChange={(e) => setTpSubject(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            >
              {['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              value={tpTopic}
              onChange={(e) => setTpTopic(e.target.value)}
              placeholder="Konu adı (ör. Türev)"
              className={`text-xs px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
              required
            />
            <div>
              <label className="text-[10px] text-slate-400">İlerleme %{tpProgress}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={tpProgress}
                onChange={(e) => setTpProgress(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <input
              type="date"
              value={tpTarget}
              onChange={(e) => setTpTarget(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            />
            <button type="submit" className={`md:col-span-2 text-xs py-2.5 rounded-xl font-bold text-white ${activeTheme.bg}`}>
              Konu Ekle
            </button>
          </form>
          <div className="space-y-2">
            {activity.topics.map((t) => (
              <div key={t.id} className={`p-3 rounded-xl border text-xs ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                <div className="flex justify-between mb-2">
                  <span className="font-bold">{t.subject} — {t.topic}</span>
                  <button type="button" onClick={() => { deleteTopicTrack(member.id, t.id); refresh(); }} className="text-rose-500">Sil</button>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${activeTheme.bg}`} style={{ width: `${t.progress}%` }} />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={t.progress}
                  onChange={(e) => {
                    updateTopicTrack(member.id, t.id, { progress: Number(e.target.value) });
                    refresh();
                  }}
                  className="w-full mt-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'arama' && (
        <ListSection
          title="Arama Geçmişi"
          empty="Henüz arama kaydı yok."
          card={card}
          hasItems={activity.searchHistory.length > 0}
        >
          {activity.searchHistory.map((s) => (
            <li key={s.id} className="flex justify-between gap-2 py-2 border-b dark:border-slate-700 text-xs">
              <span><span className="font-bold">{s.query}</span> <span className="text-slate-400">({s.type})</span></span>
              <span className="text-slate-400 shrink-0">{formatDate(s.at)}</span>
            </li>
          ))}
        </ListSection>
      )}

      {section === 'ziyaret' && (
        <ListSection
          title="Ziyaret Edilen Sekmeler"
          empty="Henüz ziyaret kaydı yok."
          card={card}
          hasItems={activity.visits.length > 0}
        >
          {activity.visits.map((v) => (
            <li key={v.id} className="flex justify-between gap-2 py-2 border-b dark:border-slate-700 text-xs">
              <span className="font-bold">{v.label}</span>
              <span className="text-slate-400 shrink-0">{formatDate(v.at)}</span>
            </li>
          ))}
        </ListSection>
      )}

      {section === 'yukleme' && (
        <ListSection
          title="Üyelik ile Yapılan Yüklemeler"
          empty="Henüz yükleme kaydı yok."
          card={card}
          hasItems={activity.uploads.length > 0}
        >
          {activity.uploads.map((u) => (
            <li key={u.id} className="flex justify-between gap-2 py-2 border-b dark:border-slate-700 text-xs">
              <span>
                <span className="font-bold">{u.title}</span>
                <span className="text-slate-400 block">{u.type}{u.meta ? ` · ${u.meta}` : ''}</span>
              </span>
              <span className="text-slate-400 shrink-0">{formatDate(u.at)}</span>
            </li>
          ))}
        </ListSection>
      )}

      {section === 'uye_ara' && (
        <div className={`p-5 rounded-2xl border ${card}`}>
          <h3 className="font-extrabold text-sm mb-3">Üye Arama</h3>
          <div className="flex gap-2 mb-4">
            <input
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMemberSearch()}
              placeholder="Ad, soyad veya e-posta"
              className={`flex-1 text-xs px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
            />
            <button type="button" onClick={handleMemberSearch} className={`text-xs px-4 py-2 rounded-xl font-bold text-white ${activeTheme.bg}`}>
              Ara
            </button>
          </div>
          {memberSearchResults.map((m) => (
            <div key={m.id} className={`p-3 rounded-xl border mb-2 text-xs ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <p className="font-bold">{getMemberDisplayName(m)}</p>
              <p className="text-slate-400">{m.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  delta,
  card,
}: {
  label: string;
  value: string;
  delta?: number | null;
  card: string;
}) {
  return (
    <div className={`p-4 rounded-2xl border ${card}`}>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-xl font-black">{value}</p>
      {delta != null && (
        <p className={`text-[10px] font-bold ${delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {delta >= 0 ? '+' : ''}{delta} değişim
        </p>
      )}
    </div>
  );
}

function ListSection({
  title,
  empty,
  card,
  hasItems,
  children,
}: {
  title: string;
  empty: string;
  card: string;
  hasItems: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`p-5 rounded-2xl border ${card}`}>
      <h3 className="font-extrabold text-sm mb-3">{title}</h3>
      {!hasItems ? (
        <p className="text-xs text-slate-500">{empty}</p>
      ) : (
        <ul>{children}</ul>
      )}
    </div>
  );
}
