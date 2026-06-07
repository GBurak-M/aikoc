import { useEffect, useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { completePasswordReset, validateResetToken } from '../lib/passwordReset';
import BrandWordmark from './BrandWordmark';

type ThemeClasses = {
  bg: string;
  ring: string;
  gradient: string;
  logoGradient?: string;
  hover: string;
};

type Props = {
  darkMode: boolean;
  activeTheme: ThemeClasses;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function PasswordResetModal({
  darkMode,
  activeTheme,
  token,
  onClose,
  onSuccess,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  const inputClass = `w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
  }`;

  useEffect(() => {
    const result = validateResetToken(token);
    if (!result.ok) {
      setError(result.error);
      setValid(false);
      return;
    }
    setEmail(result.email);
    setValid(true);
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setLoading(true);
    setError('');
    const result = completePasswordReset(token, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl relative ${
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

        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <BrandWordmark
            size="lg"
            gradientClass={activeTheme.logoGradient ?? activeTheme.gradient}
            frameClassName={`bg-gradient-to-tr ${activeTheme.gradient}`}
          />
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mt-3 flex items-center gap-1">
            <KeyRound className="h-3.5 w-3.5" />
            Şifre Yenileme
          </p>
        </div>

        {!valid ? (
          <p className="text-sm text-rose-500 text-center">{error || 'Bağlantı doğrulanamadı.'}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-slate-500 text-center mb-2">
              <strong>{email}</strong> hesabı için yeni şifrenizi belirleyin.
            </p>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Yeni şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Şifre tekrar</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? 'Kaydediliyor…' : 'Şifremi Yenile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
