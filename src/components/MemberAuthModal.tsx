import { useState } from 'react';
import { ChevronDown, ChevronUp, LogIn, UserPlus, X } from 'lucide-react';
import type { GradeLevel } from '../data/mebCurriculum';
import { setupMemberCurriculum } from '../lib/memberEducation';
import {
  loginMember,
  registerMember,
  type MemberAccount,
} from '../lib/membership';

type ThemeClasses = {
  bg: string;
  text: string;
  ring: string;
  hover: string;
  gradient: string;
};

type Props = {
  darkMode: boolean;
  activeTheme: ThemeClasses;
  onClose: () => void;
  onSuccess: (member: MemberAccount) => void;
};

const GRADES: { value: GradeLevel; label: string }[] = [
  { value: '9', label: '9. Sınıf' },
  { value: '10', label: '10. Sınıf' },
  { value: '11', label: '11. Sınıf' },
  { value: '12', label: '12. Sınıf' },
  { value: 'mezun', label: 'Mezun' },
];

export default function MemberAuthModal({ darkMode, activeTheme, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [showEducation, setShowEducation] = useState(true);
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState<GradeLevel>('11');
  const [mahalle, setMahalle] = useState('');
  const [ilce, setIlce] = useState('');
  const [il, setIl] = useState('');
  const [ulke, setUlke] = useState('Türkiye');
  const [yksField, setYksField] = useState<'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil' | ''>('Sayısal');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputClass = `w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
  }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const result = registerMember({ email, phone, firstName, lastName, password });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        await setupMemberCurriculum(result.member.id, {
          school,
          grade,
          yksField,
          mahalle,
          ilce,
          il,
          ulke,
          registeredAt: result.member.createdAt,
        });
        onSuccess(result.member);
      } else {
        const result = loginMember(email, password);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSuccess(result.member);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className={`w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl relative my-4 ${
          darkMode ? 'bg-slate-900 border border-slate-800 text-slate-100' : 'bg-white text-slate-800'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl font-bold ${
              mode === 'register' ? `${activeTheme.bg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Üye Ol
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl font-bold ${
              mode === 'login' ? `${activeTheme.bg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            <LogIn className="h-4 w-4" />
            Giriş Yap
          </button>
        </div>

        <h2 className="font-extrabold text-lg mb-1">
          {mode === 'register' ? 'Üyelik Oluştur' : 'Üye Girişi'}
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          {mode === 'register'
            ? 'MEB ve YÖK müfredatına göre kişisel koçluk için okul ve konum bilgilerinizi isteğe bağlı ekleyin.'
            : 'E-posta ve şifre ile giriş yapın; müfredat koçluğu otomatik devam eder.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ad</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Soyad</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              className={inputClass}
              required
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XX XXX XX XX"
                className={inputClass}
                required
              />
            </div>
          )}

          {mode === 'register' && (
            <div className={`rounded-xl border p-3 ${darkMode ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50'}`}>
              <button
                type="button"
                onClick={() => setShowEducation((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-500"
              >
                Eğitim bilgileri (isteğe bağlı)
                {showEducation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showEducation && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Okul</label>
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="Örn. XX Anadolu Lisesi"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sınıf</label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value as GradeLevel)}
                        className={inputClass}
                      >
                        {GRADES.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Alan</label>
                      <select
                        value={yksField}
                        onChange={(e) => setYksField(e.target.value as typeof yksField)}
                        className={inputClass}
                      >
                        <option value="Sayısal">Sayısal</option>
                        <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                        <option value="Sözel">Sözel</option>
                        <option value="Dil">Dil</option>
                        <option value="">Belirtmek istemiyorum</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mahalle / Köy</label>
                    <input
                      type="text"
                      value={mahalle}
                      onChange={(e) => setMahalle(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">İlçe</label>
                      <input type="text" value={ilce} onChange={(e) => setIlce(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">İl</label>
                      <input type="text" value={il} onChange={(e) => setIl(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ülke</label>
                    <input type="text" value={ulke} onChange={(e) => setUlke(e.target.value)} className={inputClass} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              className={inputClass}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-tr ${activeTheme.gradient} ${activeTheme.hover} disabled:opacity-60`}
          >
            {loading ? 'İşleniyor…' : mode === 'register' ? 'Üyeliği Oluştur' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
