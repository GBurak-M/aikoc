import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Cell,
} from 'recharts';
import {
  Award, BookOpen, Target, Plus, Trash2, Activity,
  Moon, Sun, Share2, Languages, GraduationCap, BookMarked,
  Image, HelpCircle, Check, CheckCircle2, LogOut, LogIn, User, Settings, Edit3, Shield,
  Calendar, Send, ArrowRight, X, Calculator, FlaskConical, PenLine, Globe,
} from 'lucide-react';
import {
  generateCoachChatResponse,
  generateFullExamAnalysis,
  generateQuestionSolution,
  generateScienceBrief,
  translateAcademicTerm,
  type CoachContext,
} from './lib/localAi';
import { SCIENCE_CATEGORIES, type ScienceCategoryId } from './data/scienceDisciplines';
import {
  formatCategoryOverview,
  formatScienceTaxonomyOverview,
} from './lib/scienceKnowledge';
import SmartHubPanel from './components/SmartHubPanel';
import {
  ensureScienceTopics,
  fetchWorldSnapshot,
  isWorldCacheStale,
  LOCATION_CACHE_KEY,
  searchSettlements,
  WORLD_CACHE_KEY,
  WORLD_CACHE_TTL_MS,
  type Settlement,
  type WorldSnapshot,
} from './lib/worldData';
import {
  loadInitialExams,
  loadInitialNotes,
  loadInitialTasks,
  safeParse,
  safeSetItem,
  chatStorageKey,
} from './lib/storage';
import {
  getExamsForChart,
  getGradeSubjectAverages,
  getLatestExamByType,
  getSubjectAverages,
  sortExamsByDate,
  type Exam,
} from './lib/exams';
import {
  createEmptyScoreMap,
  getMaxQuestionsForSubject,
  getSubjectsForExamType,
} from './lib/examSubjects';
import {
  extractTextFromQuestionImage,
  formatImageSize,
  isSupportedQuestionImage,
  MAX_QUESTION_IMAGE_BYTES,
} from './lib/questionOcr';
import { buildStudyTimeReport, formatStudyTimeReport } from './lib/studyTimeAdvisor';
import { USAGE_GUIDE } from './data/usageGuide';
import { SITE_NAME, SITE_TAGLINE } from './config/site';
import MemberAuthModal from './components/MemberAuthModal';
import PasswordResetModal from './components/PasswordResetModal';
import AdminPanel from './components/AdminPanel';
import { parseResetTokenFromHash } from './lib/passwordReset';
import BrandLogo from './components/BrandLogo';
import BrandWordmark from './components/BrandWordmark';
import MemberPanel from './components/MemberPanel';
import LibraryPanel from './components/LibraryPanel';
import CoachChatCorner from './components/CoachChatCorner';
import { moderateUserInput } from './lib/chatModeration';
import { syncCrawlerWithEditorSession } from './lib/libraryCrawler';
import { isEditorSessionActive } from './lib/library';
import {
  buildCoreKnowledgeCoachBlock,
  recordChatExchange,
  setLearningAutomationEnabled,
  syncLearningAutomation,
  syncLearningWithEditorSession,
} from './lib/aiCentralLearning';
import {
  ensureBootstrapAdmins,
  getLoggedInAdmin,
  logoutAdmin,
  type AdminAccount,
} from './lib/adminAuth';
import { grantEditorSessionForAdmin, revokeEditorSessionForAdmin } from './lib/library';
import NationalExamPanel from './components/NationalExamPanel';
import {
  GUEST_PROFILE,
  getEffectiveProfile,
  isGuestProfile,
  loadUserProfile,
  type UserProfile,
} from './lib/guestProfile';
import {
  markGuestTabActive,
  registerGuestSessionCleanup,
} from './lib/guestSession';

const MEMBER_ONLY_TABS = new Set(['panel', 'sinavlar', 'uyepanel']);
import { detectExamFromText } from './data/nationalExams';
import {
  buildTrafficCoachSummary,
  getTrafficHighlights,
  logSiteEvent,
  logSiteTabVisit,
} from './lib/siteTraffic';
import {
  formatArchiveStatsSummary,
  getArchivePaperStats,
  getArchiveSubjectStats,
} from './lib/examArchive/stats';
import { buildLearningCoachSummary } from './lib/userLearning';
import { generateContextualCoachTip } from './lib/aiCoachHub';
import {
  getThemeClasses,
  getThemeSurfaceStyle,
  isThemeColor,
  THEME_LABELS,
  THEME_OPTIONS,
  type ThemeColor,
} from './lib/theme';
import {
  addProgressSnapshot,
  ensureMemberSessionForAdmin,
  getLoggedInMember,
  getMemberDisplayName,
  isAdminLinkedMemberSession,
  logMemberSearch,
  logMemberUpload,
  logMemberVisit,
  logoutMember,
  type MemberAccount,
} from './lib/membership';
import { loadCurriculumState, loadEducationProfile, setupMemberCurriculum } from './lib/memberEducation';
import { runMemberCoachOnce, startBackgroundCoach, stopBackgroundCoach } from './lib/backgroundCoach';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type NotificationState = {
  title: string;
  message: string;
} | null;

type ConfirmState = {
  title: string;
  message: string;
  onConfirm: () => void;
} | null;

function buildGuestWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    text: `Merhaba! Ben ${SITE_NAME}. 🌟\n\nBu portal seni sürekli geliştirmen için tasarlandı: ücretsiz kitap ve makaleler, ulusal sınav arşivi, planlayıcı ve AI koç sohbeti.\n\nSağ alttaki **AI Koç** köşesinden yazarak veya mikrofonla konuşarak soru sorabilirsin. Deneme takibi ve kişisel analiz için giriş yapman yeterli.`,
  };
}

function buildWelcomeMessage(profile: UserProfile): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    text: `Merhaba ${profile.name}! Ben ${SITE_NAME}, senin yapay zeka eğitim koçun. 🌟\n\nHedefin olan ${profile.targetUniv} - ${profile.targetDept} (${profile.field}) bölümüne giden bu yolda sana destek olmak için buradayım. Sınav netlerini analiz edebilir, ders başarı grafiklerini inceleyebilir ve hedeflerine ulaşman için sana özel çalışma planları önerebilirim.\n\nSol taraftaki panelden yeni denemelerini girerek ilk analizimizi başlatalım! 🚀`,
  };
}

// Geliştirilmiş Çeviri ve YKS Sözlük Kategorileri
const POPULAR_ACADEMIC_TERMS = [
  { term: 'Derivative', category: 'MAT', tr: 'Türev' },
  { term: 'Mitochondrion', category: 'BİY', tr: 'Mitokondri' },
  { term: 'Momentum', category: 'FİZ', tr: 'Momentum' },
  { term: 'Covalent Bond', category: 'KİM', tr: 'Kovalent Bağ' },
  { term: 'Osmotic Pressure', category: 'BİY', tr: 'Ozmotik Basınç' },
  { term: 'Acceleration', category: 'FİZ', tr: 'İvme' }
];

// Çözemediğim Sorular İçin Örnek Soru Listesi
const SAMPLE_UNSOLVED_QUESTIONS = [
  {
    text: "f(x) = 3x^2 - 4x + 5 fonksiyonunun x=2 noktasındaki teğetinin eğimi kaçtır?",
    subject: "Matematik"
  },
  {
    text: "Sürtünmesiz yatay düzlemde 2 kg kütleli bir cisme 10 N büyüklüğündeki kuvvet 5 saniye boyunca uygulanıyor. Cismin momentumundaki değişim kaç kg.m/s olur?",
    subject: "Fizik"
  },
  {
    text: "Bir hücrenin mitokondri faaliyetinin artması durumunda hücre içi pH, osmotik basınç ve turgor basıncı nasıl değişir?",
    subject: "Biyoloji"
  }
];

