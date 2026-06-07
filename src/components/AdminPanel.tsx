import { useMemo, useState } from 'react';
import {
  Brain, KeyRound, Mail, RefreshCw, Shield, Trash2, UserCog, UserPlus, Users, Zap, AlertTriangle,
} from 'lucide-react';
import {
  addAdminAccount,
  getAdminDisplayName,
  listAdminAccounts,
  logoutAdmin,
  removeAdminAccount,
  type AdminAccount,
} from '../lib/adminAuth';
import {
  listPasswordResetRequests,
  listSimulatedEmails,
} from '../lib/passwordReset';
import {
  adminDeleteMember,
  adminUpdateMember,
  getMemberAdminDetail,
  getMemberDisplayName,
  loadRegistry,
  type MemberAccount,
} from '../lib/membership';
import {
  deepenCoreLearning,
  getLearningStats,
  processLearningQueue,
  resetCentralAiMotor,
  resumeCentralAiMotor,
  setLearningBypass,
} from '../lib/aiCentralLearning';
import { logSiteEvent } from '../lib/siteTraffic';

type ThemeClasses = {
  bg: string;
  text: string;
  ring: string;
  lightBg: string;
  hover: string;
  gradient: string;
};

type Props = {
  darkMode: boolean;
  activeTheme: ThemeClasses;
  admin: AdminAccount;
  onLogout: () => void;
  onMemberDeleted?: (memberId: string) => void;
};

