export const USAGE_GUIDE = {
  id: 'guide-main',
  category: 'KULLANIM KILAVUZU',
  title: 'aikoc — Site Kullanım Kılavuzu',
  readTime: '12 dk okuma',
  author: 'aikoc',
  summary:
    'İlk kurulumdan sınav takibine, Zeka Merkezi’nden AI Soru Çözücü’ye kadar tüm özelliklerin adım adım açıklaması. Yeni başlayanlar için başlangıç rehberi.',
  content: `aikoc, YKS hazırlık sürecinizi tek bir yerde toplayan ücretsiz bir sınav takip ve yapay zeka asistanı uygulamasıdır. API anahtarı gerekmez; sınav analizi ve koç sohbeti cihazınızda çalışır.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. İLK KULLANIM (ÜYE OLMADAN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Uygulamayı açtığınızda doğrudan ana arayüz gelir; üyelik zorunlu değildir.

Misafir olarak kullanabileceğiniz bölümler:
• Planlayıcı
• AI Soru Çöz
• Zeka Merkezi
• Kütüphane

İsterseniz üst bardaki adınıza tıklayarak rumuz, alan ve hedef bilgilerinizi düzenleyebilirsiniz. Profil tarayıcınızda saklanır.

Kullanım kılavuzu yalnızca üst bardaki 「KILAVUZ」 butonundan açılır; kütüphane içinde yer almaz.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ÜYELİK SİSTEMİ (E-POSTA & TELEFON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ücretsiz üyelik ile ekstra Üye Paneli açılır.

Kayıt alanları:
• Ad ve soyad
• E-posta
• Telefon
• Şifre (en az 6 karakter)

Üst bardaki 「ÜYE OL」 ile kayıt olun veya giriş yapın. Giriş yaptıktan sonra 「ÜYE PANELİ」 sekmesi görünür.

Üye Paneli bölümleri:
• Özet — deneme, arama, ziyaret ve yükleme sayıları
• Gelişim — günlük, haftalık, aylık, 3/6 aylık ve yıllık net istatistikleri
• Ödev Takip — ödev ekleme ve durum (bekliyor / devam / tamamlandı)
• Konu Takip — konu bazlı ilerleme yüzdesi
• Arama Geçmişi — konum, sözlük ve üye aramaları
• Ziyaretler — hangi sekmeleri ne zaman açtığınız
• Yüklemeler — giriş yaptıktan sonra eklediğiniz sınav, soru ve notlar
• Üye Ara — kayıtlı üyeler arasında ad/e-posta ile arama

Not: Üyelik verileri şu an cihazınızda (localStorage) saklanır. Farklı cihazda aynı hesap görünmez.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. ÜST MENÜ VE AYARLAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Üst çubukta şunlar bulunur:

• ÜYE OL / adınız — üyelik girişi veya üye paneline kısayol
• Profil düğmesi — hedef üniversite, alan ve günlük çalışma saatini günceller
• TON — indigo, pembe, amber, teal, mor tema renkleri
• PAYLAŞ — ortalama net, doğruluk ve sıralama tahmininizi panoya kopyalar
• ÇIKIŞ — oturumu kapatır (verileriniz silinmez, profil ekranına dönersiniz)
• Ay/Güneş — koyu veya açık tema

Sekmeler: PANEL · ZEKA MERKEZİ · AI SORU ÇÖZÜCÜ · PLANLAYICI · KÜTÜPHANE · GRAFİKLER · (üye ise) ÜYE PANELİ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. PANEL SEKMESİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ana çalışma alanınızdır. Üç bölümden oluşur:

A) Sınav Sonucu Giriş Paneli
• TYT veya AYT formatını seçin
• Yayın / sınav adını yazın (hızlı seç butonları da vardır)
• Sınav tarihini girin
• Her branş için doğru ve yanlış sayılarını girin; net otomatik hesaplanır
• İsteğe bağlı sınav notu ekleyin
• 「Sınav Kaydet & Analiz Et」 ile kaydedin

B) Ders Ortalamaları ve Radar Grafiği
• Girdiğiniz tüm denemelerin branş bazlı ortalamalarını gösterir
• Güçlü ve zayıf alanlarınızı görsel olarak karşılaştırın

C) aikoc Sohbeti (sağ sütun)
• Kişisel yapay zeka koçunuzla yazışın
• Netleriniz, hedefleriniz ve görev listeniz bağlam olarak kullanılır
• Örnek sorular:
  — "Son denememi analiz et"
  — "Matematikte nasıl gelişirim?"
  — "Bu hafta ne çalışmalıyım?"
  — "Bugün hava nasıl?" (konum seçiliyse)
  — "Öğle namazı kaçta?"
  — "YKS'ye kaç gün kaldı?"

D) Akademik Sözlük / Çeviri
• İngilizce akademik terimleri Türkçe karşılıklarıyla öğrenin
• Popüler terimlere tıklayın veya kendi teriminizi yazıp çevirin
• Çeviri geçmişi otomatik kaydedilir

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. ZEKA MERKEZİ SEKMESİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hava, namaz, takvim ve güncel bilimi tek yerden takip eder. Canlı veriler için internet gerekir.

Adımlar:
1. Yerleşim yeri kutusuna ilçe, belde veya köy adı yazın (ör. Kadıköy, Çankaya)
2. Listeden konumunuzu seçin
3. Saatlik hava, namaz vakitleri, takvim ve bilim akışı otomatik yüklenir
4. 「Verileri Yenile」 ile manuel güncelleyin

Özellikler:
• Saatlik hava durumu — 24 saatlik tahmin, sıcaklık ve yağış olasılığı
• Namaz vakitleri — Diyanet metodu (Aladhan)
• Takvim — resmi tatiller, hicri tarih, YKS geri sayımı
• Bilim akışı — OpenAlex üzerinden güncel akademik yayınlar
• AI Özet — yerel AI ile bilim özeti oluşturur

Veriler 30 dakikada bir otomatik yenilenir. Seçtiğiniz konum tarayıcıda saklanır.

Not: Çok küçük köyler listede çıkmayabilir; en yakın yerleşim yeri seçin.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. AI SORU ÇÖZÜCÜ SEKMESİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Çözemediğiniz sorular için adım adım çözüm alın.

• Soru metnini yazın veya net bir fotoğraf yükleyin
• Örnek sorulardan birini seçerek deneyebilirsiniz
• 「Çözümü Getir」 ile yerel AI adım adım açıklama üretir
• Çözülemeyen sorular arşive eklenir; daha sonra tekrar bakabilirsiniz

İpucu: Fotoğraf yerine sorunun metnini yazmak daha güvenilir sonuç verir.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. PLANLAYICI SEKMESİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Haftalık hedeflerinizi ve notlarınızı yönetin.

Haftalık Hedef Planlayıcı:
• Yeni görev ekleyin (metin + kategori: MAT, TUR, FEN, SOS, GENEL)
• Tamamlanan görevleri işaretleyin
• İlerleme çubuğu tamamlanma oranını gösterir
• Silmek için çöp kutusu simgesine tıklayın (onay istenir)

Not Defterim:
• Başlık, içerik ve renk seçerek not oluşturun
• Formül, özet veya ezber listelerinizi saklayın
• Notları silmek için onay penceresi çıkar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. KÜTÜPHANE SEKMESİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ücretsiz ve açık erişimli kaynaklar: bilimsel makaleler, ders kitapları, romanlar, haritalar (şehir/ilçe/köy/mahalle), ansiklopediler, onaylı bilimsel ve dini yayınlar.

• Kelime veya kelime gruplarıyla arama yapın
• Kategori filtreleriyle daraltın
• Kaynağa tıklayıp harici bağlantıdan okuyun
• 「Kaynak Öner」 ile makale/kitap önerebilirsiniz — editör onayından sonra listeye eklenir
• Editör PIN ile onay bekleyen önerileri yönetebilirsiniz (yönetici)

Kullanım kılavuzu yalnızca üst bardaki 「KILAVUZ」 düğmesindedir; kütüphanede yer almaz.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. SINAVLAR SEKMESİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Geçmiş denemelerinizi grafiklerle inceleyin.

• Zamanla net değişim grafiği — tüm TYT/AYT denemelerinizin trendi
• Deneme listesi — her sınavın detaylı net dağılımı
• Sınav silmek için çöp kutusu (onay istenir)

En az bir deneme girdikten sonra grafikler anlamlı veri gösterir.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. VERİLERİNİZ NEREDE SAKLANIR?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tüm veriler tarayıcınızın yerel deposunda (localStorage) tutulur:

• Profil bilgileri
• Sınav sonuçları
• Sohbet geçmişi (profil başına ayrı)
• Görevler ve notlar
• Konum ve Zeka Merkezi önbelleği

Veriler sunucuya gönderilmez. Tarayıcı verilerini temizlerseniz kayıtlar silinir; düzenli yedek için PAYLAŞ özelliğini kullanabilirsiniz.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. İNTERNET VE GİZLİLİK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Sınav analizi, koç sohbeti, soru çözümü, sözlük → çevrimdışı çalışabilir
• Hava, namaz, takvim, bilim akışı → internet gerektirir (ücretsiz açık API’ler)
• Ücretli API anahtarı veya abonelik gerekmez

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. SIK SORULAN SORULAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

S: API anahtarı nereden alınır?
C: Gerekmez. aikoc tamamen ücretsiz yerel ve açık kaynak verilerle çalışır.

S: Telefonda kullanabilir miyim?
C: Evet. Arayüz mobil uyumludur; tarayıcıdan açmanız yeterlidir.

S: Deneme verilerim kaybolur mu?
C: Aynı tarayıcı ve cihazda kalır. Farklı cihaz veya gizli sekmede profil sıfırdan başlar.

S: aikoc gerçek zamanlı mı?
C: Koç yanıtları cihazınızda üretilir; Zeka Merkezi verileri seçtiğiniz konuma göre güncellenir.

S: Fotoğraflı soru neden çözülmüyor?
C: Görüntüden metin çıkarma sınırlıdır; soruyu metin olarak yazın.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. HIZLI BAŞLANGIÇ CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☐ Profilini oluştur
☐ Üye ol (e-posta, telefon, ad, soyad)
☐ İlk TYT veya AYT denemeni gir
☐ aikoc’tan analiz iste
☐ Zeka Merkezi’nde konumunu seç
☐ Haftalık 3–5 hedef ekle
☐ Bir çözemediğin soruyu AI Soru Çözücü’ye yaz
☐ Kütüphane’den bir rehber oku

İyi çalışmalar — hedefinize bir adım daha yaklaşın! 🚀`,
};
