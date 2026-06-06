import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  BookOpen, Target, Plus, Trash2, Sparkles,
  Moon, Sun, Share2, Languages, GraduationCap, BookMarked,
  Image, HelpCircle, Check, CheckCircle2, HelpCircle as QuestionIcon, LogOut, User, Settings, Edit3
} from 'lucide-react';
import {
  generateCoachChatResponse,
  generateFullExamAnalysis,
  generateQuestionSolution,
  generateScienceBrief,
  translateAcademicTerm,
  type CoachContext,
} from './lib/localAi';
import SmartHubPanel from './components/SmartHubPanel';
import {
  fetchWorldSnapshot,
  isWorldCacheStale,
  LOCATION_CACHE_KEY,
  searchSettlements,
  WORLD_CACHE_KEY,
  WORLD_CACHE_TTL_MS,
  type Settlement,
  type WorldSnapshot,
} from './lib/worldData';
import { safeParse, safeSetItem, chatStorageKey } from './lib/storage';
import {
  getExamsForChart,
  getLatestExamByType,
  getSubjectAverages,
  sortExamsByDate,
  type Exam,
} from './lib/exams';
import { USAGE_GUIDE } from './data/usageGuide';
import { SITE_NAME, SITE_TAGLINE } from './config/site';
import MemberAuthModal from './components/MemberAuthModal';
import MemberPanel from './components/MemberPanel';
import {
  addProgressSnapshot,
  getLoggedInMember,
  getMemberDisplayName,
  logMemberSearch,
  logMemberUpload,
  logMemberVisit,
  type MemberAccount,
} from './lib/membership';
import { loadCurriculumState, loadEducationProfile, setupMemberCurriculum } from './lib/memberEducation';
import { runMemberCoachOnce, startBackgroundCoach, stopBackgroundCoach } from './lib/backgroundCoach';

type UserProfile = {
  name: string;
  field: string;
  targetUniv: string;
  targetDept: string;
  dailyTargetHours: string;
};

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

function buildWelcomeMessage(profile: UserProfile): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    text: `Merhaba ${profile.name}! Ben ${SITE_NAME}, senin yapay zeka eğitim koçun. 🌟\n\nHedefin olan ${profile.targetUniv} - ${profile.targetDept} (${profile.field}) bölümüne giden bu yolda sana destek olmak için buradayım. Sınav netlerini analiz edebilir, ders başarı grafiklerini inceleyebilir ve hedeflerine ulaşman için sana özel çalışma planları önerebilirim.\n\nSol taraftaki panelden yeni denemelerini girerek ilk analizimizi başlatalım! 🚀`,
  };
}

// Varsayılan Deneme Verileri (Başlangıç için)
const DEFAULT_EXAMS = [
  {
    id: '1',
    name: '3D SİMÜLASYON',
    type: 'TYT',
    date: '10.05.2026',
    notes: 'Fen netlerim arttı ancak Türkçede süre kontrolünü geliştirmeliyim.',
    scores: {
      Matematik: { correct: 35, wrong: 4, net: 34 },
      Türkçe: { correct: 32, wrong: 6, net: 30.5 },
      Fen: { correct: 18, wrong: 2, net: 17.5 },
      Sosyal: { correct: 21, wrong: 4, net: 20 }
    },
    totalNet: 102,
    accuracy: 84
  },
  {
    id: '2',
    name: 'LİMİT AYT-1',
    type: 'AYT',
    date: '15.05.2026',
    notes: 'Sosyal-2 beklediğimden iyi geçti. Matematikte logaritma konusunu tekrar etmeliyim.',
    scores: {
      Matematik: { correct: 38, wrong: 2, net: 37.5 },
      Edebiyat: { correct: 21, wrong: 4, net: 20 },
      Fen: { correct: 34, wrong: 4, net: 33 },
      Sosyal: { correct: 36, wrong: 2, net: 35.5 }
    },
    totalNet: 126,
    accuracy: 92
  }
];

// Varsayılan Haftalık Hedefler
const DEFAULT_TASKS = [
  { id: 't1', text: 'Günde 40 Paragraf sorusu çöz', category: 'TUR', done: true },
  { id: 't2', text: 'Trigonometri yarım açı formülleri tekrarı yap', category: 'MAT', done: false },
  { id: 't3', text: 'Kimyasal bağlar konusundan 50 soru bitir', category: 'FEN', done: false },
  { id: 't4', text: 'Tarih - Kurtuluş Savaşı dönemi özetini oku', category: 'SOS', done: true },
  { id: 't5', text: `${SITE_NAME} ile haftalık durum analizi gerçekleştir`, category: 'GENEL', done: false }
];

// Varsayılan Notlar
const DEFAULT_NOTES = [
  {
    id: 'n1',
    date: '18.05.2026',
    title: 'MATEMATİK - LOGARİTMA FORMÜLLERİ',
    content: 'log(a*b) = log(a) + log(b)\nlog(a/b) = log(a) - log(b)\nlog_a(x) = ln(x)/ln(a) taban değiştirme kuralı önemlidir.',
    color: 'blue'
  },
  {
    id: 'n2',
    date: '16.05.2026',
    title: 'EDEBİYAT - DİVAN ŞAİRLERİ',
    content: 'Fuzuli: Izdırap şairi, Su Kasidesi.\nBaki: Rindane şiir, Kanuni Mersiyesi.\nNefi: Siham-ı Kaza (hiciv türü).\nNedim: Şarkı türü, Lale devri eğlence şairi.',
    color: 'pink'
  }
];