export default function AdminPanel({ darkMode, activeTheme, admin, onLogout, onMemberDeleted }: Props) {
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [memberMsg, setMemberMsg] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [learningMsg, setLearningMsg] = useState('');
  const [learningStats, setLearningStats] = useState(getLearningStats);
  const [adminListTick, setAdminListTick] = useState(0);
  const [memberTick, setMemberTick] = useState(0);
  const [resetTick, setResetTick] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [newAdmin, setNewAdmin] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    password: '',
  });

  const members = useMemo(() => {
    void memberTick;
    const all = loadRegistry();
    const q = memberSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (m) =>
        m.email.includes(q) ||
        m.phone.includes(q) ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q),
    );
  }, [memberSearch, memberTick]);

  const admins = useMemo(() => {
    void adminListTick;
    return listAdminAccounts();
  }, [adminListTick]);

  const selectedMember = members.find((m) => m.id === selectedMemberId) ?? null;
  const memberDetail = useMemo(() => {
    void memberTick;
    return selectedMemberId ? getMemberAdminDetail(selectedMemberId) : null;
  }, [selectedMemberId, memberTick]);

  const resetRequests = useMemo(() => {
    void resetTick;
    return listPasswordResetRequests();
  }, [resetTick]);

  const simulatedEmails = useMemo(() => {
    void resetTick;
    return listSimulatedEmails().slice(0, 10);
  }, [resetTick]);

  const card = `p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`;
  const input = `w-full text-sm px-3 py-2 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`;

  const refreshLearning = () => setLearningStats(getLearningStats());

  const selectMember = (m: MemberAccount) => {
    setSelectedMemberId(m.id);
    setDeleteConfirm(false);
    setMemberForm({
      email: m.email,
      phone: m.phone,
      firstName: m.firstName,
      lastName: m.lastName,
      password: '',
    });
    setMemberMsg('');
  };

  const handleDeleteMember = () => {
    if (!selectedMemberId) return;
    const result = adminDeleteMember(selectedMemberId);
    if (!result.ok) {
      setMemberMsg(result.error);
      return;
    }
    logSiteEvent('admin_member_delete', { detail: selectedMemberId });
    onMemberDeleted?.(selectedMemberId);
    setSelectedMemberId(null);
    setDeleteConfirm(false);
    setMemberMsg('Üye ve tüm kayıtları silindi.');
    setMemberTick((t) => t + 1);
    setResetTick((t) => t + 1);
    setTimeout(() => setMemberMsg(''), 5000);
  };

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('tr-TR') : '—';

  const saveMember = () => {
    if (!selectedMemberId) return;
    const result = adminUpdateMember(selectedMemberId, {
      email: memberForm.email,
      phone: memberForm.phone,
      firstName: memberForm.firstName,
      lastName: memberForm.lastName,
      password: memberForm.password || undefined,
    });
    if (!result.ok) {
      setMemberMsg(result.error);
      return;
    }
    setMemberMsg('Üye bilgileri güncellendi.');
    setMemberForm((f) => ({ ...f, password: '' }));
    setMemberTick((t) => t + 1);
    logSiteEvent('admin_member_update', { detail: result.member.email });
    setTimeout(() => setMemberMsg(''), 4000);
  };

  const handleAddAdmin = () => {
    const result = addAdminAccount(admin.id, newAdmin);
    if (!result.ok) {
      setAdminMsg(result.error);
      return;
    }
    setAdminMsg(`${getAdminDisplayName(result.admin)} admin olarak eklendi.`);
    setNewAdmin({ email: '', phone: '', firstName: '', lastName: '', password: '' });
    setAdminListTick((t) => t + 1);
    setTimeout(() => setAdminMsg(''), 5000);
  };

  const handleRemoveAdmin = (targetId: string) => {
    const result = removeAdminAccount(admin.id, targetId);
    setAdminMsg(result.ok ? 'Admin kaldırıldı.' : result.error);
    if (result.ok) setAdminListTick((t) => t + 1);
    setTimeout(() => setAdminMsg(''), 5000);
  };

  const handleResetMotor = () => {
    resetCentralAiMotor('Admin: yanlış öğrenme tespiti — tam sıfırlama ve baypas');
    refreshLearning();
    setLearningMsg('Yapay zeka motoru sıfırlandı ve baypasa alındı. Site temel koç moduna döndü.');
    setTimeout(() => setLearningMsg(''), 6000);
  };

  const handleResumeLearning = () => {
    resumeCentralAiMotor();
    refreshLearning();
    setLearningMsg('Merkezi öğrenme yeniden etkin. Otomatik döngü devam ediyor.');
    setTimeout(() => setLearningMsg(''), 5000);
  };

  const handleBypassOnly = () => {
    setLearningBypass(true, 'Admin: geçici baypas');
    refreshLearning();
    setLearningMsg('Öğrenilmiş model baypasa alındı (veri silinmedi).');
    setTimeout(() => setLearningMsg(''), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className={`${card} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <p className="text-[10px] font-bold uppercase text-violet-500 flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Tam Yetkili Admin
          </p>
          <h2 className="font-extrabold text-xl mt-1">{getAdminDisplayName(admin)}</h2>
          <p className="text-xs text-slate-500">{admin.email}</p>
        </div>
        <button
          type="button"
          onClick={() => { logoutAdmin(); onLogout(); }}
          className="text-xs px-4 py-2 rounded-xl font-bold bg-rose-600 text-white"
        >
          Admin Çıkışı
        </button>
      </div>

      {/* AI Motor */}
      <div className={card}>
        <h3 className="font-extrabold text-sm flex items-center gap-2 mb-1">
          <Brain className="h-4 w-4 text-violet-500" />
          Yapay Zeka Sıfırlama Motoru
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Otomatik öğrenme döngüsü admin girişinde çalışır. Yanlış gelişen modeli sıfırlayın veya geçici baypas uygulayın.
        </p>

        {learningStats.bypassed && (
          <div className={`flex items-start gap-2 p-3 rounded-xl mb-4 text-xs ${darkMode ? 'bg-amber-950/40 border border-amber-800' : 'bg-amber-50 border border-amber-200'}`}>
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-600 dark:text-amber-400">Baypas aktif</p>
              <p className="text-slate-500">{learningStats.bypassReason ?? 'Merkezi model devre dışı'}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mb-4">
          <span className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
            Otomasyon: <strong>{learningStats.automationEnabled ? 'Açık' : 'Kapalı'}</strong>
          </span>
          <span className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
            Derinlik: <strong>{learningStats.depthLevel}</strong>
          </span>
          <span className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
            Sinyal: <strong>{learningStats.totalProcessed}</strong>
          </span>
          <span className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}`}>
            Kuyruk: <strong>{learningStats.queuePending}</strong>
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={handleResetMotor}
            className="text-xs px-3 py-2 rounded-xl font-bold bg-rose-600 text-white flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sıfırla ve Baypas
          </button>
          <button
            type="button"
            onClick={handleBypassOnly}
            className="text-xs px-3 py-2 rounded-xl font-bold border border-amber-500 text-amber-600 dark:text-amber-400"
          >
            Sadece Baypas
          </button>
          <button
            type="button"
            onClick={handleResumeLearning}
            className={`text-xs px-3 py-2 rounded-xl font-bold text-white ${activeTheme.bg} flex items-center gap-1`}
          >
            <Zap className="h-3.5 w-3.5" />
            Öğrenmeyi Aç
          </button>
          <button
            type="button"
            onClick={() => { processLearningQueue(); refreshLearning(); }}
            className="text-xs px-3 py-2 rounded-xl font-bold border border-slate-300 dark:border-slate-600"
          >
            Kuyruğu İşle
          </button>
          <button
            type="button"
            onClick={() => { deepenCoreLearning(); refreshLearning(); }}
            className="text-xs px-3 py-2 rounded-xl font-bold border border-slate-300 dark:border-slate-600"
          >
            Derinleştir
          </button>
        </div>
        {learningMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{learningMsg}</p>}
      </div>

      {/* Şifre sıfırlama talepleri */}
      <div className={card}>
        <h3 className="font-extrabold text-sm flex items-center gap-2 mb-3">
          <KeyRound className="h-4 w-4 text-violet-500" />
          Şifre Sıfırlama Talepleri
          <button
            type="button"
            onClick={() => setResetTick((t) => t + 1)}
            className="ml-auto text-[10px] px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600"
          >
            Yenile
          </button>
        </h3>
        {resetRequests.length === 0 ? (
          <p className="text-xs text-slate-500">Henüz şifre sıfırlama talebi yok.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {resetRequests.slice(0, 20).map((r) => (
              <div key={r.id} className={`p-3 rounded-xl text-xs ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                <p className="font-bold">{r.memberName} · {r.email}</p>
                <p className="text-slate-500">{formatDate(r.requestedAt)} · {r.status}</p>
                {r.aiMessage && <p className="text-violet-500 mt-1">{r.aiMessage}</p>}
              </div>
            ))}
          </div>
        )}
        {simulatedEmails.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              AI Gönderilen E-postalar (demo)
            </p>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {simulatedEmails.map((mail) => (
                <div key={mail.id} className={`p-2 rounded-lg text-[10px] ${darkMode ? 'bg-slate-900/40' : 'bg-slate-50'}`}>
                  <p className="font-semibold">{mail.subject}</p>
                  <p className="text-slate-500">Kime: {mail.to}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Üye yönetimi */}
      <div className={card}>
        <h3 className="font-extrabold text-sm flex items-center gap-2 mb-1">
          <Users className="h-4 w-4" />
          Üye Listesi
          <span className="text-[10px] font-normal text-slate-500 ml-1">({members.length} kayıt)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-3">Kullanıcı adına tıklayın; tüm bilgiler, istatistikler ve şifre görüntülenir.</p>
        <input
          type="search"
          placeholder="E-posta, telefon veya isim ara…"
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          className={`${input} mb-3`}
        />
        <div className={`overflow-x-auto rounded-xl border mb-4 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <table className="w-full text-xs text-left">
            <thead className={darkMode ? 'bg-slate-900/60' : 'bg-slate-50'}>
              <tr>
                <th className="px-3 py-2 font-bold">Kullanıcı</th>
                <th className="px-3 py-2 font-bold hidden sm:table-cell">E-posta</th>
                <th className="px-3 py-2 font-bold hidden md:table-cell">Telefon</th>
                <th className="px-3 py-2 font-bold hidden lg:table-cell">Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-slate-500">Üye bulunamadı.</td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => selectMember(m)}
                    className={`cursor-pointer border-t ${
                      selectedMemberId === m.id
                        ? activeTheme.lightBg
                        : darkMode
                          ? 'border-slate-700 hover:bg-slate-800/40'
                          : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 py-2.5 font-semibold">{getMemberDisplayName(m)}</td>
                    <td className="px-3 py-2.5 text-slate-500 hidden sm:table-cell">{m.email}</td>
                    <td className="px-3 py-2.5 text-slate-500 hidden md:table-cell">{m.phone}</td>
                    <td className="px-3 py-2.5 text-slate-500 hidden lg:table-cell">
                      {new Date(m.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedMember && memberDetail && (
          <div className={`rounded-xl border p-4 space-y-4 ${darkMode ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50/50'}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-extrabold text-base">{getMemberDisplayName(selectedMember)}</p>
                <p className="text-xs text-slate-500">ID: {selectedMember.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="text-xs px-3 py-1.5 rounded-lg font-bold bg-rose-600 text-white flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Üyeyi Sil
              </button>
            </div>

            {deleteConfirm && (
              <div className={`p-3 rounded-xl text-xs ${darkMode ? 'bg-rose-950/40 border border-rose-800' : 'bg-rose-50 border border-rose-200'}`}>
                <p className="font-bold text-rose-600 mb-2">Bu üye ve tüm kayıtları kalıcı olarak silinecek. Emin misiniz?</p>
                <div className="flex gap-2">
                  <button type="button" onClick={handleDeleteMember} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold">Evet, sil</button>
                  <button type="button" onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 rounded-lg border border-slate-300">İptal</button>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <span className="text-slate-400 block">E-posta</span>
                <span className="font-semibold">{memberDetail.account.email}</span>
              </div>
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <span className="text-slate-400 block">Telefon</span>
                <span className="font-semibold">{memberDetail.account.phone}</span>
              </div>
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <span className="text-slate-400 block">Şifre</span>
                <span className="font-semibold font-mono text-violet-500">
                  {memberDetail.account.passwordPlain ?? '(eski kayıt — sıfırlama gerekir)'}
                </span>
              </div>
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <span className="text-slate-400 block">Kayıt tarihi</span>
                <span className="font-semibold">{formatDate(memberDetail.account.createdAt)}</span>
              </div>
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <span className="text-slate-400 block">Okul / Sınıf</span>
                <span className="font-semibold">
                  {memberDetail.stats.school || '—'} {memberDetail.stats.curriculumGrade ? `· ${memberDetail.stats.curriculumGrade}. sınıf` : ''}
                </span>
              </div>
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                <span className="text-slate-400 block">Son ziyaret</span>
                <span className="font-semibold">{formatDate(memberDetail.stats.lastVisitAt)}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">İstatistikler</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                {[
                  ['Ziyaret', memberDetail.stats.visitCount],
                  ['Arama', memberDetail.stats.searchCount],
                  ['Yükleme', memberDetail.stats.uploadCount],
                  ['Ödev', memberDetail.stats.homeworkCount],
                  ['Konu', memberDetail.stats.topicCount],
                  ['Grafik', memberDetail.stats.snapshotCount],
                  ['Ort. net', memberDetail.stats.avgNet ?? '—'],
                  ['Doğruluk', memberDetail.stats.avgAccuracy != null ? `%${memberDetail.stats.avgAccuracy}` : '—'],
                ].map(([label, val]) => (
                  <span key={String(label)} className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
                    {label}: <strong>{val}</strong>
                  </span>
                ))}
              </div>
            </div>

            {memberDetail.education && (
              <div className="text-[11px] text-slate-500">
                <p><strong>Konum:</strong> {[memberDetail.education.mahalle, memberDetail.education.ilce, memberDetail.education.il, memberDetail.education.ulke].filter(Boolean).join(', ') || '—'}</p>
                <p><strong>Müfredat:</strong> {memberDetail.education.curriculumLabel}</p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Son aktiviteler</p>
              <div className="grid md:grid-cols-2 gap-2 text-[10px] max-h-32 overflow-y-auto">
                {memberDetail.activity.visits.slice(0, 5).map((v) => (
                  <p key={v.id} className="text-slate-500">📍 {v.label} · {formatDate(v.at)}</p>
                ))}
                {memberDetail.activity.searchHistory.slice(0, 5).map((s) => (
                  <p key={s.id} className="text-slate-500">🔍 {s.query} · {formatDate(s.at)}</p>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Üye bilgilerini düzenle</p>
              <div className="grid sm:grid-cols-2 gap-2">
                <input className={input} value={memberForm.firstName} onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })} placeholder="Ad" />
                <input className={input} value={memberForm.lastName} onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })} placeholder="Soyad" />
                <input className={input} type="email" value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} placeholder="E-posta" />
                <input className={input} type="tel" value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} placeholder="Telefon" />
                <input className={`${input} sm:col-span-2`} type="text" value={memberForm.password} onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })} placeholder="Yeni şifre (boş bırak = değişmez)" />
              </div>
              <button type="button" onClick={saveMember} className={`mt-2 w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold text-white ${activeTheme.bg}`}>
                Değişiklikleri Kaydet
              </button>
              {memberMsg && <p className="text-xs text-emerald-600 mt-2">{memberMsg}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Admin yönetimi */}
      <div className={card}>
        <h3 className="font-extrabold text-sm flex items-center gap-2 mb-3">
          <UserCog className="h-4 w-4" />
          Admin Hesapları
        </h3>
        <div className="space-y-2 mb-4">
          {admins.map((a) => (
            <div key={a.id} className={`flex items-center justify-between gap-2 p-3 rounded-xl text-xs ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
              <div>
                <p className="font-bold">{getAdminDisplayName(a)} {a.isBootstrap ? '(bootstrap)' : ''}</p>
                <p className="text-slate-500">{a.email}</p>
              </div>
              {a.id !== admin.id && !a.isBootstrap && (
                <button type="button" onClick={() => handleRemoveAdmin(a.id)} className="text-rose-500 p-1" title="Kaldır">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
          <UserPlus className="h-3.5 w-3.5" />
          Yeni admin ekle
        </p>
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input className={input} placeholder="Ad" value={newAdmin.firstName} onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })} />
          <input className={input} placeholder="Soyad" value={newAdmin.lastName} onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })} />
          <input className={input} type="email" placeholder="E-posta" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} />
          <input className={input} type="tel" placeholder="Telefon" value={newAdmin.phone} onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })} />
          <input className={`${input} sm:col-span-2`} type="password" placeholder="Şifre (min 8)" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
        </div>
        <button type="button" onClick={handleAddAdmin} className={`text-xs px-4 py-2 rounded-xl font-bold text-white ${activeTheme.bg}`}>
          Admin Ekle
        </button>
        {adminMsg && <p className="text-xs text-emerald-600 mt-2">{adminMsg}</p>}
      </div>
    </div>
  );
}