export default function App() {
  const profileNameRef = useRef<string | null>(null);

  // Giriş / Profil Bilgileri Eyaleti
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const loggedMember = getLoggedInMember();
    return loggedMember ? loadUserProfile() : { ...GUEST_PROFILE };
  });
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Giriş Yaparken Form Değişkenleri
  const [setupName, setSetupName] = useState('');
  const [setupField, setSetupField] = useState('Sayısal');
  const [setupTargetUniv, setSetupTargetUniv] = useState('');
  const [setupTargetDept, setSetupTargetDept] = useState('');
  const [setupDailyTargetHours, setSetupDailyTargetHours] = useState('4');

  // Profil Düzenleme Modalı Eyaleti
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Özel Bildirim/Modal Durumları (Alert yerine kullanmak için)
  const [notification, setNotification] = useState<NotificationState>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>(null);

  // Eyalet (State) Yönetimi
  const [exams, setExams] = useState<Exam[]>(() => loadInitialExams());

  const [tasks, setTasks] = useState(() => loadInitialTasks());

  const [notes, setNotes] = useState(() => loadInitialNotes());

  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    const saved = safeParse<string>('guidance_core_theme', 'ocean');
    return isThemeColor(saved) ? saved : 'ocean';
  });
  const [darkMode, setDarkMode] = useState(() =>
    safeParse('guidance_core_dark_mode', false),
  );
  const [activeTab, setActiveTab] = useState(() =>
    getLoggedInMember() ? 'panel' : 'merkez',
  );
  
  // Sınav Formu State'leri
  const [examType, setExamType] = useState('TYT'); // TYT veya AYT
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examNotes, setExamNotes] = useState('');
  
  // Derslere göre doğru yanlış state'leri
  const [tytScores, setTytScores] = useState(() => createEmptyScoreMap('TYT'));
  const [aytScores, setAytScores] = useState(() => createEmptyScoreMap('AYT'));

  // AI Koç State'leri
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiLoadingMode, setAiLoadingMode] = useState<'chat' | 'analysis' | null>(null);
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [coachCornerOpen, setCoachCornerOpen] = useState(false);
  const [autoSpeakCoach, setAutoSpeakCoach] = useState(false);
  
  // Varsayılan selamlamanın kullanıcıya göre özelleştirilmesi için chat geçmişi
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [archiveStatsTick, setArchiveStatsTick] = useState(0);
  const coachedTabsRef = useRef<Set<string>>(new Set());

  // Yeni Not State'leri
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState('blue');

  // Yeni Görev State'leri
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('GENEL');

  // GELİŞTİRİLMİŞ ÇEVİRİ STATE'LERİ
  const [translateText, setTranslateText] = useState('');
  const [lastTranslatedTerm, setLastTranslatedTerm] = useState('');
  const [translatedResult, setTranslatedResult] = useState('');
  const [translateDirection, setTranslateDirection] = useState('TR_EN'); // TR_EN veya EN_TR
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [translationHistory, setTranslationHistory] = useState(() =>
    safeParse('guidance_core_trans_history', []),
  );

  // SORU ÇÖZÜCÜ STATE'LERİ
  const [questionText, setQuestionText] = useState('');
  const [questionSubject, setQuestionSubject] = useState('Matematik');
  const [questionImage, setQuestionImage] = useState(null); // base64 string
  const [questionImageName, setQuestionImageName] = useState('');
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [activeSolution, setActiveSolution] = useState('');
  const [unsolvedArchive, setUnsolvedArchive] = useState(() =>
    safeParse('guidance_core_unsolved_archive', []),
  );

  // Kütüphane Modal State'i
  // Zeka Merkezi — konum, hava, namaz, takvim, bilim
  const [settlement, setSettlement] = useState<Settlement | null>(() =>
    safeParse<Settlement | null>(LOCATION_CACHE_KEY, null),
  );
  const [worldSnapshot, setWorldSnapshot] = useState<WorldSnapshot | null>(() => {
    const cached = safeParse<WorldSnapshot | null>(WORLD_CACHE_KEY, null);
    if (cached && !isWorldCacheStale(cached.fetchedAt, cached)) return ensureScienceTopics(cached);
    return null;
  });
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<Settlement[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [loadingWorld, setLoadingWorld] = useState(false);
  const [scienceBrief, setScienceBrief] = useState('');
  const [loadingScienceBrief, setLoadingScienceBrief] = useState(false);

  const [member, setMember] = useState<MemberAccount | null>(() => getLoggedInMember());
  const [admin, setAdmin] = useState<AdminAccount | null>(() => {
    ensureBootstrapAdmins();
    return getLoggedInAdmin();
  });
  const [showMemberAuth, setShowMemberAuth] = useState(false);
  const [memberAuthMode, setMemberAuthMode] = useState<'login' | 'register' | 'forgot'>('register');
  const [passwordResetToken, setPasswordResetToken] = useState<string | null>(() =>
    parseResetTokenFromHash(window.location.hash),
  );
  const [memberActivityTick, setMemberActivityTick] = useState(0);
  const [curriculumTick, setCurriculumTick] = useState(0);

  const refreshMemberActivity = () => setMemberActivityTick((t) => t + 1);

  useEffect(() => registerGuestSessionCleanup(), []);

  useEffect(() => {
    const syncHash = () => {
      const token = parseResetTokenFromHash(window.location.hash);
      setPasswordResetToken(token);
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    if (!member && MEMBER_ONLY_TABS.has(activeTab)) {
      setActiveTab('merkez');
    }
  }, [member, activeTab]);

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const handleAuthButton = () => {
    if (member) {
      requestConfirm(
        'Çıkış Yap',
        'Üyelik oturumunuz kapatılacak. Deneme ve not verileriniz cihazınızda kalır.',
        () => {
          stopBackgroundCoach();
          logoutMember();
          setMember(null);
          resetGuestSession();
          if (activeTab === 'uyepanel') setActiveTab('panel');
          setConfirmDialog(null);
        },
      );
      return;
    }
    openMemberAuth('register');
  };

  const openMemberAuth = (mode: 'login' | 'register' | 'forgot' = 'register') => {
    setMemberAuthMode(mode);
    setShowMemberAuth(true);
  };

  /** Üye çıkışında: profil/sohbet misafire döner; cihazdaki deneme verisi kalır. */
  const resetGuestSession = () => {
    profileNameRef.current = null;
    coachedTabsRef.current = new Set();
    setUserProfile({ ...GUEST_PROFILE });
    safeSetItem('guidance_core_profile', GUEST_PROFILE);
    setChatHistory([buildGuestWelcomeMessage()]);
    markGuestTabActive();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) {
      openMemberAuth('register');
      return;
    }
    if (!setupName.trim() || !setupTargetUniv.trim() || !setupTargetDept.trim()) return;

    const newProfile: UserProfile = {
      name: setupName.trim(),
      field: setupField,
      targetUniv: setupTargetUniv.trim(),
      targetDept: setupTargetDept.trim(),
      dailyTargetHours: setupDailyTargetHours,
    };

    setUserProfile(newProfile);
    safeSetItem('guidance_core_profile', newProfile);
    logSiteEvent('profile_edit', {
      tab: activeTab,
      detail: `${newProfile.field} ${newProfile.targetDept}`,
    });
    setIsEditingProfile(false);
  };

  // Koyu tema: html sınıfı + kalıcı kayıt
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    safeSetItem('guidance_core_dark_mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    safeSetItem('guidance_core_theme', themeColor);
  }, [themeColor]);

  const effectiveProfile = getEffectiveProfile(Boolean(member), userProfile);

  useEffect(() => {
    if (!member && chatHistory.length === 0) {
      setChatHistory([buildGuestWelcomeMessage()]);
    }
  }, []);

  useEffect(() => {
    if (admin) {
      setLearningAutomationEnabled(true);
      grantEditorSessionForAdmin();
      syncCrawlerWithEditorSession();
      syncLearningAutomation();
    } else if (isEditorSessionActive()) {
      syncCrawlerWithEditorSession();
      syncLearningWithEditorSession();
    }
  }, [admin?.id]);

  useEffect(() => {
    if (!admin) {
      setLearningAutomationEnabled(false);
      if (!isEditorSessionActive()) syncLearningAutomation();
    }
  }, [admin]);

  useEffect(() => {
    if (!member) return;
    const chatKeyId = userProfile.name;
    if (profileNameRef.current === chatKeyId) return;

    profileNameRef.current = chatKeyId;
    const storageKey = chatStorageKey(chatKeyId);
    const savedChat = safeParse<ChatMessage[]>(storageKey, []);
    setChatHistory(savedChat.length > 0 ? savedChat : [buildWelcomeMessage(userProfile)]);
  }, [member, userProfile]);

  useEffect(() => {
    if (!member || chatHistory.length === 0) return;
    safeSetItem(chatStorageKey(userProfile.name), chatHistory);
  }, [chatHistory, member, userProfile.name]);

  // Yerel hafızaya kaydetme
  useEffect(() => {
    safeSetItem('guidance_core_exams', exams);
  }, [exams]);

  useEffect(() => {
    safeSetItem('guidance_core_tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    safeSetItem('guidance_core_notes', notes);
  }, [notes]);

  useEffect(() => {
    safeSetItem('guidance_core_trans_history', translationHistory);
  }, [translationHistory]);

  useEffect(() => {
    const archiveWithoutImages = unsolvedArchive.map(({ image, ...rest }) => ({
      ...rest,
      hasImage: Boolean(image),
    }));
    safeSetItem('guidance_core_unsolved_archive', archiveWithoutImages);
  }, [unsolvedArchive]);

  const refreshWorldData = async (target: Settlement) => {
    setLoadingWorld(true);
    try {
      const snapshot = await fetchWorldSnapshot(target);
      setWorldSnapshot(snapshot);
      safeSetItem(WORLD_CACHE_KEY, snapshot);
      safeSetItem(LOCATION_CACHE_KEY, target);
    } catch (error) {
      console.error(error);
      setNotification({
        title: 'ZEKA MERKEZİ',
        message: 'Hava, namaz veya bilim verileri yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.',
      });
    } finally {
      setLoadingWorld(false);
    }
  };

  useEffect(() => {
    if (!settlement) return;
    if (!worldSnapshot || isWorldCacheStale(worldSnapshot.fetchedAt, worldSnapshot)) {
      refreshWorldData(settlement);
    }
  }, [settlement]);

  useEffect(() => {
    if (!settlement) return;
    const interval = setInterval(() => {
      if (!worldSnapshot || isWorldCacheStale(worldSnapshot.fetchedAt, worldSnapshot)) {
        refreshWorldData(settlement);
      }
    }, WORLD_CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, [settlement, worldSnapshot]);

  useEffect(() => {
    const q = locationQuery.trim();
    if (q.length < 2) {
      setLocationResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        const results = await searchSettlements(q);
        setLocationResults(results);
      } catch {
        setLocationResults([]);
      } finally {
        setSearchingLocation(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  const handleSelectSettlement = (s: Settlement) => {
    setSettlement(s);
    setLocationQuery(s.displayName);
    setLocationResults([]);
    refreshWorldData(s);
    if (member) logMemberSearch(member.id, s.displayName, 'konum');
  };

  useEffect(() => {
    if (activeTab === 'uyepanel') return;
    logSiteTabVisit(activeTab);
    if (member) {
      logMemberVisit(member.id, activeTab);
      refreshMemberActivity();
    }
  }, [activeTab, member?.id]);

  const activateMemberExperience = async (loggedMember: MemberAccount) => {
    setMember(loggedMember);
    if (!loadEducationProfile(loggedMember.id)) {
      await setupMemberCurriculum(loggedMember.id, {
        grade: '11',
        ulke: 'Türkiye',
        registeredAt: loggedMember.createdAt,
      });
    }
    runMemberCoachOnce({
      member: loggedMember,
      exams,
      completedTasks: tasks.filter((t: { done: boolean }) => t.done).length,
      totalTasks: tasks.length,
    });
    setCurriculumTick((t) => t + 1);
    const stored = loadUserProfile();
    const profile: UserProfile = isGuestProfile(stored)
      ? {
          name: loggedMember.firstName,
          field: 'Sayısal',
          targetUniv: 'Belirtilmedi',
          targetDept: 'Belirtilmedi',
          dailyTargetHours: '4',
        }
      : stored;
    setUserProfile(profile);
    safeSetItem('guidance_core_profile', profile);
    profileNameRef.current = null;
  };

  const handleMemberAuthSuccess = async (loggedMember: MemberAccount) => {
    logSiteEvent('member_login', { tab: activeTab, detail: loggedMember.email });
    await activateMemberExperience(loggedMember);
    setActiveTab('panel');
  };

  const handleMemberLogout = () => {
    stopBackgroundCoach();
    logoutMember();
    setMember(null);
    resetGuestSession();
    if (activeTab === 'uyepanel') setActiveTab('panel');
  };

  const handleAdminAuthSuccess = async (loggedAdmin: AdminAccount) => {
    setAdmin(loggedAdmin);
    logSiteEvent('admin_login', { tab: activeTab, detail: loggedAdmin.email });
    const linkedMember = ensureMemberSessionForAdmin(loggedAdmin);
    await activateMemberExperience(linkedMember);
    setLearningAutomationEnabled(true);
    grantEditorSessionForAdmin();
    syncCrawlerWithEditorSession();
    syncLearningAutomation();
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    if (admin && isAdminLinkedMemberSession(admin.email)) {
      stopBackgroundCoach();
      logoutMember();
      setMember(null);
      resetGuestSession();
    }
    logoutAdmin();
    setAdmin(null);
    setLearningAutomationEnabled(false);
    revokeEditorSessionForAdmin();
    syncCrawlerWithEditorSession();
    syncLearningAutomation();
    if (activeTab === 'admin' || MEMBER_ONLY_TABS.has(activeTab)) setActiveTab('merkez');
  };

  useEffect(() => {
    if (!admin || member) return;
    const linkedMember = ensureMemberSessionForAdmin(admin);
    void activateMemberExperience(linkedMember);
  }, [admin?.id, member?.id]);

  useEffect(() => {
    if (!member) return;
    if (!loadEducationProfile(member.id)) {
      void setupMemberCurriculum(member.id, {
        grade: '11',
        ulke: 'Türkiye',
        registeredAt: member.createdAt,
      }).then(() => setCurriculumTick((t) => t + 1));
    }
  }, [member?.id]);

  useEffect(() => {
    if (!member) {
      stopBackgroundCoach();
      return;
    }
    startBackgroundCoach(
      () => ({
        member,
        exams,
        completedTasks: tasks.filter((t: { done: boolean }) => t.done).length,
        totalTasks: tasks.length,
      }),
      () => setCurriculumTick((t) => t + 1),
    );
    return () => stopBackgroundCoach();
  }, [member?.id, exams, tasks]);

  const handleScienceBrief = async () => {
    if (!worldSnapshot) return;
    setLoadingScienceBrief(true);
    try {
      const brief = await generateScienceBrief(worldSnapshot);
      setScienceBrief(brief);
    } finally {
      setLoadingScienceBrief(false);
    }
  };

  // Hızlı Seçim Kısmı İçin Şablonlar
  const fastExams = ['3D Simülasyon', 'Özdebir', 'Bilgi Sarmal', 'Limit', 'Altın Karma'];

  const activeTheme = getThemeClasses(themeColor);
  const surfaceStyle = getThemeSurfaceStyle(themeColor, darkMode);

  // Doğru/Yanlış değiştiğinde Net hesaplama (Net = Doğru - Yanlış * 0.25)
  const calculateNet = (correct, wrong) => {
    const net = correct - (wrong * 0.25);
    return Math.max(0, parseFloat(net.toFixed(2)));
  };

  const handleScoreChange = (subject, field, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    const maxQ = getMaxQuestionsForSubject(examType, subject);

    if (examType === 'TYT') {
      const current = { ...tytScores[subject] };
      current[field] = numValue;

      if (current.correct + current.wrong > maxQ) {
        if (field === 'correct') current.wrong = maxQ - current.correct;
        else current.correct = maxQ - current.wrong;
      }
      setTytScores({ ...tytScores, [subject]: current });
    } else {
      const current = { ...aytScores[subject] };
      current[field] = numValue;

      if (current.correct + current.wrong > maxQ) {
        if (field === 'correct') current.wrong = maxQ - current.correct;
        else current.correct = maxQ - current.wrong;
      }
      setAytScores({ ...aytScores, [subject]: current });
    }
  };

  // Aktif girmekte olan netleri dinamik izleme
  const getLiveStats = () => {
    const currentScores = examType === 'TYT' ? tytScores : aytScores;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalNet = 0;

    Object.keys(currentScores).forEach(sub => {
      totalCorrect += currentScores[sub].correct;
      totalWrong += currentScores[sub].wrong;
      totalNet += calculateNet(currentScores[sub].correct, currentScores[sub].wrong);
    });

    const accuracy = totalCorrect + totalWrong > 0 
      ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) 
      : 0;

    const factor = examType === 'TYT' ? 3.33 : 3.0; 
    const estimatedScore = Math.min(500, Math.round(100 + (totalNet * factor)));

    return {
      net: parseFloat(totalNet.toFixed(2)),
      accuracy: accuracy,
      score: estimatedScore
    };
  };

  const liveStats = getLiveStats();

  const memberGrade = useMemo(() => {
    if (!member) return null;
    const edu = loadEducationProfile(member.id);
    return edu?.effectiveGrade ?? null;
  }, [member?.id, memberActivityTick]);

  const subjectAverages = useMemo(() => {
    if (memberGrade) return getGradeSubjectAverages(exams, memberGrade);
    return getSubjectAverages(exams);
  }, [exams, memberGrade]);

  const studyTimeReport = useMemo(() => {
    if (!memberGrade) return null;
    return buildStudyTimeReport(exams, memberGrade);
  }, [exams, memberGrade]);

  const chartExams = getExamsForChart(exams);

  const subjectBarStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('matematik')) return { bar: 'bg-indigo-500', Icon: Calculator };
    if (n.includes('türk') || n.includes('edebiyat')) return { bar: 'bg-rose-500', Icon: PenLine };
    if (n.includes('fizik') || n.includes('kimya') || n.includes('biyoloji') || n.includes('fen')) {
      return { bar: 'bg-emerald-500', Icon: FlaskConical };
    }
    return { bar: 'bg-amber-500', Icon: Globe };
  };

  // Radar Grafiği için Verileri Formatlama
  const getRadarData = () => {
    return subjectAverages.map((item) => ({
      subject: item.subject.length > 12 ? `${item.subject.slice(0, 11)}…` : item.subject,
      'Ort. Alanı': item.percentage,
      fullMark: 100,
    }));
  };

  const radarData = getRadarData();

  const archiveSubjectStats = useMemo(
    () => getArchiveSubjectStats(),
    [archiveStatsTick],
  );
  const archivePaperStats = useMemo(
    () => getArchivePaperStats(),
    [archiveStatsTick],
  );
  const archiveChartData = useMemo(
    () =>
      archiveSubjectStats.map((s) => ({
        subject: s.subject.length > 10 ? `${s.subject.slice(0, 9)}…` : s.subject,
        fullSubject: s.subject,
        accuracy: s.accuracy,
        correct: s.correct,
        wrong: s.wrong,
        total: s.total,
      })),
    [archiveSubjectStats],
  );

  const bumpArchiveStats = useCallback(() => {
    setArchiveStatsTick((n) => n + 1);
  }, []);

  const pushCoachInsight = useCallback((text: string) => {
    if (!member || !text.trim()) return;
    setChatHistory((prev) => [
      ...prev,
      { id: `coach-${Date.now()}`, role: 'assistant', text },
    ]);
    logSiteEvent('chat_coach', { tab: activeTab, detail: text.slice(0, 120) });
  }, [activeTab, member]);

  // Sınavı Ekleme Fonksiyonu
  const handleAddExam = (e) => {
    e.preventDefault();
    if (!examName.trim()) return;

    const currentScores = examType === 'TYT' ? tytScores : aytScores;
    const formattedScores = {};
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalNet = 0;

    Object.keys(currentScores).forEach(sub => {
      const corr = currentScores[sub].correct;
      const wrg = currentScores[sub].wrong;
      const nt = calculateNet(corr, wrg);
      
      formattedScores[sub] = { correct: corr, wrong: wrg, net: nt };
      totalCorrect += corr;
      totalWrong += wrg;
      totalNet += nt;
    });

    const accuracy = totalCorrect + totalWrong > 0 
      ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) 
      : 0;

    const newExam = {
      id: Date.now().toString(),
      name: examName.toUpperCase(),
      type: examType,
      date: examDate.split('-').reverse().join('.'),
      notes: examNotes,
      scores: formattedScores,
      totalNet: parseFloat(totalNet.toFixed(2)),
      accuracy: accuracy
    };

    const nextExams = [newExam, ...exams];
    setExams(nextExams);
    logSiteEvent('exam_add', {
      tab: activeTab,
      detail: `${newExam.type} ${newExam.name} ${newExam.totalNet} net`,
    });
    const examTip = generateContextualCoachTip(
      'exam_add',
      `${newExam.type} ${newExam.totalNet} net`,
      buildCoachContext(),
    );
    if (examTip) pushCoachInsight(examTip);

    if (member) {
      logMemberUpload(member.id, 'sinav', newExam.name, `${newExam.type} · ${newExam.totalNet} net`);
      const avgNet = parseFloat(
        (nextExams.reduce((a, e) => a + e.totalNet, 0) / nextExams.length).toFixed(1),
      );
      const avgAcc = Math.round(
        nextExams.reduce((a, e) => a + e.accuracy, 0) / nextExams.length,
      );
      addProgressSnapshot(member.id, {
        examCount: nextExams.length,
        avgNet,
        avgAccuracy: avgAcc,
        completedTasks: tasks.filter((t: { done: boolean }) => t.done).length,
        totalTasks: tasks.length,
      });
      refreshMemberActivity();
    }

    // Formu Temizleme ve Başarılı Analiz Mesajı tetikleme
    setExamName('');
    setExamNotes('');
    setTytScores(createEmptyScoreMap('TYT'));
    setAytScores(createEmptyScoreMap('AYT'));

    // Otomatik AI Koç Yorumu
    const grade = member ? loadEducationProfile(member.id)?.effectiveGrade : null;
    const studyBlock = grade ? `\n\n${formatStudyTimeReport(buildStudyTimeReport(nextExams, grade))}` : '';
    const introText = `Harika! "${newExam.name}" isimli yeni deneme sınavı sonucunu başarıyla kaydettim.\n\n📊 Sınav Özetin:\n• Tür: ${newExam.type}\n• Toplam Net: ${newExam.totalNet}\n• Doğruluk Oranı: %${newExam.accuracy}\n\nÖzellikle ${Object.entries(newExam.scores).map(([k,v]) => `${k} dersinde ${v.net} net`).join(', ')} yaptığını görüyorum. Bu veriyi gelişim geçmişine işledim.${studyBlock}`;
    setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: introText }]);
  };

  const handleDeleteExam = (id: string, examName: string) => {
    requestConfirm(
      'Denemeyi Sil',
      `"${examName}" kaydını silmek istediğinize emin misiniz?`,
      () => {
        setExams(exams.filter(exam => exam.id !== id));
        setConfirmDialog(null);
      },
    );
  };

  // Genel Metrik Hesaplamaları
  const getGeneralMetrics = () => {
    if (exams.length === 0) {
      return { avgNet: 0, avgAccuracy: 0, examCount: 0, estimateRank: 'Sınav Ekleyin' };
    }
    
    const totalNet = exams.reduce((acc, exam) => acc + exam.totalNet, 0);
    const avgNet = parseFloat((totalNet / exams.length).toFixed(1));

    const totalAcc = exams.reduce((acc, exam) => acc + exam.accuracy, 0);
    const avgAccuracy = Math.round(totalAcc / exams.length);

    let rankEstimate = 'Sınav Ekleyin';
    const latestTytNet = getLatestExamByType(exams, 'TYT')?.totalNet ?? 0;
    const latestAytNet = getLatestExamByType(exams, 'AYT')?.totalNet ?? 0;

    if (latestTytNet > 0 || latestAytNet > 0) {
      const weight = (latestTytNet * 1.5) + (latestAytNet * 2.5);
      if (weight >= 280) rankEstimate = 'İlk 1.000 (Hedef)';
      else if (weight >= 240) rankEstimate = 'İlk 5.000 (Harika)';
      else if (weight >= 200) rankEstimate = 'İlk 15.000 (Tahmini)';
      else if (weight >= 160) rankEstimate = 'İlk 50.000 (Gelişiyor)';
      else if (weight >= 100) rankEstimate = 'İlk 100.000 (Yolun Başında)';
      else rankEstimate = 'İlk 250.000+';
    }

    return {
      avgNet,
      avgAccuracy,
      examCount: exams.length,
      estimateRank: rankEstimate
    };
  };

  const metrics = getGeneralMetrics();

  const getRecentExamSummary = () =>
    sortExamsByDate(exams)
      .slice(-3)
      .map((e) => `${e.name} (${e.type}): ${e.totalNet} Net`)
      .join(', ');

  const buildCoachContext = (): CoachContext => {
    let curriculumNote: string | undefined;
    if (member) {
      const state = loadCurriculumState(member.id);
      const report = state?.coachReports[0];
      const edu = state?.education;
      if (report && edu) {
        const weak = report.prioritySubjects
          .slice(0, 2)
          .map((p) => `${p.subject}: ${p.weakTopics.slice(0, 2).join(', ')}`)
          .join(' · ');
        curriculumNote = `${edu.effectiveGrade === 'mezun' ? 'Mezun' : `${edu.effectiveGrade}. sınıf`} · ${weak || report.summary.slice(0, 120)}`;
      }
    }
    const trafficSummary = buildTrafficCoachSummary();
    const targetExam =
      detectExamFromText(effectiveProfile.targetDept) ??
      detectExamFromText(effectiveProfile.field) ??
      detectExamFromText(trafficSummary) ??
      null;

    const archiveStatsSummary = formatArchiveStatsSummary();
    const learningSummary = buildLearningCoachSummary(
      getArchiveSubjectStats(),
      subjectAverages,
      worldSnapshot,
    );

    return {
      profile: effectiveProfile,
      exams,
      subjectAverages,
      pendingTasks: tasks.filter((t: { done: boolean }) => !t.done).length,
      completedTasks: tasks.filter((t: { done: boolean }) => t.done).length,
      recentExamSummary: getRecentExamSummary(),
      estimateRank: metrics.estimateRank,
      avgNet: metrics.avgNet,
      world: worldSnapshot,
      curriculumNote,
      trafficSummary,
      targetExam,
      archiveStatsSummary,
      learningSummary,
      centralAiInsight: buildCoreKnowledgeCoachBlock(),
    };
  };

  const askLocalCoach = async (userMessage: string) => {
    const context = buildCoachContext();
    const history = chatHistory
      .filter((m) => m.id !== 'welcome')
      .slice(-12)
      .map((m) => ({ role: m.role, text: m.text }));

    setLoadingAi(true);
    setAiLoadingMode('chat');

    try {
      const aiText = await generateCoachChatResponse(userMessage, context, history);
      recordChatExchange(userMessage, aiText, { memberType: member ? 'member' : 'guest' });
      setChatHistory((prev) => [...prev, { id: Date.now().toString(), role: 'assistant', text: aiText }]);
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', text: `${SITE_NAME} yanıt üretemedi. Lütfen tekrar deneyin.` },
      ]);
    } finally {
      setLoadingAi(false);
      setAiLoadingMode(null);
    }
  };

  const triggerFullAnalysis = async () => {
    if (exams.length === 0) {
      setAiAnalysis('Sistemde kayıtlı deneme sınavı bulunamadı. Lütfen analiz için önce en az bir adet deneme sınavı sonucu giriniz.');
      return;
    }

    setLoadingAi(true);
    setAiLoadingMode('analysis');
    logSiteEvent('exam_analysis', { tab: activeTab, detail: `${exams.length} deneme` });
    try {
      const analysis = await generateFullExamAnalysis(exams, effectiveProfile);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error(error);
      setAiAnalysis('Deneme analizi oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoadingAi(false);
      setAiLoadingMode(null);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatQuery.trim()) return;

    const userMessage = aiChatQuery.trim();
    const moderation = moderateUserInput(userMessage);
    if (!moderation.allowed) {
      logSiteEvent('chat_moderated', { tab: activeTab, detail: moderation.reason });
      setChatHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'user', text: userMessage },
        { id: `mod-${Date.now()}`, role: 'assistant', text: moderation.userMessage },
      ]);
      setAiChatQuery('');
      return;
    }

    setChatHistory((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: userMessage }]);
    setAiChatQuery('');
    logSiteEvent('chat_user', { tab: activeTab, detail: userMessage.slice(0, 120) });

    askLocalCoach(userMessage);
  };

  // Önerilen Hazır Sorulardan Birine Tıklama
  const handleSuggestedQuestion = (question: string) => {
    const moderation = moderateUserInput(question);
    if (!moderation.allowed) {
      logSiteEvent('chat_moderated', { tab: activeTab, detail: moderation.reason });
      setChatHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'user', text: question },
        { id: `mod-${Date.now()}`, role: 'assistant', text: moderation.userMessage },
      ]);
      return;
    }
    setChatHistory((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: question }]);
    logSiteEvent('chat_user', { tab: activeTab, detail: question.slice(0, 120) });
    askLocalCoach(question);
  };

  // GELİŞTİRİLMİŞ AI AKADEMİK ÇEVİRİ VE ANALİZ FONKSİYONU
  const handleAcademicTranslation = async (
    e: React.FormEvent | null,
    customTerm: string | null = null,
  ) => {
    if (e) e.preventDefault();

    const targetTerm = (customTerm || translateText).trim();
    if (!targetTerm) return;

    setLoadingTranslation(true);
    setLastTranslatedTerm(targetTerm);
    if (!customTerm) setTranslateText(targetTerm);

    try {
      const translation = await translateAcademicTerm(
        targetTerm,
        translateDirection as 'TR_EN' | 'EN_TR',
      );
      setTranslatedResult(translation);

      const exists = translationHistory.some(
        (item: { term: string }) => item.term.toLowerCase() === targetTerm.toLowerCase(),
      );
      if (!exists) {
        const historyItem = {
          id: Date.now().toString(),
          term: targetTerm.toUpperCase(),
          direction: translateDirection,
          result: translation,
        };
        setTranslationHistory((prev) => [historyItem, ...prev.slice(0, 4)]);
      }
      logSiteEvent('dictionary_search', { tab: activeTab, detail: targetTerm });
      if (member) {
        logMemberSearch(member.id, targetTerm, 'sozluk');
        refreshMemberActivity();
      }
    } catch (error) {
      console.error(error);
      setTranslatedResult('Çeviri oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoadingTranslation(false);
    }
  };

  // Çeviriyi Doğrudan Not Defterine Ekleme Özelliği
  const handleSaveTranslationToNotes = () => {
    if (!translatedResult || !lastTranslatedTerm) return;

    const newNote = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('tr-TR'),
      title: `AKADEMİK SÖZLÜK: ${lastTranslatedTerm.toUpperCase()}`,
      content: translatedResult,
      color: 'teal',
    };

    setNotes([newNote, ...notes]);
    setNotification({
      title: 'NOTLARIMA EKLENDİ! 📝',
      message: `"${lastTranslatedTerm}" terimine ait tüm çeviri, tanım ve YKS ipucu detayları başarıyla Not Defterim sekmesine eklendi.`,
    });
  };

  // YENİ ÖZELLİK: AI SORU ÇÖZÜCÜ FONKSİYONU
  const handleSolveQuestion = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    if (!questionText.trim() && !questionImage) {
      setNotification({
        title: 'EKSİK BİLGİ',
        message: 'Lütfen çözülmesi için bir soru metni girin veya sorunun fotoğrafını yükleyin.',
      });
      return;
    }

    setLoadingSolution(true);
    setOcrProgress(0);

    try {
      let resolvedText = questionText.trim();
      let fromOcr = false;

      if (!resolvedText && questionImage) {
        resolvedText = await extractTextFromQuestionImage(questionImage, setOcrProgress);
        fromOcr = Boolean(resolvedText);
        if (resolvedText && !questionText.trim()) {
          setQuestionText(resolvedText);
        }
      }

      if (!resolvedText) {
        setNotification({
          title: 'METİN OKUNAMADI',
          message: 'Fotoğraftan metin çıkarılamadı. Soruyu metin kutusuna yazın veya daha net bir fotoğraf yükleyin.',
        });
        setLoadingSolution(false);
        return;
      }

      const solutionText = await generateQuestionSolution(
        questionSubject,
        resolvedText,
        { fromOcr, imageDataUrl: questionImage },
      );
      setActiveSolution(solutionText);

      const archiveItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('tr-TR'),
        subject: questionSubject,
        question: questionText || '(Görsel Soru)',
        image: questionImage,
        solution: solutionText,
        status: 'Tekrar Et',
      };

      const questionKey = (questionText || '(Görsel Soru)').trim().toLocaleLowerCase('tr-TR');
      setUnsolvedArchive((prev) => {
        const existingIdx = prev.findIndex(
          (item) =>
            item.subject === questionSubject &&
            item.question.trim().toLocaleLowerCase('tr-TR') === questionKey,
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...archiveItem, id: updated[existingIdx].id };
          return updated;
        }
        return [archiveItem, ...prev];
      });
      logSiteEvent('question_solve', {
        tab: activeTab,
        detail: `${questionSubject} ${(questionText || 'görsel').slice(0, 80)}`,
      });
      if (member) {
        logMemberUpload(
          member.id,
          questionImage ? 'soru_gorsel' : 'soru_metin',
          questionSubject,
          questionText ? questionText.slice(0, 80) : 'Görsel soru',
        );
        refreshMemberActivity();
      }
    } catch (error) {
      console.error('Soru çözücü hatası:', error);
      setActiveSolution(
        'Soru çözümü şu an üretilemedi. Metni kısaltıp tekrar deneyin veya alttaki örnek sorulardan birini seçin. Sorun sürerse sayfayı yenileyin (Ctrl+F5).',
      );
    } finally {
      setLoadingSolution(false);
    }
  };

  // Görsel Dosya Yükleme İşleyicisi
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isSupportedQuestionImage(file)) {
      setNotification({
        title: 'DESTEKLENMEYEN FORMAT',
        message: 'JPEG, PNG, GIF, WebP, BMP, TIFF, HEIC, AVIF veya SVG yükleyebilirsiniz.',
      });
      return;
    }

    if (file.size > MAX_QUESTION_IMAGE_BYTES) {
      setNotification({
        title: 'DOSYA ÇOK BÜYÜK',
        message: `Lütfen ${formatImageSize(MAX_QUESTION_IMAGE_BYTES)} altında bir görsel yükleyin.`,
      });
      return;
    }

    setQuestionImageName(`${file.name} (${formatImageSize(file.size)})`);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQuestionImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Soru Durumu Değiştirme
  const toggleQuestionStatus = (id) => {
    setUnsolvedArchive(unsolvedArchive.map(item => {
      if (item.id === id) {
        const newStatus = item.status === 'Öğrendim' ? 'Tekrar Et' : 'Öğrendim';
        return { ...item, status: newStatus };
      }
      return item;
    }));
  };

  // Arşivden Soru Silme
  const deleteFromArchive = (id: string) => {
    requestConfirm(
      'Arşivden Sil',
      'Bu soru kaydını arşivden silmek istediğinize emin misiniz?',
      () => {
        setUnsolvedArchive(unsolvedArchive.filter((item) => item.id !== id));
        setConfirmDialog(null);
      },
    );
  };

  // Çözümü Notlarıma Kaydetme
  const handleSaveSolutionToNotes = (title, solution) => {
    const newNote = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('tr-TR'),
      title: `SORU ÇÖZÜMÜ: ${title.substring(0, 20).toUpperCase()}...`,
      content: solution,
      color: 'blue'
    };
    setNotes([newNote, ...notes]);
    setNotification({
      title: "BAŞARIYLA EKLENDİ 📝",
      message: "Bu sorunun adım adım çözümü Not Defterim sekmesine eklendi!"
    });
  };

  // Haftalık Hedef İşlemleri
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      text: newTaskText,
      category: newTaskCategory,
      done: false
    };

    setTasks([...tasks, newTask]);
    setNewTaskText('');
    logSiteEvent('task_add', { tab: activeTab, detail: newTask.text.slice(0, 80) });
  };

  const toggleTaskDone = (id) => {
    const task = tasks.find((t) => t.id === id);
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
    if (task) {
      logSiteEvent('task_toggle', {
        tab: activeTab,
        detail: `${task.done ? 'geri al' : 'tamamla'}: ${task.text.slice(0, 60)}`,
      });
    }
  };

  const deleteTask = (id: string, taskText: string) => {
    requestConfirm(
      'Görevi Sil',
      `"${taskText}" görevini silmek istediğinize emin misiniz?`,
      () => {
        setTasks(tasks.filter((t) => t.id !== id));
        setConfirmDialog(null);
      },
    );
  };

  const completedTasksCount = tasks.filter(t => t.done).length;

  // Not Defteri İşlemleri
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('tr-TR'),
      title: newNoteTitle.toUpperCase(),
      content: newNoteContent,
      color: newNoteColor
    };

    setNotes([newNote, ...notes]);
    logSiteEvent('note_add', { tab: activeTab, detail: newNote.title.slice(0, 80) });
    if (member) {
      logMemberUpload(member.id, 'not', newNote.title);
      refreshMemberActivity();
    }
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const deleteNote = (id: string, noteTitle: string) => {
    requestConfirm(
      'Notu Sil',
      `"${noteTitle}" notunu silmek istediğinize emin misiniz?`,
      () => {
        setNotes(notes.filter((n) => n.id !== id));
        setConfirmDialog(null);
      },
    );
  };

  // Güvenli ve iFrame Uyumlu Kopyalama Fonksiyonu
  const handleShare = () => {
    const textToCopy = `${SITE_NAME} - YKS Sınav Takibim:\nOrtalama Net: ${metrics.avgNet}\nDoğruluk Oranı: %${metrics.avgAccuracy}\nSıralama Tahmin: ${metrics.estimateRank}\nToplam Sınav: ${metrics.examCount} adet.`;
    
    // Geçici bir textarea oluşturup kopyalama gerçekleştirme (iframe kısıtlamalarına karşı korumalı)
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let isCopied = false;
    try {
      isCopied = document.execCommand('copy');
    } catch (err) {
      console.warn("execCommand kopyalama yöntemi başarısız oldu:", err);
    }
    document.body.removeChild(textArea);

    if (isCopied) {
      setNotification({
        title: "BAŞARIYLA KOPYALANDI",
        message: "İstatistikleriniz panoya kopyalandı! Dilediğiniz yerde paylaşabilirsiniz."
      });
    } else {
      setNotification({
        title: "PAYLAŞIM BİLGİSİ",
        message: `Kopyalama otomatik yapılamadı. Lütfen aşağıdaki bilgileri seçip manuel kopyalayın:\n\n${textToCopy}`
      });
    }
  };

  // Düzenleme modunda değerleri inputlara önceden doldurma
  const openEditProfile = () => {
    if (!member) {
      setNotification({
        title: 'Üyelik gerekli',
        message: 'Profil ve AI koç özellikleri için giriş yapın veya üye olun.',
      });
      openMemberAuth('login');
      return;
    }
    if (userProfile) {
      setSetupName(userProfile.name);
      setSetupField(userProfile.field);
      setSetupTargetUniv(userProfile.targetUniv);
      setSetupTargetDept(userProfile.targetDept);
      setSetupDailyTargetHours(userProfile.dailyTargetHours);
    }
    setIsEditingProfile(true);
  };

  const trafficHighlights = getTrafficHighlights();

  // ANA UYGULAMA EKRANI (misafir olarak doğrudan açılır; üyelik isteğe bağlı)
  return (
    <div
      className={`min-h-[100dvh] font-sans transition-colors duration-500 mesh-bg ${darkMode ? 'dark text-slate-100' : 'text-slate-800'}`}
      style={surfaceStyle}
    >
      
      {/* ÜST BAR (HEADER) */}
      <header className={`site-content-layer safe-area-top sticky top-0 z-50 border-b glass-panel ${darkMode ? activeTheme.borderDark : activeTheme.borderLight}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BrandWordmark
                  size="lg"
                  gradientClass={activeTheme.logoGradient}
                  frameClassName={`bg-gradient-to-tr ${activeTheme.gradient}`}
                />
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${activeTheme.bg}`}>
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{SITE_TAGLINE}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openEditProfile}
              className={`header-chip ${darkMode ? `header-chip-dark ${activeTheme.headerChipDark}` : `header-chip-light ${activeTheme.headerChipLight}`}`}
              title="Profilimi Düzenle"
            >
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[140px]">
                {member ? getMemberDisplayName(member) : 'Misafir'}
              </span>
              <Settings className="h-3 w-3 opacity-60 shrink-0" />
            </button>

            <div className={`flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-xl border ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
              {THEME_OPTIONS.map((color) => {
                const swatchTheme = getThemeClasses(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setThemeColor(color)}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-transform ${swatchTheme.swatch} ${
                      themeColor === color ? `scale-125 ring-2 ${activeTheme.pickerRing}` : 'hover:scale-110'
                    }`}
                    title={THEME_LABELS[color]}
                    aria-label={`Tema: ${THEME_LABELS[color]}`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className={`header-chip ${darkMode ? `header-chip-dark ${activeTheme.headerChipDark}` : `header-chip-light ${activeTheme.headerChipLight}`}`}
              title="Kılavuz"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">KILAVUZ</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className={`header-chip ${darkMode ? `header-chip-dark ${activeTheme.headerChipDark}` : `header-chip-light ${activeTheme.headerChipLight}`}`}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PAYLAŞ</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-white border-slate-200 text-slate-600'
              }`}
              title={darkMode ? 'Açık Tema' : 'Koyu Tema'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {admin && (
              <button
                type="button"
                onClick={handleAdminLogout}
                className="auth-btn border border-violet-500 text-violet-600 dark:text-violet-400"
                title="Admin ve üye çıkışı"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">ADMIN</span>
              </button>
            )}

            {member && !admin ? (
              <button
                type="button"
                onClick={handleAuthButton}
                className="auth-btn auth-btn-logout"
                title="Çıkış Yap"
              >
                <LogOut className="h-4 w-4" />
                <span>ÇIKIŞ</span>
              </button>
            ) : !member ? (
              <button
                type="button"
                onClick={handleAuthButton}
                className={`auth-btn text-white bg-gradient-to-r ${activeTheme.gradient} hover:opacity-90 shadow-md`}
                title="Giriş Yap"
              >
                <LogIn className="h-4 w-4" />
                <span>GİRİŞ</span>
              </button>
            ) : null}
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-4 md:px-8 pb-3">
          <div className={`nav-rail nav-rail-scroll flex gap-1 p-1.5 rounded-2xl border ${activeTheme.navRail}`}>
            {[
              ...(member ? [{ id: 'panel', label: 'Panel' }] : []),
              { id: 'merkez', label: 'Zeka Merkezi' },
              { id: 'sorucozucu', label: 'AI Soru Çözücü' },
              { id: 'planlayici', label: 'Planlayıcı' },
              { id: 'kutuphane', label: 'Kütüphane' },
              { id: 'ulusalsinav', label: 'Ulusal Sınavlar' },
              ...(member
                ? [
                    { id: 'sinavlar', label: 'Grafikler' },
                    { id: 'uyepanel', label: 'Üye Paneli' },
                  ]
                : []),
              ...(admin ? [{ id: 'admin', label: 'Admin' }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`nav-pill ${activeTab === tab.id ? `nav-pill-active ${activeTheme.bg} ${activeTheme.navShadow}` : `nav-pill-idle ${activeTheme.navPillIdle}`}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <section className={`site-content-layer hero-strip relative overflow-hidden border-b bg-gradient-to-r ${activeTheme.heroStrip} ${darkMode ? activeTheme.borderDark : activeTheme.borderLight}`}>
        <div className={`hero-glow -top-12 right-1/4 w-48 h-48 ${activeTheme.lightBg} opacity-40`} aria-hidden />
        <div className={`hero-glow bottom-0 left-1/3 w-36 h-36 bg-violet-400/20 opacity-50`} style={{ animationDelay: '2s' }} aria-hidden />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Kişisel sınav koçluğu</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
              {member
                ? `Hoş geldin, ${getMemberDisplayName(member).split(' ')[0]}`
                : 'Misafir olarak keşfet'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {admin && member
                ? 'Admin oturumu: yönetim paneli ile birlikte Panel, Grafikler, AI koç ve tüm üye hizmetleri kullanılabilir.'
                : member
                  ? 'LGS · YKS · KPSS · ALES — deneme takibi, grafikler ve kişisel AI koç seninle.'
                  : 'Zeka Merkezi, soru çözücü, planlayıcı, kütüphane ve ulusal sınav arşivi açık. Panel, grafikler ve AI koç için giriş yapın.'}
            </p>
          </div>
          {!member && (
            <button
              type="button"
              onClick={() => openMemberAuth('login')}
              className={`shrink-0 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r ${activeTheme.gradient} shadow-lg hover:scale-[1.02] transition-transform`}
            >
              Hemen Giriş Yap
            </button>
          )}
        </div>
      </section>

      {/* PROFIL DÜZENLEME MODALI */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative ${
            darkMode ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-white text-slate-800 border border-slate-200'
          }`}>
            <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2">
              <Settings className={activeTheme.text} />
              <span>PROFİLİMİ GÜNCELLE</span>
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Adınız / Rumuzunuz</label>
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Alanınız</label>
                  <select
                    value={setupField}
                    onChange={(e) => setSetupField(e.target.value)}
                    className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Sayısal">Sayısal</option>
                    <option value="Eşit Ağırlık">Eşit Ağırlık</option>
                    <option value="Sözel">Sözel</option>
                    <option value="Dil">Dil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Günlük Çalışma Hedefi</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={setupDailyTargetHours}
                    onChange={(e) => setSetupDailyTargetHours(e.target.value)}
                    className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Hedef Üni</label>
                  <input
                    type="text"
                    value={setupTargetUniv}
                    onChange={(e) => setSetupTargetUniv(e.target.value)}
                    className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    required
                />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Hedef Bölüm</label>
                  <input
                    type="text"
                    value={setupTargetDept}
                    onChange={(e) => setSetupTargetDept(e.target.value)}
                    className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs ${
                    darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white ${activeTheme.bg}`}
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className="text-sm font-black uppercase tracking-wider mb-2 text-rose-500">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs ${
                  darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-rose-500 hover:bg-rose-600"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÖZEL BİLDİRİM / MODAL EKRANI */}
      {notification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border text-center ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className={`text-sm font-black uppercase tracking-wider mb-2 ${activeTheme.text}`}>{notification.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed mb-6">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs text-white ${activeTheme.bg} ${activeTheme.hover}`}
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {showMemberAuth && (
        <MemberAuthModal
          darkMode={darkMode}
          activeTheme={activeTheme}
          initialMode={memberAuthMode}
          onClose={() => setShowMemberAuth(false)}
          onSuccess={handleMemberAuthSuccess}
          onAdminSuccess={handleAdminAuthSuccess}
        />
      )}

      {passwordResetToken && (
        <PasswordResetModal
          darkMode={darkMode}
          activeTheme={activeTheme}
          token={passwordResetToken}
          onClose={() => {
            setPasswordResetToken(null);
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }}
          onSuccess={() => {
            setNotification({
              title: 'Şifre güncellendi',
              message: 'Yeni şifrenizle giriş yapabilirsiniz.',
            });
            openMemberAuth('login');
          }}
        />
      )}

      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl p-6 md:p-8 overflow-y-auto modal-safe shadow-2xl relative ${
            darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
              aria-label="Kılavuzu kapat"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <BrandWordmark
                size="md"
                gradientClass={activeTheme.logoGradient}
                frameClassName={`bg-gradient-to-tr ${activeTheme.gradient}`}
              />
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`text-[10px] font-extrabold px-2.5 py-1 text-white rounded-md ${activeTheme.bg}`}>
                  {USAGE_GUIDE.category}
                </span>
                <span className="text-[10px] text-slate-400">{USAGE_GUIDE.readTime}</span>
              </div>
            </div>
            <h2 className="font-extrabold text-lg md:text-xl mb-4">{USAGE_GUIDE.title}</h2>
            <p className="text-[11px] font-bold text-slate-400 mb-6">Yazar: {USAGE_GUIDE.author}</p>
            <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {USAGE_GUIDE.content}
            </div>
            <div className="mt-8 border-t pt-4 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className={`px-6 py-2 rounded-xl text-white font-bold text-xs ${activeTheme.bg} ${activeTheme.hover}`}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METRİK KARTLARI — yalnızca üyeler (Panel / Grafikler) */}
      {member && (
      <section className="site-content-layer p-4 md:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* NET ORTALAMASI */}
          <div className={`metric-card group relative flex justify-between items-center pl-6 ${activeTheme.metricBorder}`}>
            <span className={`metric-card-accent bg-gradient-to-b ${activeTheme.metricAccent}`} />
            <div className="relative z-[1]">
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">NET ORTALAMASI</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tracking-tight">
                  {metrics.examCount === 0 ? '—' : metrics.avgNet}
                </span>
                {metrics.examCount > 0 && (
                  <span className="text-sm font-semibold text-slate-500">Net</span>
                )}
              </div>
              <p className={`text-xs font-medium mt-1 ${metrics.examCount === 0 ? 'text-slate-400' : 'text-emerald-500 font-bold'}`}>
                {metrics.examCount === 0 ? 'Henüz sınav girilmedi' : '↗ Son 3 sınavda artışta'}
              </p>
            </div>
            <div className={`icon-well relative z-[1] ${activeTheme.lightBg} ${activeTheme.darkText}`}>
              <Target className="h-6 w-6" />
            </div>
          </div>

          {/* DOĞRULUK ORANI */}
          <div className={`metric-card group relative flex justify-between items-center pl-6 ${activeTheme.metricBorder}`}>
            <span className={`metric-card-accent bg-gradient-to-b ${activeTheme.metricAccent}`} />
            <div className="relative z-[1]">
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">DOĞRULUK ORANI</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tracking-tight">
                  {metrics.examCount === 0 ? '—' : `%${metrics.avgAccuracy}`}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {metrics.examCount === 0 ? 'Sınav ekleyince hesaplanır' : 'Hataları azaltma hedefi'}
              </p>
            </div>
            <div className={`icon-well relative z-[1] ${activeTheme.lightBg} ${activeTheme.darkText}`}>
              <Award className="h-6 w-6" />
            </div>
          </div>

          {/* DENEME SAYISI */}
          <div className={`metric-card group relative flex justify-between items-center pl-6 ${activeTheme.metricBorder}`}>
            <span className={`metric-card-accent bg-gradient-to-b ${activeTheme.metricAccent}`} />
            <div className="relative z-[1]">
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">DENEME SAYISI</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tracking-tight">
                  {metrics.examCount === 0 ? '0' : metrics.examCount} Adet
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {metrics.examCount === 0 ? 'İlk denemenizi kaydedin' : 'YKS Hedefine Hazırlık'}
              </p>
            </div>
            <div className="icon-well relative z-[1] bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          {/* HEDEF ÜNİVERSİTE / SIRALAMA */}
          <div className={`metric-card group relative flex justify-between items-center pl-6 ${activeTheme.metricBorder}`}>
            <span className={`metric-card-accent bg-gradient-to-b ${activeTheme.metricAccent}`} />
            <div className="relative z-[1]">
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">HEDEFİNİZ</p>
              <div className="flex flex-col mt-1">
                {effectiveProfile.targetUniv !== GUEST_PROFILE.targetUniv ? (
                  <>
                    <span className={`text-sm font-black truncate max-w-[180px] ${activeTheme.text}`} title={effectiveProfile.targetUniv}>
                      {effectiveProfile.targetUniv}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[180px]" title={effectiveProfile.targetDept}>
                      {effectiveProfile.targetDept}
                    </span>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={openEditProfile}
                    className="text-sm font-semibold text-left text-slate-400 hover:text-purple-500 transition-colors"
                  >
                    Profilden hedef belirle
                  </button>
                )}
              </div>
              <p className="text-[10px] text-purple-500 font-bold flex items-center gap-1.5 mt-1">
                <Target className="h-3.5 w-3.5 shrink-0" />
                <span>Günlük Hedef: {effectiveProfile.dailyTargetHours} Saat</span>
              </p>
            </div>
            <div className="icon-well relative z-[1] bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>

        </div>
      </section>
      )}

      {/* ANA İÇERİK ALANI */}
      <main className="site-content-layer main-with-coach px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* TAB 1: PANEL (SINAV GİRİŞİ, DERS ORTALAMALARI & AI KOÇ CHAT) — üyelere özel */}
        {activeTab === 'panel' && member && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* SOL VE ORTA ALAN: GİRİŞ PANELİ VE DERS ORTALAMALARI */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Sınav Giriş Paneli */}
              <div className="intel-card p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-6 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-5 w-5 ${activeTheme.text}`} />
                    <h2 className="font-display font-extrabold text-lg tracking-tight uppercase">SINAV SONUCU GİRİŞ PANELİ</h2>
                  </div>
                  
                  <div className="flex gap-3 text-[10px] uppercase font-bold tracking-wider">
                    <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700">
                      ANLIK NET: <span className={`${activeTheme.text}`}>{liveStats.net} Net</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700">
                      TAHMİNİ PUAN: <span className="text-emerald-500">{liveStats.score}</span>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700">
                      DOĞRULUK: <span className="text-purple-500">%{liveStats.accuracy}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAddExam} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">SINAV FORMATI</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setExamType('TYT')}
                          className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                            examType === 'TYT' 
                              ? `${activeTheme.bg} text-white border-transparent shadow-md` 
                              : `${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`
                          }`}
                        >
                          TYT (120S)
                        </button>
                        <button
                          type="button"
                          onClick={() => setExamType('AYT')}
                          className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                            examType === 'AYT' 
                              ? `${activeTheme.bg} text-white border-transparent shadow-md` 
                              : `${darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`
                          }`}
                        >
                          AYT (160S)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">YAYIN / SINAV ADI</label>
                      <input
                        type="text"
                        value={examName}
                        onChange={(e) => setExamName(e.target.value)}
                        placeholder="Örn: Özdebir TYT, 3D Simülasyon, Limit AYT"
                        className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">HIZLI SEÇ:</label>
                      <div className="flex flex-wrap gap-1.5">
                        {fastExams.map(name => (
                          <button
                            type="button"
                            key={name}
                            onClick={() => setExamName(`${name} ${examType}`)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                              darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">SINAV TARİHİ</label>
                      <input
                        type="date"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className={`w-full text-sm px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  {/* Ders Giriş Kutuları */}
                  <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                    <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      <div className="col-span-6">BRANŞ / DERS ADI</div>
                      <div className="col-span-2 text-center">DOĞRU</div>
                      <div className="col-span-2 text-center">YANLIŞ</div>
                      <div className="col-span-2 text-right">NET</div>
                    </div>

                    {getSubjectsForExamType(examType).map(({ key: subject }) => {
                      const currentScores = examType === 'TYT' ? tytScores : aytScores;
                      const maxQ = getMaxQuestionsForSubject(examType, subject);
                      const currentObj = currentScores[subject] ?? { correct: 0, wrong: 0 };
                      const net = calculateNet(currentObj.correct, currentObj.wrong);
                      const bar = subjectBarStyle(subject);

                      return (
                        <div
                          key={subject}
                          className={`grid grid-cols-12 items-center p-3 rounded-xl border ${
                            darkMode ? 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                          } transition-all`}
                        >
                          <div className="col-span-6 flex items-center gap-2">
                            <span className={`w-1.5 h-8 rounded-full ${bar.bar}`} />
                            <div>
                              <p className="text-sm font-bold">{subject}</p>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">MAX SORU: {maxQ}</p>
                            </div>
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <input
                              type="number"
                              min="0"
                              max={maxQ}
                              value={currentObj.correct || ''}
                              onChange={(e) => handleScoreChange(subject, 'correct', e.target.value)}
                              placeholder="0"
                              className={`w-14 text-center font-bold py-1.5 rounded-lg border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            />
                          </div>

                          <div className="col-span-2 flex justify-center">
                            <input
                              type="number"
                              min="0"
                              max={maxQ}
                              value={currentObj.wrong || ''}
                              onChange={(e) => handleScoreChange(subject, 'wrong', e.target.value)}
                              placeholder="0"
                              className={`w-14 text-center font-bold py-1.5 rounded-lg border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                              }`}
                            />
                          </div>

                          <div className="col-span-2 text-right">
                            <span className={`text-sm font-extrabold ${net > 0 ? activeTheme.text : 'text-slate-400'}`}>
                              {net} N
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">SINAV NOTLARI & ANALİZ</label>
                    <textarea
                      value={examNotes}
                      onChange={(e) => setExamNotes(e.target.value)}
                      placeholder="Sınav hakkında notunu ekle... (Örn: Matematikte sürem yetmedi)"
                      rows={2}
                      className={`w-full text-sm px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-tr ${activeTheme.gradient} ${activeTheme.hover} shadow-md transition-all flex items-center justify-center gap-2`}
                  >
                    <span>Sınav Kaydet & Analiz Et</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {/* DERSLERE GÖRE NET ORTALAMASI & RADAR GRAFİĞİ */}
              <div className="intel-card p-6">
                <div className="flex justify-between items-center border-b pb-4 mb-6 dark:border-slate-700">
                  <div>
                    <h3 className="font-display font-extrabold text-base tracking-tight uppercase">DERSLERE GÖRE NET ORTALAMASI</h3>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Ders bazında şimdiye kadar yaptığın denemelerin performans grafiği</p>
                  </div>
                  <span className={`text-xs font-bold ${activeTheme.textMuted} ${activeTheme.lightBg} dark:bg-slate-800/40 px-3 py-1.5 rounded-xl`}>Hedef: %100 Başarı</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Sol Sütun: Yatay Bar Oranları */}
                  <div className="md:col-span-7 space-y-5">
                    {exams.length === 0 ? (
                      <div className="text-center py-10 text-sm text-slate-400">
                        Henüz deneme sınavı yok. Sol panelden ilk sınavınızı kaydettiğinizde ders bazlı grafikler burada görünecek.
                      </div>
                    ) : subjectAverages.map((sub, i) => {
                      const { bar: barColor, Icon: SubjectIcon } = subjectBarStyle(sub.subject);

                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold flex items-center gap-2">
                              <span className={`p-1 rounded-md ${activeTheme.lightBg}`}>
                                <SubjectIcon className={`h-3.5 w-3.5 ${activeTheme.text}`} />
                              </span>
                              <span>{sub.subject}</span>
                            </span>
                            <div className="flex items-center gap-2 font-black">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">{sub.percentage}%</span>
                              <span className={activeTheme.text}>{sub.avgNet}</span>
                              <span className="text-slate-400">/{sub.maxQ}N</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden relative">
                            <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${sub.percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sağ Sütun: Radar/Spider Chart */}
                  <div className="md:col-span-5 flex justify-center h-52 sm:h-56 min-w-0 w-full">
                    {exams.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 flex flex-col justify-center">
                        <span>Radar grafiği oluşturmak için</span>
                        <span>en az 1 sınav girmelisiniz.</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid stroke={darkMode ? "#334155" : "#e2e8f0"} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: darkMode ? '#cbd5e1' : '#475569', fontSize: 10, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar 
                            name="Performans %" 
                            dataKey="Ort. Alanı" 
                            stroke={activeTheme.chartStroke}
                            fill={activeTheme.chartFill} 
                            fillOpacity={0.3} 
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {studyTimeReport && memberGrade && (
                <div className="intel-card p-6">
                  <div className="flex justify-between items-start border-b pb-4 mb-4 dark:border-slate-700">
                    <div>
                      <h3 className="font-display font-extrabold text-base tracking-tight uppercase">
                        Günlük Çalışma Planı
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase">
                        {memberGrade === 'mezun' ? 'Mezun' : `${memberGrade}. sınıf`} · AI istatistik önerisi · {studyTimeReport.totalDailyLabel}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{studyTimeReport.summary}</p>
                  <div className="space-y-2">
                    {studyTimeReport.subjects.slice(0, 8).map((p) => (
                      <div
                        key={p.subject}
                        className={`flex justify-between items-center text-xs p-2.5 rounded-xl border ${
                          darkMode ? 'border-slate-700/60 bg-slate-800/30' : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                        <span className="font-bold">{p.subject}</span>
                        <span className={`font-black ${activeTheme.text}`}>{p.minutes} dk/gün</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4">{studyTimeReport.researchNote}</p>
                </div>
              )}

            </div>

            {/* SAĞ KOLON: AI KOÇ & AKADEMİK ÇEVİRİ */}
            <div className="space-y-6">
              
              {/* AI KOÇ INTERACTIVE CHAT */}
              <div className={`intel-card p-6 rounded-3xl relative overflow-hidden border ${activeTheme.intelBorder} ${
                darkMode ? 'bg-slate-800/30' : activeTheme.surfaceTint
              }`}>
                {/* Arka Plan AI Halo Efekti */}
                <div className={`absolute top-0 right-0 w-36 h-36 rounded-full filter blur-3xl opacity-10 ${activeTheme.bg}`} />

                <div className="mb-4">
                  <BrandWordmark
                    as="h3"
                    size="md"
                    gradientClass={activeTheme.logoGradient}
                    frameClassName={`bg-gradient-to-tr ${activeTheme.gradient}`}
                  />
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">ULUSAL SINAV KOÇLUĞU & KİŞİSEL REHBER</p>
                </div>

                {trafficHighlights.totalEvents > 0 && (
                  <div className={`mb-3 text-[10px] font-semibold rounded-xl px-3 py-2.5 border ${darkMode ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-white/70 border-slate-200 text-slate-600'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Activity className={`h-3 w-3 ${activeTheme.text}`} />
                      <span className="font-bold uppercase tracking-wide">Kişisel trafik özeti</span>
                    </div>
                    <span>
                      {trafficHighlights.topTabs.length > 0 && `En aktif: ${trafficHighlights.topTabs.join(' · ')}`}
                      {trafficHighlights.inferredExam && ` · Odak: ${trafficHighlights.inferredExam}`}
                      {` · ${trafficHighlights.chatCount} sohbet · ${trafficHighlights.examAdds} deneme`}
                    </span>
                  </div>
                )}

                <p className="mb-3 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl px-3 py-2">
                  LGS, YKS, KPSS, ALES koçluğu — öğretmen bankası + tarayıcı AI (ücretsiz) veya Gemini (API anahtarı ile) desteklenir.
                  {worldSnapshot && (
                    <span className="block mt-1 text-slate-500 dark:text-slate-400">
                      {worldSnapshot.settlement.displayName} · {worldSnapshot.currentTemp ?? '—'}°C · {worldSnapshot.prayer.nextPrayer} {worldSnapshot.prayer.nextPrayerTime}
                    </span>
                  )}
                </p>

                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={triggerFullAnalysis}
                    disabled={aiLoadingMode === 'analysis' || exams.length === 0}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold text-white ${activeTheme.bg} ${activeTheme.hover} disabled:opacity-50`}
                  >
                    {aiLoadingMode === 'analysis' ? 'Analiz ediliyor...' : 'Tüm Denemeleri Analiz Et'}
                  </button>
                </div>

                {aiAnalysis && (
                  <div className={`mb-4 rounded-2xl p-4 border text-xs leading-relaxed whitespace-pre-wrap ${
                    darkMode ? 'bg-slate-900/70 border-slate-700 text-slate-200' : `bg-white ${activeTheme.surfacePanel} text-slate-700`
                  }`}>
                    <p className={`text-[9px] font-extrabold uppercase tracking-wider ${activeTheme.textMuted} mb-2`}>Detaylı AI Analizi</p>
                    {aiAnalysis}
                  </div>
                )}

                {/* Sohbet Kutusu Akışı */}
                <div className={`rounded-2xl p-4 border mb-4 ${
                  darkMode ? 'bg-slate-900/60 border-slate-800' : `bg-white ${activeTheme.surfaceBorder}`
                }`}>
                  <div className="space-y-3 h-64 overflow-y-auto mb-3 pr-1 scrollbar-thin">
                    {chatHistory.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? `${activeTheme.bg} text-white`
                            : darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 text-slate-700'
                        }`}>
                          <p className="font-extrabold text-[9px] uppercase tracking-wider mb-1 opacity-70 flex items-center gap-1.5">
                            {msg.role === 'user' ? (
                              'Siz'
                            ) : (
                              <BrandWordmark
                                size="xs"
                                gradient={false}
                                className="normal-case opacity-100"
                              />
                            )}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {aiLoadingMode === 'chat' && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl p-3 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-2">
                          <BrandWordmark
                            size="xs"
                            gradient={false}
                            logoVariant="loading"
                            frameClassName={`bg-gradient-to-tr ${activeTheme.gradient}`}
                            className="normal-case"
                          />
                          <span>analiz ediyor...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ÖNERİLEN SORULAR KUTUSU */}
                  <div className="mb-3 border-t pt-3 dark:border-slate-800">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Önerilen Sorular:</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        `Benim gibi bir ${effectiveProfile.field} öğrencisi için ders çalışma tüyoları nelerdir?`,
                        effectiveProfile.targetDept !== GUEST_PROFILE.targetDept
                          ? `Hedefim ${effectiveProfile.targetDept}. Sınava nasıl odaklanmalıyım?`
                          : 'YKS için kişisel çalışma planı önerir misin?',
                        'Ulusal sınav arşivi istatistiklerime göre hangi alanlara odaklanmalıyım?',
                        'Site trafiğime göre bana özel koçluk önerisi verir misin?',
                        'Matematik netlerimi nasıl artırabilirim?',
                      ].map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestedQuestion(q)}
                          className={`text-left text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-all text-slate-600 dark:text-slate-300 ${
                            darkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Soru Gönderme Formu */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={aiChatQuery}
                      onChange={(e) => setAiChatQuery(e.target.value)}
                      placeholder={`${SITE_NAME}'a sorunu yaz...`}
                      className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={aiLoadingMode === 'chat'}
                      className={`p-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center ${activeTheme.bg} ${activeTheme.hover} transition-all disabled:opacity-50`}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* GELİŞTİRİLMİŞ AI AKADEMİK ÇEVİRİ & YKS SÖZLÜK */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className="flex items-center gap-2 mb-3">
                  <Languages className={`h-5 w-5 ${activeTheme.text}`} />
                  <div>
                    <h3 className="font-extrabold text-sm uppercase">AI YKS Akademik Sözlük</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">YKS odaklı bilimsel terim çevirici ve akıllı kartlar</p>
                  </div>
                </div>

                {/* Yön Değiştirme Butonları */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setTranslateDirection('TR_EN')}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      translateDirection === 'TR_EN' ? `${activeTheme.bg} text-white` : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      TR <ArrowRight className="h-3 w-3" /> EN
                    </span>
                  </button>
                  <button
                    onClick={() => setTranslateDirection('EN_TR')}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      translateDirection === 'EN_TR' ? `${activeTheme.bg} text-white` : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center gap-1">
                      EN <ArrowRight className="h-3 w-3" /> TR
                    </span>
                  </button>
                </div>

                {/* Bilim Dalları Kategorileri */}
                <div className="mb-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Bilim Dalları (9 Kategori):</span>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(Object.entries(SCIENCE_CATEGORIES) as [ScienceCategoryId, typeof SCIENCE_CATEGORIES.formal][]).map(
                      ([id, cat]) => (
                        <button
                          type="button"
                          key={id}
                          onClick={() => {
                            setLastTranslatedTerm(cat.tr);
                            setTranslatedResult(formatCategoryOverview(id));
                            logSiteEvent('dictionary_search', { tab: activeTab, detail: `bilim:${id}` });
                          }}
                          className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                            darkMode
                              ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {cat.tr}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setLastTranslatedTerm('Tüm Bilim Dalları');
                        setTranslatedResult(formatScienceTaxonomyOverview());
                        logSiteEvent('dictionary_search', { tab: activeTab, detail: 'bilim:tum' });
                      }}
                      className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                        darkMode
                          ? 'bg-emerald-900/40 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Tümünü Göster
                    </button>
                  </div>
                </div>

                {/* Hızlı Terim Seçim Kartları */}
                <div className="mb-4">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Popüler Terimler:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_ACADEMIC_TERMS.map((item) => (
                      <button
                        type="button"
                        key={item.term}
                        onClick={(e) => handleAcademicTranslation(e, translateDirection === 'TR_EN' ? item.tr : item.term)}
                        className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-all ${
                          darkMode 
                            ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {translateDirection === 'TR_EN' ? item.tr : item.term}
                        <span className="ml-1 opacity-55 text-[8px] uppercase">({item.category})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Çeviri Formu */}
                <form onSubmit={handleAcademicTranslation} className="space-y-3 mb-4">
                  <input
                    type="text"
                    value={translateText}
                    onChange={(e) => setTranslateText(e.target.value)}
                    placeholder={translateDirection === 'TR_EN' ? "Örn: Türev, Astrofizik, Biyoinformatik" : "Örn: Physics, Genetics, Robotics"}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={loadingTranslation}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {loadingTranslation ? 'AI analiz ediyor...' : 'Terimi Çevir ve Analiz Et'}
                  </button>
                </form>

                {/* Sonuç Kartı */}
                {translatedResult && (
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-xs border border-emerald-100 dark:border-emerald-900/40 space-y-3">
                    <div className="flex justify-between items-center border-b border-emerald-100/60 dark:border-emerald-900/60 pb-2">
                      <span className="font-extrabold text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">HEDEFLİ ANALİZ</span>
                      <button
                        onClick={handleSaveTranslationToNotes}
                        className="text-[9px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-md hover:bg-emerald-600 transition-all flex items-center gap-1 shadow-sm"
                        title="Not Defterime Ekle"
                      >
                        <BookMarked className="h-3 w-3" />
                        <span>Notlarıma Kaydet</span>
                      </button>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-200 space-y-2">
                      {translatedResult}
                    </div>
                  </div>
                )}

                {/* Çeviri Geçmişi (Sözlüğüm) */}
                {translationHistory.length > 0 && (
                  <div className="mt-4 border-t pt-3 dark:border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Çeviri Geçmişim (Sözlük):</span>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                      {translationHistory.map((item) => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setTranslateText(item.term);
                            setTranslatedResult(item.result);
                          }}
                          className={`p-2 rounded-lg border text-[10px] font-semibold cursor-pointer transition-all flex justify-between items-center ${
                            darkMode ? 'bg-slate-800/30 border-slate-700/60 hover:bg-slate-800/60' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate max-w-[120px]">{item.term}</span>
                          <span className="text-[8px] opacity-60 uppercase inline-flex items-center gap-0.5">
                            {item.direction === 'TR_EN' ? (
                              <>TR <ArrowRight className="h-2.5 w-2.5" /> EN</>
                            ) : (
                              <>EN <ArrowRight className="h-2.5 w-2.5" /> TR</>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 1.5: YENİ AI SORU ÇÖZÜCÜ (SEKME) */}
        {activeTab === 'uyepanel' && member && (
          <MemberPanel
            key={`${memberActivityTick}-${curriculumTick}`}
            darkMode={darkMode}
            activeTheme={activeTheme}
            member={member}
            exams={exams}
            completedTasks={tasks.filter((t: { done: boolean }) => t.done).length}
            totalTasks={tasks.length}
            curriculumTick={curriculumTick}
            onLogout={handleMemberLogout}
            onActivityChange={refreshMemberActivity}
            onCurriculumRefresh={() => setCurriculumTick((t) => t + 1)}
          />
        )}

        {activeTab === 'uyepanel' && !member && (
          <div className={`p-8 rounded-2xl border text-center ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`}>
            <p className="text-sm text-slate-500 mb-4">Üye paneline erişmek için giriş yapın veya üyelik oluşturun.</p>
            <button
              type="button"
              onClick={() => openMemberAuth('register')}
              className={`text-xs px-5 py-2.5 rounded-xl font-bold text-white ${activeTheme.bg}`}
            >
              Üye Ol / Giriş Yap
            </button>
          </div>
        )}

        {activeTab === 'admin' && admin && (
          <AdminPanel
            darkMode={darkMode}
            activeTheme={activeTheme}
            admin={admin}
            onLogout={handleAdminLogout}
            onMemberDeleted={(deletedId) => {
              if (member?.id === deletedId) {
                handleMemberLogout();
              }
            }}
          />
        )}

        {activeTab === 'admin' && !admin && (
          <div className={`p-8 rounded-2xl border text-center ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100'}`}>
            <p className="text-sm text-slate-500 mb-4">
              Admin paneline erişmek için üye girişi ekranından admin e-postanız ile giriş yapın.
            </p>
            <button
              type="button"
              onClick={() => openMemberAuth('login')}
              className={`text-xs px-5 py-2.5 rounded-xl font-bold text-white ${activeTheme.bg}`}
            >
              Giriş Yap
            </button>
          </div>
        )}

        {activeTab === 'merkez' && (
          <SmartHubPanel
            darkMode={darkMode}
            activeTheme={activeTheme}
            settlement={settlement}
            locationQuery={locationQuery}
            searchResults={locationResults}
            searching={searchingLocation}
            world={worldSnapshot}
            loadingWorld={loadingWorld}
            onLocationQueryChange={setLocationQuery}
            onSelectSettlement={handleSelectSettlement}
            onRefresh={() => settlement && refreshWorldData(settlement)}
            onScienceBrief={handleScienceBrief}
            scienceBrief={scienceBrief}
            loadingBrief={loadingScienceBrief}
          />
        )}

        {activeTab === 'sorucozucu' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-fadeIn">
            
            {/* SOL 2 KOLON: SORU GİRİŞİ VE AKTİF ÇÖZÜM */}
            <div className="lg:col-span-2 space-y-4">
              
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className="flex items-center gap-2 border-b pb-4 mb-4 dark:border-slate-700">
                  <BrandLogo size={24} variant="mark" />
                  <div>
                    <h2 className="font-extrabold text-lg tracking-tight uppercase">YKS ADIM ADIM SORU ÇÖZÜCÜ</h2>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Çözemediğin sorunun metnini yaz veya net bir fotoğrafını yükle</p>
                  </div>
                </div>

                <form onSubmit={handleSolveQuestion} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Branş Seçimi */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">SORUNUN DERSİ</label>
                      <select
                        value={questionSubject}
                        onChange={(e) => setQuestionSubject(e.target.value)}
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <option value="Matematik">Matematik</option>
                        <option value="Geometri">Geometri</option>
                        <option value="Fizik">Fizik</option>
                        <option value="Kimya">Kimya</option>
                        <option value="Biyoloji">Biyoloji</option>
                        <option value="Türkçe">Türkçe</option>
                        <option value="Edebiyat">Edebiyat</option>
                        <option value="Felsefe">Felsefe</option>
                        <option value="Tarih">Tarih</option>
                        <option value="Coğrafya">Coğrafya</option>
                        <option value="Sosyal Bilimler">Sosyal Bilimler</option>
                        <option value="Astronomi">Astronomi</option>
                        <option value="Din Kültürü ve Ahlak Bilgisi">Din Kültürü ve Ahlak Bilgisi</option>
                      </select>
                    </div>

                    {/* Fotoğraf Yükleme Alanı */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">SORU FOTOĞRAFI (OPSİYONEL)</label>
                      <div className="flex gap-2">
                        <label className={`upload-zone flex-1 ${
                          darkMode ? 'border-slate-700 hover:border-slate-500' : 'border-slate-300 hover:border-slate-400'
                        }`}>
                          <Image className="h-4 w-4 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-500 truncate">
                            {questionImageName ? questionImageName : 'Fotoğraf Seç (Max 25 MB)'}
                          </span>
                          <input
                            type="file"
                            accept="image/*,.heic,.heif,.avif"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        {questionImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuestionImage(null);
                              setQuestionImageName('');
                            }}
                            className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-all"
                            title="Görseli Kaldır"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Soru Metni Girişi */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">SORU METNİ / DETAYLAR</label>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Soruyu buraya yazabilirsin. Eğer fotoğraf yüklediysen, sorunun çözümünü başlatmak için doğrudan alttaki butona basabilirsin."
                      rows={4}
                      enterKeyHint="done"
                      className={`w-full text-base sm:text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Örnek Soru Seçiciler */}
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Örnek Sorulardan Dene:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {SAMPLE_UNSOLVED_QUESTIONS.map((q, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setQuestionText(q.text);
                            setQuestionSubject(q.subject);
                          }}
                          className={`text-[10px] px-2.5 py-1.5 rounded-lg border text-left truncate max-w-xs transition-all ${
                            darkMode 
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          [{q.subject}] {q.text}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingSolution}
                    className={`w-full py-3.5 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${activeTheme.bg} ${activeTheme.hover}`}
                  >
                    <BrandLogo
                      size={18}
                      variant={loadingSolution ? 'loading' : 'mark'}
                      frameClassName={`bg-gradient-to-tr ${activeTheme.gradient}`}
                    />
                    <span>
                      {loadingSolution
                        ? ocrProgress > 0 && ocrProgress < 100
                          ? `Fotoğraf okunuyor %${ocrProgress}…`
                          : 'AI çözüm hazırlıyor...'
                        : 'Soruyu AI ile Çöz'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Çözüm Sonuç Kartı */}
              {activeSolution && (
                <div className={`p-6 rounded-2xl border animate-fadeIn relative overflow-hidden ${
                  darkMode ? 'bg-slate-900/40 border-slate-700/60' : `${activeTheme.lightBgMuted} ${activeTheme.surfacePanel}`
                }`}>
                  <div className={`flex justify-between items-center border-b pb-3 mb-4 ${darkMode ? activeTheme.borderDark : activeTheme.surfacePanel}`}>
                    <div className="flex items-center gap-2">
                      <BrandLogo size={22} variant="mark" />
                      <h3 className={`font-extrabold text-sm uppercase tracking-wider ${activeTheme.text} ${activeTheme.darkText}`}>YAPAY ZEKA DETAYLI DERS ÇÖZÜMÜ</h3>
                    </div>
                    <button
                      onClick={() => handleSaveSolutionToNotes(questionText || "Görsel Soru", activeSolution)}
                      className={`text-[10px] font-bold text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow ${activeTheme.bg} ${activeTheme.hover}`}
                    >
                      <BookMarked className="h-3.5 w-3.5" />
                      <span>Çözümü Notlarıma Kaydet</span>
                    </button>
                  </div>

                  {/* Eğer soru fotoğrafı varsa ufak bir önizleme gösterelim */}
                  {questionImage && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Analiz Edilen Görsel:</p>
                      <div className="image-showcase inline-block p-2 max-w-full">
                        <img src={questionImage} alt="Analiz" className="max-h-44 rounded-xl object-contain" />
                      </div>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap leading-relaxed text-xs md:text-sm text-slate-700 dark:text-slate-200 space-y-3 font-medium">
                    {activeSolution}
                  </div>
                </div>
              )}

            </div>

            {/* SAĞ KOLON: YAPAMADIĞIM SORULAR DEFTERİ (ARŞİV) */}
            <div className="space-y-6">
              
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className="border-b pb-4 mb-4 dark:border-slate-700">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm uppercase">Yapamadığım Sorular</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Soruları tekrar durumuna göre listele</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-md ${activeTheme.lightBg} dark:bg-slate-800 ${activeTheme.textMuted}`}>
                      {unsolvedArchive.length} Soru
                    </span>
                  </div>
                </div>

                {unsolvedArchive.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <HelpCircle className="h-8 w-8 mx-auto opacity-40 mb-2" />
                    <span>Henüz kaydedilmiş çözümsüz soru bulunmuyor. İlk sorunuzu yukarıdan sorabilirsiniz!</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                    {unsolvedArchive.map((item) => (
                      <div 
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          item.status === 'Öğrendim' 
                            ? 'bg-emerald-50/20 border-emerald-100/50 dark:bg-emerald-950/10 dark:border-emerald-900/30' 
                            : 'bg-slate-50/80 border-slate-200/60 dark:bg-slate-800/30 dark:border-slate-700/40 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`text-[8px] font-black text-white px-2 py-0.5 rounded-md ${
                            item.subject === 'Matematik' || item.subject === 'Geometri' ? 'bg-violet-500' :
                            item.subject === 'Fizik' || item.subject === 'Kimya' || item.subject === 'Biyoloji' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}>
                            {item.subject}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">{item.date}</span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 font-bold truncate mb-3" title={item.question}>
                          {item.question}
                        </p>

                        <div className="flex justify-between items-center border-t dark:border-slate-800 pt-2.5 mt-1.5">
                          <button
                            onClick={() => {
                              setQuestionText(item.question);
                              setQuestionSubject(item.subject);
                              setQuestionImage(item.image);
                              setActiveSolution(item.solution);
                            }}
                            className={`text-[9px] font-bold ${activeTheme.text} hover:underline`}
                          >
                            <span className="inline-flex items-center gap-1">
                              Çözümü Gör
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleQuestionStatus(item.id)}
                              className={`text-[9px] font-bold px-2 py-1 rounded-md border flex items-center gap-1 transition-all ${
                                item.status === 'Öğrendim' 
                                  ? 'bg-emerald-500 text-white border-transparent' 
                                  : 'bg-white hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{item.status}</span>
                            </button>

                            <button
                              onClick={() => deleteFromArchive(item.id)}
                              className="text-slate-400 hover:text-rose-500 transition-colors"
                              title="Arşivden Sil"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: PLANLAYICI & NOTLAR */}
        {activeTab === 'planlayici' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            
            {/* SOL TARAF: HAFTALIK HEDEF PLANLAYICI */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
              <div className="flex justify-between items-center border-b pb-4 mb-4 dark:border-slate-700">
                <div>
                  <h2 className="font-extrabold text-lg tracking-tight uppercase">HAFTALIK HEDEF PLANLAYICI</h2>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">YKS hedefine giden yolda bu haftaya ait çalışma listeni yönet.</p>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400">
                  {completedTasksCount}/{tasks.length} TAMAMLANDI
                </span>
              </div>

              {/* İlerleme Barı */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300" 
                  style={{ width: `${tasks.length > 0 ? (completedTasksCount / tasks.length) * 100 : 0}%` }}
                />
              </div>

              {/* Hedef Ekleme Formu */}
              <form onSubmit={handleAddTask} className="flex flex-wrap md:flex-nowrap gap-2 mb-6">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Yeni bir çalışma hedefi girin... (Örn: Paragraf çöz)"
                  className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
                
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className={`text-xs px-3 py-2 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="GENEL">Genel</option>
                  <option value="MAT">MAT</option>
                  <option value="TUR">TUR</option>
                  <option value="FEN">FEN</option>
                  <option value="SOS">SOS</option>
                </select>

                <button
                  type="submit"
                  className={`px-4 py-2.5 rounded-xl text-white font-bold text-xs ${activeTheme.bg} ${activeTheme.hover}`}
                >
                  +
                </button>
              </form>

              {/* Görev Listesi */}
              <div className="space-y-3">
                {tasks.map((task) => {
                  let badgeColor = 'bg-gray-400';
                  if (task.category === 'MAT') badgeColor = 'bg-violet-500';
                  if (task.category === 'TUR') badgeColor = 'bg-rose-500';
                  if (task.category === 'FEN') badgeColor = 'bg-emerald-500';
                  if (task.category === 'SOS') badgeColor = 'bg-amber-500';

                  return (
                    <div 
                      key={task.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        task.done 
                          ? 'bg-slate-100/50 dark:bg-slate-800/20 border-slate-200/60' 
                          : 'bg-white dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTaskDone(task.id)}
                          className={`h-4 w-4 rounded border-slate-300 ${activeTheme.text} ${activeTheme.ring}`}
                        />
                        <span className={`text-xs font-bold ${task.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                          {task.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-black text-white px-2 py-0.5 rounded-md ${badgeColor}`}>
                          {task.category}
                        </span>
                        <button
                          onClick={() => deleteTask(task.id, task.text)}
                          aria-label={`${task.text} görevini sil`}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SAĞ TARAF: NOT DEFTERİM */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
              <h2 className="font-extrabold text-lg tracking-tight uppercase border-b pb-4 mb-4 dark:border-slate-700 flex items-center gap-2">
                <Edit3 className={activeTheme.text} />
                <span>NOT DEFTERİM</span>
              </h2>

              {/* Not Oluşturma Formu */}
              <form onSubmit={handleAddNote} className="space-y-4 mb-6 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">NOT BAŞLIĞI</label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Örn: Fizik Elektrik Formülü"
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">İÇERİK</label>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Buraya hatırda kalacak bilgiyi ekle..."
                    rows={3}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                </div>

                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">RENK:</span>
                    {['blue', 'pink', 'amber', 'teal'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewNoteColor(color)}
                        className={`w-5 h-5 rounded-full border transition-transform ${
                          color === 'blue' ? activeTheme.bg :
                          color === 'pink' ? 'bg-rose-400' :
                          color === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'
                        } ${newNoteColor === color ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'}`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-white font-bold text-xs ${activeTheme.bg} ${activeTheme.hover}`}
                  >
                    Kaydet
                  </button>
                </div>
              </form>

              {/* Kaydedilmiş Notlar Akışı */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {notes.map((note) => {
                  let accentClass = `${activeTheme.accentLine} ${activeTheme.lightBgMuted} dark:bg-slate-800/30`;
                  let textAccent = `${activeTheme.text} ${activeTheme.darkText}`;
                  if (note.color === 'pink') {
                    accentClass = 'border-l-rose-500 bg-rose-50/40 dark:bg-rose-950/20';
                    textAccent = 'text-rose-600 dark:text-rose-400';
                  }
                  if (note.color === 'amber') {
                    accentClass = 'border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20';
                    textAccent = 'text-amber-600 dark:text-amber-400';
                  }
                  if (note.color === 'teal') {
                    accentClass = 'border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20';
                    textAccent = 'text-emerald-600 dark:text-emerald-400';
                  }

                  return (
                    <div 
                      key={note.id}
                      className={`p-4 rounded-xl border-l-4 border ${accentClass} relative group transition-all`}
                    >
                      <button
                        onClick={() => deleteNote(note.id, note.title)}
                        aria-label={`${note.title} notunu sil`}
                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Notu Sil"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      <span className="text-[9px] font-bold text-slate-400">{note.date}</span>
                      <h4 className={`font-extrabold text-xs tracking-tight uppercase mb-1 ${textAccent}`}>{note.title}</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'kutuphane' && (
          <LibraryPanel
            darkMode={darkMode}
            activeTheme={activeTheme}
            submitterName={member ? getMemberDisplayName(member) : 'Misafir'}
          />
        )}

        {activeTab === 'ulusalsinav' && (
          <NationalExamPanel
            darkMode={darkMode}
            activeTheme={activeTheme}
            profileName={effectiveProfile.name}
            onCoachInsight={member ? pushCoachInsight : undefined}
            onStatsUpdate={member ? bumpArchiveStats : undefined}
          />
        )}

        {/* TAB: GRAFİKLER — üyelere özel */}
        {activeTab === 'sinavlar' && member && (
          <div className="space-y-6 animate-fadeIn">

            {/* Ulusal sınav arşivi — alan bazlı */}
            <div className={`chart-panel ${darkMode ? 'border-slate-700/60' : 'border-slate-100'}`}>
              <h3 className="font-extrabold text-lg mb-2 flex items-center gap-2">
                <Activity className={activeTheme.text} />
                <span>ULUSAL SINAV ARŞİVİ — ALAN BAZLI İSTATİSTİK</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Arşivde tamamladığınız testlerin ders/alan kırılımı. AI koç bu verileri plan ve motivasyon önerilerinde kullanır.
              </p>

              {archivePaperStats.length === 0 ? (
                <div className="empty-state-art text-center py-10 text-slate-400 text-sm">
                  <Activity className={`h-10 w-10 mx-auto mb-3 opacity-30 ${activeTheme.text}`} />
                  Henüz arşiv testi tamamlanmadı. Ulusal Sınavlar sekmesinden test çözün.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3 text-xs font-bold">
                    <span className={`px-3 py-1.5 rounded-full ${activeTheme.lightBg} ${activeTheme.darkText}`}>
                      {archivePaperStats.length} tamamlanan test
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Son: {archivePaperStats[0].title} (%{archivePaperStats[0].accuracy})
                    </span>
                  </div>

                  {archiveChartData.length > 0 && (
                    <div className="h-64 sm:h-72 w-full min-w-0 overflow-x-auto">
                      <ResponsiveContainer width="100%" height="100%" minWidth={280}>
                        <BarChart data={archiveChartData} margin={{ top: 8, right: 12, left: 0, bottom: 48 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} />
                          <XAxis
                            dataKey="subject"
                            stroke={darkMode ? '#94a3b8' : '#64748b'}
                            fontSize={10}
                            angle={-25}
                            textAnchor="end"
                            height={56}
                          />
                          <YAxis domain={[0, 100]} stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} unit="%" />
                          <Tooltip
                            formatter={(value: number, _name, props) => [
                              `%${value} (${props.payload.correct}/${props.payload.total})`,
                              props.payload.fullSubject,
                            ]}
                            contentStyle={{
                              backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                              borderColor: darkMode ? '#475569' : '#e2e8f0',
                              borderRadius: '12px',
                            }}
                          />
                          <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                            {archiveChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.accuracy >= 70
                                    ? '#10b981'
                                    : entry.accuracy >= 50
                                      ? activeTheme.chartStroke
                                      : '#f43f5e'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {archiveSubjectStats.map((s) => (
                      <div
                        key={s.subject}
                        className={`p-4 rounded-xl border ${
                          darkMode ? 'bg-slate-800/30 border-slate-700/40' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm truncate">{s.subject}</span>
                          <span className={`text-xs font-black ${activeTheme.text}`}>%{s.accuracy}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {s.correct} doğru · {s.wrong} yanlış · {s.blank} boş · {s.papersTouched} test
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Net Değişim Grafiği */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
              <h3 className="font-extrabold text-lg mb-6 flex items-center gap-2">
                <Target className={activeTheme.text} />
                <span>ZAMANLA NET DEĞİŞİM GRAFİĞİ</span>
              </h3>

              {exams.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Yeterli veri bulunamadı. Lütfen önce deneme sınavı ekleyin.</div>
              ) : (
                <div className="h-64 sm:h-80 w-full min-w-0 overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%" minWidth={280}>
                    <LineChart data={chartExams} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#f1f5f9"} />
                      <XAxis dataKey="chartLabel" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#1e293b' : '#ffffff', 
                          borderColor: darkMode ? '#475569' : '#e2e8f0',
                          borderRadius: '12px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalNet" 
                        stroke={activeTheme.chartStroke}
                        strokeWidth={3}
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Detaylı Gelişim Geçmişi */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
              <div className="flex justify-between items-center border-b pb-4 mb-4 dark:border-slate-700">
                <h3 className="font-extrabold text-lg">KAYITLI TÜM DENEMELER</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${activeTheme.lightBg} ${activeTheme.darkText}`}>
                  {exams.length} Deneme
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => (
                  <div 
                    key={exam.id}
                    className={`p-4 rounded-xl border transition-all relative group ${
                      darkMode ? 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.name)}
                      aria-label={`${exam.name} denemesini sil`}
                      className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base font-black tracking-tight">{exam.totalNet} Net</span>
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold text-white ${
                        exam.type === 'TYT' ? activeTheme.bg : 'bg-pink-500'
                      }`}>
                        {exam.type}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs mb-3 truncate">{exam.name}</h4>

                    <div className="grid grid-cols-4 gap-1.5 text-center mb-3">
                      {Object.entries(exam.scores).map(([subject, s]) => (
                        <div key={subject} className="bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border dark:border-slate-700">
                          <p className="text-[8px] font-bold text-slate-400 truncate uppercase">{subject.substring(0,3)}</p>
                          <p className={`text-[10px] font-black ${s.net > 0 ? activeTheme.text : 'text-slate-400'}`}>
                            {s.net}
                          </p>
                        </div>
                      ))}
                    </div>

                    {exam.notes && (
                      <p className="text-[10px] italic text-slate-500 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg">
                        "{exam.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      <CoachChatCorner
        darkMode={darkMode}
        activeTheme={activeTheme}
        open={coachCornerOpen}
        onOpenChange={setCoachCornerOpen}
        chatHistory={chatHistory}
        aiChatQuery={aiChatQuery}
        setAiChatQuery={setAiChatQuery}
        onSend={handleSendMessage}
        onSuggested={handleSuggestedQuestion}
        loading={aiLoadingMode === 'chat'}
        autoSpeak={autoSpeakCoach}
        onAutoSpeakChange={setAutoSpeakCoach}
        member={Boolean(member)}
        profileName={effectiveProfile.name}
      />

    </div>
  );
}