// Kütüphane Makaleleri Verisi
const LIBRARY_ARTICLES = [
  {
    id: 'art1',
    category: 'MATEMATİK',
    title: 'TYT Matematik 30+ Net Yapma Stratejileri',
    readTime: '6 dk okuma',
    author: 'Eğitim Koçu Caner Kaya',
    summary: 'TYT Matematik sınavında 30 net barajını aşmanın sırrı, formüllerden ziyade mantıksal akıl yürütmedir. Önce ilk 12 konuyu (Temel Kavramlar, Bölünebilme, Rasyonel Sayılar, Köklü-Üslü Sayılar) hatasız bitirmelisin...',
    content: `TYT Matematik'te 30 netin üzerine çıkmak istiyorsanız şu stratejileri mutlaka uygulamalısınız:
    
    1. İlk 12 Konuda Sıfır Hata Hedefi: Temel Kavramlar, Sayı Basamakları, Bölme-Bölünebilme, OBEB-OKEK, Rasyonel Sayılar, Basit Eşitsizlikler, Mutlak Değer, Üslü Sayılar, Köklü Sayılar, Çarpanlara Ayırma, Oran-Orantı ve Denklem Çözme konuları sınavın omurgasını oluşturur. Bunlardan her yıl yaklaşık 10-12 soru gelir. Bu bölümü eksiksiz tamamlayın.
    
    2. Günlük Problem Rutini: Problemler sınavın neredeyse üçte birini kaplar. Her gün hiç aksatmadan farklı yayınlardan 20 adet "Yeni Nesil Problem" çözmek soru okuma refleksinizi inanılmaz derecede hızlandıracaktır.
    
    3. Geometriyi İhmal Etmeyin: Geometriden her yıl 10 soru çıkmaktadır. Üçgende Açılar, Benzerlik ve Özel Üçgenleri kavramadan diğer konulara geçmeyin. Geometri görme işidir ve sadece her gün çözerek gelişir.`
  },
  {
    id: 'art2',
    category: 'YAPAY ZEKA',
    title: 'AI Koç ile Verimli Ders Çalışma Tüyoları',
    readTime: '4 dk okuma',
    author: 'Yapay Zeka Uzmanı Buse Aksoy',
    summary: 'Yapay zekayı bir sınav ortağı gibi kullanabilirsin! Yapamadığın bir sorunun fotoğrafını veya metnini AI Koçuna göndererek "bunu adım adım, basitleştirerek açıkla" komutu ver. Ayrıca Feynman Tekniği kullanabilirsin...',
    content: `Yapay Zekayı (AI Koç) kendi kişisel öğretmeniniz haline getirmek için şu taktikleri uygulayabilirsiniz:
    
    1. Feynman Tekniği ile Öğrenme: Anlamakta zorlandığınız karmaşık bir konuyu AI Koç'a yazın ve ona şu promptu verin: "Bana [Konu Adı] konusunu 5 yaşındaki bir çocuğa anlatır gibi, en basit benzetmelerle açıkla." Bu yöntemle soyut kavramlar kafanızda hemen netleşecektir.
    
    2. Soru Çözüm Analizi: Çözemediğiniz matematik veya fen sorularını "Bunu adım adım çöz ve her adımda hangi kuralı uyguladığını belirt" diyerek yapay zekaya sorun. Doğrudan cevabı almak yerine mantığı kavrayın.
    
    3. Kişiselleştirilmiş Deneme Değerlendirmesi: Yanlış yaptığınız konuların listesini AI Koç'a vererek "Bu zayıf yönlerime göre bana 3 günlük nokta atışı bir tekrar kampı programı hazırlar mısın?" talebinde bulunun.`
  },
  {
    id: 'art3',
    category: 'MOTİVASYON',
    title: 'Sınav Kaygısıyla Baş Etme Rehberi',
    readTime: '5 dk okuma',
    author: 'PDR Uzmanı Zeynep Şahin',
    summary: 'Kaygı, belirli bir düzeyde olduğunda seni motive eder ancak aşırıya kaçtığında odaklanmanı engeller. Sınav anında nefes egzersizleri yapmayı öğren: 4 saniye nefes al, 4 saniye tut, 4 saniye ver...',
    content: `Kaygı her öğrencide olması gereken doğal bir duygudur. Önemli olan bu kaygıyı yönetebilmektir:
    
    1. Kontrollü Diyafram Nefesi: Sınav esnasında veya çalışırken paniklediğinizi hissettiğiniz anda gözlerinizi kapatın. 4 saniye boyunca burnunuzdan derin nefes alın, 4 saniye boyunca bu nefesi tutun ve ardından 4 saniyede ağzınızdan yavaşça verin. Bu işlem beyninize "her şey yolunda" mesajı gönderir.
    
    2. Felaket Senaryolarını Durdurun: "Ya yapamazsam", "Sınavım kötü geçecek" gibi düşünceler zihninize hücum ettiğinde, kendinize şu ana kadar harcadığınız emeği hatırlatın. Sınavı bir ölüm kalım mücadelesi değil, sadece o güne kadar öğrendiklerinizi yansıtma fırsatı olarak görün.
    
    3. Uyku ve Beslenme Düzeni: Sınav döneminde kafein tüketimini sınırlandırın. Kafein kalp ritmini hızlandırarak yapay bir kaygı ve huzursuzluk hissi yaratabilir. Düzenli uyku ise kaygıyı azaltan en güçlü silahtır.`
  },
  {
    id: 'art4',
    category: 'EDEBİYAT',
    title: 'YKS Edebiyat Ezberleme Hafıza Teknikleri',
    readTime: '7 dk okuma',
    author: 'Edebiyat Öğretmeni Kemal Solmaz',
    summary: 'Edebiyatın yoğun bilgi yığınını ezberlemek için hikayeleştirme (kodlama) yöntemlerini kullan. Örneğin Tanzimat dönemi sanatçılarını komik bir hikaye içinde birleştir. Akrostişler, şair-yazar eşleştirmeli kartlar...',
    content: `AYT Edebiyat'ta 24'te 24 yapmak için ezber yükünü hafifletecek hafıza teknikleri şunlardır:
    
    1. Hikayeleştirme (Kodlama) Yöntemi: Eserleri ve sanatçıları kuru kuru ezberlemek yerine komik, absürt ve akılda kalıcı hikayeler uydurun. Beynimiz mantıklı bilgileri değil, sıra dışı ve komik kurguları asla unutmaz.
    
    2. Akrostiş ve Şifrelemeler: Sanatçıların özelliklerini veya edebi topluluk üyelerini baş harfleriyle şifreleyin. (Örn: Beş Hececiler -> HEYOF: Halit Fahri, Enis Behiç, Yusuf Ziya, Orhan Seyfi, Faruk Nafiz).
    
    3. Görsel Zihin Haritaları: Bir sanatçıyı merkeze alıp etrafına kollar çizerek en önemli eserlerini farklı renkli kalemlerle kağıda dökün. Bu görsel şema zihninizde kalıcı bir yer edinecektir.`
  }
];

const LIBRARY_WITH_GUIDE = [USAGE_GUIDE, ...LIBRARY_ARTICLES];

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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() =>
    safeParse<UserProfile | null>('guidance_core_profile', null),
  );

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
  const [exams, setExams] = useState<Exam[]>(() =>
    safeParse<Exam[]>('guidance_core_exams', DEFAULT_EXAMS as Exam[]),
  );

  const [tasks, setTasks] = useState(() =>
    safeParse('guidance_core_tasks', DEFAULT_TASKS),
  );

  const [notes, setNotes] = useState(() =>
    safeParse('guidance_core_notes', DEFAULT_NOTES),
  );

  const [themeColor, setThemeColor] = useState('indigo'); // indigo, pink, amber, teal, violet
  const [darkMode, setDarkMode] = useState(() =>
    safeParse('guidance_core_dark_mode', false),
  );
  const [activeTab, setActiveTab] = useState('panel'); // panel, merkez, sorucozucu, planlayici, kutuphane, sinavlar
  
  // Sınav Formu State'leri
  const [examType, setExamType] = useState('TYT'); // TYT veya AYT
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examNotes, setExamNotes] = useState('');
  
  // Derslere göre doğru yanlış state'leri
  const [tytScores, setTytScores] = useState({
    Matematik: { correct: 0, wrong: 0 },
    Türkçe: { correct: 0, wrong: 0 },
    Fen: { correct: 0, wrong: 0 },
    Sosyal: { correct: 0, wrong: 0 }
  });

  const [aytScores, setAytScores] = useState({
    Matematik: { correct: 0, wrong: 0 },
    Edebiyat: { correct: 0, wrong: 0 },
    Fen: { correct: 0, wrong: 0 },
    Sosyal: { correct: 0, wrong: 0 }
  });

  // AI Koç State'leri
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiLoadingMode, setAiLoadingMode] = useState<'chat' | 'analysis' | null>(null);
  const [aiChatQuery, setAiChatQuery] = useState('');
  
  // Varsayılan selamlamanın kullanıcıya göre özelleştirilmesi için chat geçmişi
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

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
  const [activeSolution, setActiveSolution] = useState('');
  const [unsolvedArchive, setUnsolvedArchive] = useState(() =>
    safeParse('guidance_core_unsolved_archive', []),
  );

  // Kütüphane Modal State'i
  const [selectedArticle, setSelectedArticle] = useState<typeof LIBRARY_WITH_GUIDE[number] | null>(null);

  // Zeka Merkezi — konum, hava, namaz, takvim, bilim
  const [settlement, setSettlement] = useState<Settlement | null>(() =>
    safeParse<Settlement | null>(LOCATION_CACHE_KEY, null),
  );
  const [worldSnapshot, setWorldSnapshot] = useState<WorldSnapshot | null>(() => {
    const cached = safeParse<WorldSnapshot | null>(WORLD_CACHE_KEY, null);
    if (cached && !isWorldCacheStale(cached.fetchedAt)) return cached;
    return null;
  });
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<Settlement[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [loadingWorld, setLoadingWorld] = useState(false);
  const [scienceBrief, setScienceBrief] = useState('');
  const [loadingScienceBrief, setLoadingScienceBrief] = useState(false);

  const [member, setMember] = useState<MemberAccount | null>(() => getLoggedInMember());
  const [showMemberAuth, setShowMemberAuth] = useState(false);
  const [memberActivityTick, setMemberActivityTick] = useState(0);
  const [curriculumTick, setCurriculumTick] = useState(0);

  const refreshMemberActivity = () => setMemberActivityTick((t) => t + 1);

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const handleLogout = () => {
    requestConfirm(
      'Çıkış Yap',
      'Profilinizden çıkış yapılacak. Verileriniz cihazınızda saklanmaya devam eder.',
      () => {
        setUserProfile(null);
        setChatHistory([]);
        profileNameRef.current = null;
        localStorage.removeItem('guidance_core_profile');
        setConfirmDialog(null);
      },
    );
  };

  // Profil kayıt fonksiyonu
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
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
    setIsEditingProfile(false);
  };

  // Koyu tema: html sınıfı + kalıcı kayıt
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    safeSetItem('guidance_core_dark_mode', darkMode);
  }, [darkMode]);

  // Profil değişince sohbeti yükle (düzenlemede sıfırlama)
  useEffect(() => {
    if (!userProfile) {
      setChatHistory([]);
      profileNameRef.current = null;
      return;
    }

    if (profileNameRef.current === userProfile.name) return;

    profileNameRef.current = userProfile.name;
    const savedChat = safeParse<ChatMessage[]>(chatStorageKey(userProfile.name), []);
    setChatHistory(savedChat.length > 0 ? savedChat : [buildWelcomeMessage(userProfile)]);
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile || chatHistory.length === 0) return;
    safeSetItem(chatStorageKey(userProfile.name), chatHistory);
  }, [chatHistory, userProfile]);

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
    if (!worldSnapshot || isWorldCacheStale(worldSnapshot.fetchedAt)) {
      refreshWorldData(settlement);
    }
  }, [settlement]);

  useEffect(() => {
    if (!settlement) return;
    const interval = setInterval(() => {
      if (!worldSnapshot || isWorldCacheStale(worldSnapshot.fetchedAt)) {
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
    if (!member || activeTab === 'uyepanel') return;
    logMemberVisit(member.id, activeTab);
    refreshMemberActivity();
  }, [activeTab, member?.id]);

  const handleMemberAuthSuccess = async (loggedMember: MemberAccount) => {
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
    if (!userProfile) {
      const profile: UserProfile = {
        name: loggedMember.firstName,
        field: 'Sayısal',
        targetUniv: '',
        targetDept: '',
        dailyTargetHours: '4',
      };
      setUserProfile(profile);
      safeSetItem('guidance_core_profile', profile);
    }
    setActiveTab('uyepanel');
  };

  const handleMemberLogout = () => {
    stopBackgroundCoach();
    setMember(null);
    if (activeTab === 'uyepanel') setActiveTab('panel');
  };

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

  // Tema renk sınıflarını alma helperı
  const getThemeClasses = () => {
    const colors = {
      indigo: {
        bg: 'bg-indigo-600',
        hover: 'hover:bg-indigo-700',
        text: 'text-indigo-600',
        border: 'border-indigo-600',
        lightBg: 'bg-indigo-50',
        darkText: 'dark:text-indigo-400',
        gradient: 'from-indigo-500 to-purple-600',
        ring: 'focus:ring-indigo-500'
      },
      pink: {
        bg: 'bg-pink-600',
        hover: 'hover:bg-pink-700',
        text: 'text-pink-600',
        border: 'border-pink-600',
        lightBg: 'bg-pink-50',
        darkText: 'dark:text-pink-400',
        gradient: 'from-pink-500 to-rose-600',
        ring: 'focus:ring-pink-500'
      },
      amber: {
        bg: 'bg-amber-500',
        hover: 'hover:bg-amber-600',
        text: 'text-amber-500',
        border: 'border-amber-500',
        lightBg: 'bg-amber-50',
        darkText: 'dark:text-amber-400',
        gradient: 'from-amber-500 to-orange-600',
        ring: 'focus:ring-amber-500'
      },
      teal: {
        bg: 'bg-teal-600',
        hover: 'hover:bg-teal-700',
        text: 'text-teal-600',
        border: 'border-teal-600',
        lightBg: 'bg-teal-50',
        darkText: 'dark:text-teal-400',
        gradient: 'from-teal-500 to-emerald-600',
        ring: 'focus:ring-teal-500'
      },
      violet: {
        bg: 'bg-violet-600',
        hover: 'hover:bg-violet-700',
        text: 'text-violet-600',
        border: 'border-violet-600',
        lightBg: 'bg-violet-50',
        darkText: 'dark:text-violet-400',
        gradient: 'from-violet-500 to-fuchsia-600',
        ring: 'focus:ring-violet-500'
      }
    };
    return colors[themeColor] || colors.indigo;
  };

  const activeTheme = getThemeClasses();

  // Maksimum soru sınırları
  const getMaxQuestions = (examType, subject) => {
    if (examType === 'TYT') {
      if (subject === 'Matematik') return 40;
      if (subject === 'Türkçe') return 40;
      if (subject === 'Fen') return 20;
      if (subject === 'Sosyal') return 20;
    } else { // AYT
      if (subject === 'Matematik') return 40;
      if (subject === 'Edebiyat') return 24;
      if (subject === 'Fen') return 40;
      if (subject === 'Sosyal') return 40;
    }
    return 40;
  };

  // Doğru/Yanlış değiştiğinde Net hesaplama (Net = Doğru - Yanlış * 0.25)
  const calculateNet = (correct, wrong) => {
    const net = correct - (wrong * 0.25);
    return Math.max(0, parseFloat(net.toFixed(2)));
  };

  const handleScoreChange = (subject, field, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    const maxQ = getMaxQuestions(examType, subject);

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

  const subjectAverages = getSubjectAverages(exams);
  const chartExams = getExamsForChart(exams);

  // Radar Grafiği için Verileri Formatlama
  const getRadarData = () => {
    return subjectAverages.map(item => {
      let subjectShort = 'MAT';
      if (item.subject.includes('Türkçe')) subjectShort = 'TÜR/EDB';
      if (item.subject.includes('Fen')) subjectShort = 'FEN';
      if (item.subject.includes('Sosyal')) subjectShort = 'SOS';
      
      return {
        subject: subjectShort,
        "Ort. Alanı": item.percentage,
        fullMark: 100
      };
    });
  };

  const radarData = getRadarData();

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
    setTytScores({
      Matematik: { correct: 0, wrong: 0 },
      Türkçe: { correct: 0, wrong: 0 },
      Fen: { correct: 0, wrong: 0 },
      Sosyal: { correct: 0, wrong: 0 }
    });
    setAytScores({
      Matematik: { correct: 0, wrong: 0 },
      Edebiyat: { correct: 0, wrong: 0 },
      Fen: { correct: 0, wrong: 0 },
      Sosyal: { correct: 0, wrong: 0 }
    });

    // Otomatik AI Koç Yorumu
    const introText = `Harika! "${newExam.name}" isimli yeni deneme sınavı sonucunu başarıyla kaydettim.\n\n📊 Sınav Özetin:\n• Tür: ${newExam.type}\n• Toplam Net: ${newExam.totalNet}\n• Doğruluk Oranı: %${newExam.accuracy}\n\nÖzellikle ${Object.entries(newExam.scores).map(([k,v]) => `${k} dersinde ${v.net} net`).join(', ')} yaptığını görüyorum. Bu veriyi gelişim geçmişine işledim. Nasıl çalışman gerektiği konusunda benden tavsiye almak için alt kısımdaki hazır sorulardan birine tıklayabilirsin! 🌟`;
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

  const buildCoachContext = (): CoachContext | null => {
    if (!userProfile) return null;
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
    return {
      profile: userProfile,
      exams,
      subjectAverages,
      pendingTasks: tasks.filter((t: { done: boolean }) => !t.done).length,
      completedTasks: tasks.filter((t: { done: boolean }) => t.done).length,
      recentExamSummary: getRecentExamSummary(),
      estimateRank: metrics.estimateRank,
      avgNet: metrics.avgNet,
      world: worldSnapshot,
      curriculumNote,
    };
  };

  const askLocalCoach = async (userMessage: string) => {
    const context = buildCoachContext();
    if (!context) return;

    setLoadingAi(true);
    setAiLoadingMode('chat');

    try {
      const aiText = await generateCoachChatResponse(userMessage, context);
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
    if (!userProfile) return;
    if (exams.length === 0) {
      setAiAnalysis('Sistemde kayıtlı deneme sınavı bulunamadı. Lütfen analiz için önce en az bir adet deneme sınavı sonucu giriniz.');
      return;
    }

    setLoadingAi(true);
    setAiLoadingMode('analysis');
    try {
      const analysis = await generateFullExamAnalysis(exams, userProfile);
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
    setChatHistory((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: userMessage }]);
    setAiChatQuery('');

    askLocalCoach(userMessage);
  };

  // Önerilen Hazır Sorulardan Birine Tıklama
  const handleSuggestedQuestion = (question: string) => {
    setChatHistory((prev) => [...prev, { id: Date.now().toString(), role: 'user', text: question }]);
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

    try {
      const solutionText = await generateQuestionSolution(
        questionSubject,
        questionText,
        Boolean(questionImage),
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

      setUnsolvedArchive((prev) => [archiveItem, ...prev]);
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
      console.error(error);
      setActiveSolution('Soru çözümü oluşturulamadı. Soru metnini sadeleştirip tekrar deneyin.');
    } finally {
      setLoadingSolution(false);
    }
  };

  // Görsel Dosya Yükleme İşleyicisi
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setNotification({
        title: "DOSYA ÇOK BÜYÜK",
        message: "Lütfen 2MB'tan daha küçük bir görsel yükleyin."
      });
      return;
    }

    setQuestionImageName(file.name);
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
  };

  const toggleTaskDone = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
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
    if (userProfile) {
      setSetupName(userProfile.name);
      setSetupField(userProfile.field);
      setSetupTargetUniv(userProfile.targetUniv);
      setSetupTargetDept(userProfile.targetDept);
      setSetupDailyTargetHours(userProfile.dailyTargetHours);
    }
    setIsEditingProfile(true);
  };

  // GİRİŞ / KURULUM EKRANI (Eğer profil yoksa gösterilir)
  if (!userProfile) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
        <div className={`w-full max-w-xl rounded-3xl p-6 md:p-8 border shadow-2xl transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          <div className="text-center mb-6">
            <div className={`inline-flex p-3 rounded-2xl text-white bg-gradient-to-tr ${activeTheme.gradient} shadow-lg mb-4`}>
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {SITE_NAME}&apos;a Hoş Geldiniz!
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase mt-1">{SITE_TAGLINE}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Size özel bir çalışma planı sunabilmemiz ve yapay zeka koçunuzu hazırlayabilmemiz için lütfen temel bilgilerinizi giriniz.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="setup-name" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Adınız / Rumuzunuz</label>
              <input
                id="setup-name"
                type="text"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="Örn: Ahmet, Ayşe, Geleceğin Mühendisi..."
                className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="setup-field" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">YKS Alanınız</label>
                <select
                  id="setup-field"
                  value={setupField}
                  onChange={(e) => setSetupField(e.target.value)}
                  className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="Sayısal">Sayısal (SAY)</option>
                  <option value="Eşit Ağırlık">Eşit Ağırlık (EA)</option>
                  <option value="Sözel">Sözel (SÖZ)</option>
                  <option value="Dil">Yabancı Dil (DİL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Günlük Çalışma Hedefiniz (Saat)</label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Hedef Üniversite</label>
                <input
                  type="text"
                  value={setupTargetUniv}
                  onChange={(e) => setSetupTargetUniv(e.target.value)}
                  placeholder="Örn: ODTÜ, Boğaziçi, Hacettepe..."
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
                  placeholder="Örn: Tıp, Bilgisayar Müh, Hukuk..."
                  className={`w-full text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${activeTheme.ring} ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-tr ${activeTheme.gradient} ${activeTheme.hover} shadow-md transition-all flex items-center justify-center gap-2`}
              >
                <span>Sınav Yolculuğunu Başlat ➔</span>
              </button>
            </div>
          </form>

          {/* Karanlık Mod Butonu */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-2 ${
                darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{darkMode ? "Açık Tema" : "Koyu Tema"}</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ANA UYGULAMA EKRANI
  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* ÜST BAR (HEADER) */}
      <header className={`p-4 md:px-8 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} sticky top-0 z-50 shadow-sm`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Logo ve Slogan */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl text-white bg-gradient-to-tr ${activeTheme.gradient} shadow-md`}>
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {SITE_NAME}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white ${activeTheme.bg}`}>
                  v1.5
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{SITE_TAGLINE.toUpperCase()}</p>
            </div>
          </div>

          {/* Menü ve Ayarlar */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center">
            
            {/* Kullanıcı Rozeti ve Düzenleme Butonu */}
            <button
              onClick={openEditProfile}
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border font-bold transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-indigo-400' : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100/60 text-indigo-700'
              }`}
              title="Profilimi Düzenle"
            >
              <User className="h-3.5 w-3.5" />
              <span>{userProfile.name} ({userProfile.field})</span>
              <Settings className="h-3 w-3 opacity-60" />
            </button>

            {/* Renk Seçici (Palet) */}
            <div className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold text-slate-400 px-1">TON:</span>
              {['indigo', 'pink', 'amber', 'teal', 'violet'].map(color => (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    color === 'indigo' ? 'bg-indigo-600' :
                    color === 'pink' ? 'bg-pink-600' :
                    color === 'amber' ? 'bg-amber-500' :
                    color === 'teal' ? 'bg-teal-600' : 'bg-violet-600'
                  } ${themeColor === color ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'}`}
                  title={`${color.toUpperCase()} Tema`}
                />
              ))}
            </div>

            {member ? (
              <button
                onClick={() => setActiveTab('uyepanel')}
                className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border font-semibold transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-violet-300' : 'bg-violet-50 border-violet-100 hover:bg-violet-100 text-violet-700'
                }`}
                title="Üye paneli"
              >
                <User className="h-3.5 w-3.5" />
                <span>{getMemberDisplayName(member).split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowMemberAuth(true)}
                className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border font-semibold transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-violet-300' : 'bg-violet-50 border-violet-100 hover:bg-violet-100 text-violet-700'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>ÜYE OL</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedArticle(USAGE_GUIDE);
                setActiveTab('kutuphane');
              }}
              className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border font-semibold transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-sky-300' : 'bg-sky-50 border-sky-100 hover:bg-sky-100 text-sky-700'
              }`}
              title="Site kullanım kılavuzu"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>KILAVUZ</span>
            </button>

            {/* Paylaş Butonu */}
            <button 
              onClick={handleShare}
              className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border font-semibold transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>PAYLAŞ</span>
            </button>

            <button
              onClick={handleLogout}
              className={`flex items-center gap-1 text-xs px-3 py-2 rounded-xl border font-semibold transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-rose-300' : 'bg-white border-slate-200 hover:bg-rose-50 text-rose-600'
              }`}
              title="Çıkış Yap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ÇIKIŞ</span>
            </button>

            {/* Karanlık Mod Butonu */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={darkMode ? 'Açık Tema' : 'Koyu Tema'}
              aria-label={darkMode ? 'Açık temaya geç' : 'Koyu temaya geç'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Navigasyon Sekmeleri */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('panel')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'panel' 
                    ? `${activeTheme.bg} text-white shadow-sm` 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                PANEL
              </button>
              <button
                onClick={() => setActiveTab('merkez')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'merkez'
                    ? `${activeTheme.bg} text-white shadow-sm`
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                🧠 ZEKA MERKEZİ
              </button>
              <button
                onClick={() => setActiveTab('sorucozucu')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'sorucozucu' 
                    ? `${activeTheme.bg} text-white shadow-sm` 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                💡 AI SORU ÇÖZÜCÜ
              </button>
              <button
                onClick={() => setActiveTab('planlayici')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'planlayici' 
                    ? `${activeTheme.bg} text-white shadow-sm` 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                PLANLAYICI
              </button>
              <button
                onClick={() => setActiveTab('kutuphane')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'kutuphane' 
                    ? `${activeTheme.bg} text-white shadow-sm` 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                KÜTÜPHANE
              </button>
              <button
                onClick={() => setActiveTab('sinavlar')}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'sinavlar' 
                    ? `${activeTheme.bg} text-white shadow-sm` 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                GRAFİKLER
              </button>
              {member && (
                <button
                  onClick={() => setActiveTab('uyepanel')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeTab === 'uyepanel'
                      ? `${activeTheme.bg} text-white shadow-sm`
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  ÜYE PANELİ
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

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
            <h3 className="text-sm font-black uppercase tracking-wider mb-2 text-indigo-500">{notification.title}</h3>
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
          onClose={() => setShowMemberAuth(false)}
          onSuccess={handleMemberAuthSuccess}
        />
      )}

      {/* METRİK KARTLARI (ÖZET PANELİ) */}
      <section className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* NET ORTALAMASI */}
          <div className={`p-5 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm flex justify-between items-center`}>
            <div>
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">NET ORTALAMASI</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tracking-tight">{metrics.avgNet}</span>
                <span className="text-sm font-semibold text-slate-500">Net</span>
              </div>
              <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-1">
                <span>↗ Son 3 sınavda artışta</span>
              </p>
            </div>
            <div className={`p-3.5 rounded-2xl ${activeTheme.lightBg} ${activeTheme.darkText}`}>
              <Target className="h-6 w-6" />
            </div>
          </div>

          {/* DOĞRULUK ORANI */}
          <div className={`p-5 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm flex justify-between items-center`}>
            <div>
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">DOĞRULUK ORANI</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tracking-tight">%{metrics.avgAccuracy}</span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">Hataları azaltma hedefi</p>
            </div>
            <div className={`p-3.5 rounded-2xl ${activeTheme.lightBg} ${activeTheme.darkText}`}>
              <Award className="h-6 w-6" />
            </div>
          </div>

          {/* DENEME SAYISI */}
          <div className={`p-5 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm flex justify-between items-center`}>
            <div>
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">DENEME SAYISI</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold tracking-tight">{metrics.examCount} Adet</span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1">YKS Hedefine Hazırlık</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-900/20 dark:text-rose-400">
              <Calendar className="h-6 w-6" />
            </div>
          </div>

          {/* HEDEF ÜNİVERSİTE / SIRALAMA */}
          <div className={`p-5 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm flex justify-between items-center`}>
            <div>
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">HEDEFİNİZ</p>
              <div className="flex flex-col mt-1">
                <span className={`text-sm font-black truncate max-w-[180px] ${activeTheme.text}`} title={userProfile.targetUniv}>
                  {userProfile.targetUniv}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[180px]" title={userProfile.targetDept}>
                  {userProfile.targetDept}
                </span>
              </div>
              <p className="text-[10px] text-purple-500 font-bold flex items-center gap-1 mt-1">
                <span>🎯 Günlük Hedef: {userProfile.dailyTargetHours} Saat</span>
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>

        </div>
      </section>

      {/* ANA İÇERİK ALANI */}
      <main className="px-4 md:px-8 pb-16 max-w-7xl mx-auto">
        
        {/* TAB 1: PANEL (SINAV GİRİŞİ, DERS ORTALAMALARI & AI KOÇ CHAT) */}
        {activeTab === 'panel' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* SOL VE ORTA ALAN: GİRİŞ PANELİ VE DERS ORTALAMALARI */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Sınav Giriş Paneli */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-6 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-5 w-5 ${activeTheme.text}`} />
                    <h2 className="font-extrabold text-lg tracking-tight uppercase">SINAV SONUCU GİRİŞ PANELİ</h2>
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

                    {Object.keys(examType === 'TYT' ? tytScores : aytScores).map(subject => {
                      const currentScores = examType === 'TYT' ? tytScores : aytScores;
                      const maxQ = getMaxQuestions(examType, subject);
                      const currentObj = currentScores[subject];
                      const net = calculateNet(currentObj.correct, currentObj.wrong);

                      return (
                        <div 
                          key={subject}
                          className={`grid grid-cols-12 items-center p-3 rounded-xl border ${
                            darkMode ? 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                          } transition-all`}
                        >
                          <div className="col-span-6 flex items-center gap-2">
                            <span className={`w-1.5 h-8 rounded-full ${
                              subject === 'Matematik' ? 'bg-indigo-500' :
                              subject === 'Türkçe' || subject === 'Edebiyat' ? 'bg-rose-500' :
                              subject === 'Fen' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`} />
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
                    <span>Sınav Kaydet & Analiz Et ➔</span>
                  </button>
                </form>
              </div>

              {/* DERSLERE GÖRE NET ORTALAMASI & RADAR GRAFİĞİ */}
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className="flex justify-between items-center border-b pb-4 mb-6 dark:border-slate-700">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight uppercase">DERSLERE GÖRE NET ORTALAMASI</h3>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Ders bazında şimdiye kadar yaptığın denemelerin performans grafiği</p>
                  </div>
                  <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-xl">Hedef: %100 Başarı</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Sol Sütun: Yatay Bar Oranları */}
                  <div className="md:col-span-7 space-y-5">
                    {subjectAverages.map((sub, i) => {
                      let barColor = 'bg-violet-500';
                      let iconStr = '📐';
                      if (sub.subject.includes('Türkçe')) { barColor = 'bg-rose-500'; iconStr = '✍️'; }
                      if (sub.subject.includes('Fen')) { barColor = 'bg-emerald-500'; iconStr = '🧪'; }
                      if (sub.subject.includes('Sosyal')) { barColor = 'bg-amber-500'; iconStr = '🌍'; }

                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold flex items-center gap-2">
                              <span>{iconStr}</span>
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
                  <div className="md:col-span-5 flex justify-center h-56">
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
                            stroke={themeColor === 'indigo' ? '#4f46e5' : themeColor === 'pink' ? '#db2777' : themeColor === 'amber' ? '#f59e0b' : themeColor === 'teal' ? '#0d9488' : '#7c3aed'} 
                            fill={themeColor === 'indigo' ? '#4f46e5' : themeColor === 'pink' ? '#db2777' : themeColor === 'amber' ? '#f59e0b' : themeColor === 'teal' ? '#0d9488' : '#7c3aed'} 
                            fillOpacity={0.3} 
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* SAĞ KOLON: AI KOÇ & AKADEMİK ÇEVİRİ */}
            <div className="space-y-6">
              
              {/* AI KOÇ INTERACTIVE CHAT */}
              <div className={`p-6 rounded-3xl border relative overflow-hidden ${
                darkMode ? 'bg-slate-800/20 border-slate-700/60' : 'bg-indigo-50/30 border-indigo-100'
              }`}>
                {/* Arka Plan AI Halo Efekti */}
                <div className={`absolute top-0 right-0 w-36 h-36 rounded-full filter blur-3xl opacity-10 ${activeTheme.bg}`} />

                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-xl bg-indigo-500 text-white shadow-sm">
                    <Sparkles className="h-4 w-4 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">{SITE_NAME}</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">YKS REHBERLİK & SINAV ORTAĞIN</p>
                  </div>
                </div>

                <p className="mb-3 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl px-3 py-2">
                  Üst seviye yerel AI — hava, namaz, takvim ve güncel bilimi takip eder. API anahtarı gerekmez.
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
                    darkMode ? 'bg-slate-900/70 border-slate-700 text-slate-200' : 'bg-white border-indigo-100 text-slate-700'
                  }`}>
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-500 mb-2">Detaylı AI Analizi</p>
                    {aiAnalysis}
                  </div>
                )}

                {/* Sohbet Kutusu Akışı */}
                <div className={`rounded-2xl p-4 border mb-4 ${
                  darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-indigo-50'
                }`}>
                  <div className="space-y-3 h-64 overflow-y-auto mb-3 pr-1 scrollbar-thin">
                    {chatHistory.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? `${activeTheme.bg} text-white`
                            : darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-50 text-slate-700'
                        }`}>
                          <p className="font-extrabold text-[9px] uppercase tracking-wider mb-1 opacity-70">
                            {msg.role === 'user' ? 'Siz' : SITE_NAME}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {aiLoadingMode === 'chat' && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl p-3 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                          <span>{SITE_NAME} analiz ediyor...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ÖNERİLEN SORULAR KUTUSU */}
                  <div className="mb-3 border-t pt-3 dark:border-slate-800">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Önerilen Sorular:</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        `Benim gibi bir ${userProfile.field} öğrencisi için ders çalışma tüyoları nelerdir?`,
                        `Hedefim ${userProfile.targetDept}. Sınava nasıl odaklanmalıyım?`,
                        'Matematik netlerimi nasıl artırabilirim?',
                        'Zaman yönetimi için pratik ipuçları verir misin?'
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
                      ✈
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
                    Türkçe ➔ İngilizce
                  </button>
                  <button
                    onClick={() => setTranslateDirection('EN_TR')}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                      translateDirection === 'EN_TR' ? `${activeTheme.bg} text-white` : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    İngilizce ➔ Türkçe
                  </button>
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
                    placeholder={translateDirection === 'TR_EN' ? "Örn: Türev, Ozmos, Fotosentez" : "Örn: Gravity, Cell, Mitosis"}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={loadingTranslation}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {loadingTranslation ? 'Yerel AI Analiz Ediyor...' : 'Terimi Çevir ve Analiz Et'}
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
                          <span className="text-[8px] opacity-60 uppercase">{item.direction === 'TR_EN' ? 'TR ➔ EN' : 'EN ➔ TR'}</span>
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
              onClick={() => setShowMemberAuth(true)}
              className={`text-xs px-5 py-2.5 rounded-xl font-bold text-white ${activeTheme.bg}`}
            >
              Üye Ol / Giriş Yap
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            
            {/* SOL 2 KOLON: SORU GİRİŞİ VE AKTİF ÇÖZÜM */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
                <div className="flex items-center gap-2 border-b pb-4 mb-4 dark:border-slate-700">
                  <QuestionIcon className={`h-5 w-5 ${activeTheme.text}`} />
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
                        <option value="Tarih">Tarih</option>
                        <option value="Coğrafya">Coğrafya</option>
                      </select>
                    </div>

                    {/* Fotoğraf Yükleme Alanı */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">SORU FOTOĞRAFI (OPSİYONEL)</label>
                      <div className="flex gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-dashed rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                          darkMode ? 'border-slate-700' : 'border-slate-300'
                        }`}>
                          <Image className="h-4 w-4 text-slate-400" />
                          <span className="text-[11px] font-bold text-slate-500 truncate">
                            {questionImageName ? questionImageName : "Fotoğraf Seç (Max 2MB)"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
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
                            ✕
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
                      rows={3}
                      className={`w-full text-xs px-4 py-3 rounded-xl border focus:outline-none focus:ring-1 ${activeTheme.ring} ${
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
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4 animate-spin-slow" />
                    <span>{loadingSolution ? 'Yerel AI Çözüm Hazırlıyor...' : 'Soruyu Yerel AI ile Çöz'}</span>
                  </button>
                </form>
              </div>

              {/* Çözüm Sonuç Kartı */}
              {activeSolution && (
                <div className={`p-6 rounded-2xl border animate-fadeIn relative overflow-hidden ${
                  darkMode ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50/40 border-indigo-100'
                }`}>
                  <div className="flex justify-between items-center border-b pb-3 mb-4 dark:border-indigo-900/60 border-indigo-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-indigo-600 dark:text-indigo-400">YAPAY ZEKA DETAYLI DERS ÇÖZÜMÜ</h3>
                    </div>
                    <button
                      onClick={() => handleSaveSolutionToNotes(questionText || "Görsel Soru", activeSolution)}
                      className="text-[10px] font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-1 shadow"
                    >
                      <BookMarked className="h-3.5 w-3.5" />
                      <span>Çözümü Notlarıma Kaydet</span>
                    </button>
                  </div>

                  {/* Eğer soru fotoğrafı varsa ufak bir önizleme gösterelim */}
                  {questionImage && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Analiz Edilen Görsel:</p>
                      <img src={questionImage} alt="Analiz" className="max-h-36 rounded-xl border border-indigo-200 dark:border-indigo-900 object-contain bg-white" />
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
                <div className="border-b pb-4 mb-4 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase">Yapamadığım Sorular</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Soruları tekrar durumuna göre listele</p>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-500">
                    {unsolvedArchive.length} Soru
                  </span>
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
                            Çözümü Gör ➔
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
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
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
                          color === 'blue' ? 'bg-indigo-400' :
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
                  let accentClass = 'border-l-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20';
                  let textAccent = 'text-indigo-600 dark:text-indigo-400';
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

        {/* TAB 3: YKS HIZLANDIRILMIŞ KÜTÜPHANE REHBERİ */}
        {activeTab === 'kutuphane' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Kütüphane Üst Bilgi Kartı */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
              <h2 className="font-extrabold text-xl tracking-tight uppercase mb-2">{SITE_NAME} KÜTÜPHANE REHBERİ</h2>
              <p className="text-xs text-slate-400 font-semibold uppercase">Sınav tüyoları, derece öğrencilerinin taktikleri ve {SITE_NAME} ders çalışma kılavuzları.</p>
              <button
                type="button"
                onClick={() => setSelectedArticle(USAGE_GUIDE)}
                className={`mt-4 inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl font-bold text-white ${activeTheme.bg} ${activeTheme.hover}`}
              >
                <BookOpen className="h-4 w-4" />
                Site Kullanım Kılavuzunu Aç
              </button>
            </div>

            {/* Kütüphane Makaleleri Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {LIBRARY_WITH_GUIDE.map((art) => (
                <div 
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] ${
                    art.id === 'guide-main'
                      ? darkMode
                        ? 'bg-sky-950/30 border-sky-800/50 hover:bg-sky-950/50 ring-1 ring-sky-800/40'
                        : 'bg-sky-50 border-sky-200 hover:bg-sky-100/80 ring-1 ring-sky-200'
                      : darkMode
                        ? 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/60'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md text-white ${
                        art.category === 'KULLANIM KILAVUZU' ? 'bg-sky-600' :
                        art.category === 'MATEMATİK' ? 'bg-violet-500' :
                        art.category === 'YAPAY ZEKA' ? 'bg-indigo-500' :
                        art.category === 'MOTİVASYON' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}>
                        {art.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{art.readTime}</span>
                    </div>

                    <h3 className="font-extrabold text-sm mb-2 text-slate-800 dark:text-slate-100">{art.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-3">{art.summary}</p>
                  </div>

                  <div className="flex justify-between items-center border-t pt-3 dark:border-slate-800 text-[10px] font-bold text-slate-400">
                    <span>👤 {art.author}</span>
                    <span className={activeTheme.text}>Daha Fazlası ➔</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Seçili Makale Modal / Pop-up Okuma Penceresi */}
            {selectedArticle && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className={`w-full max-w-2xl rounded-2xl p-6 md:p-8 overflow-y-auto max-h-[85vh] shadow-2xl relative ${
                  darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800'
                }`}>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 font-extrabold text-lg"
                  >
                    ✕
                  </button>

                  <div className="flex gap-2 items-center mb-4">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 text-white rounded-md ${
                      selectedArticle.category === 'KULLANIM KILAVUZU' ? 'bg-sky-600' : 'bg-indigo-500'
                    }`}>
                      {selectedArticle.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{selectedArticle.readTime}</span>
                  </div>

                  <h2 className="font-extrabold text-lg md:text-xl mb-4 text-slate-900 dark:text-white">{selectedArticle.title}</h2>
                  <p className="text-[11px] font-bold text-slate-400 mb-6">Yazar: {selectedArticle.author}</p>

                  <div className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300 space-y-4">
                    {selectedArticle.content}
                  </div>

                  <div className="mt-8 border-t pt-4 dark:border-slate-700 flex justify-end">
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className={`px-6 py-2 rounded-xl text-white font-bold text-xs ${activeTheme.bg} ${activeTheme.hover}`}
                    >
                      Kapat
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: GRAFİKLER VE GEÇMİŞ LİSTESİ */}
        {activeTab === 'sinavlar' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Net Değişim Grafiği */}
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-100'} shadow-sm`}>
              <h3 className="font-extrabold text-lg mb-6 flex items-center gap-2">
                <Target className={activeTheme.text} />
                <span>ZAMANLA NET DEĞİŞİM GRAFİĞİ</span>
              </h3>

              {exams.length === 0 ? (
                <div className="text-center py-12 text-slate-400">Yeterli veri bulunamadı. Lütfen önce deneme sınavı ekleyin.</div>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartExams} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                        stroke={themeColor === 'indigo' ? '#4f46e5' : themeColor === 'pink' ? '#db2777' : themeColor === 'amber' ? '#f59e0b' : themeColor === 'teal' ? '#0d9488' : '#7c3aed'} 
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
                        exam.type === 'TYT' ? 'bg-indigo-500' : 'bg-pink-500'
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

    </div>
  );
}