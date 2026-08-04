/**
 * KVKK Aydınlatma Metni (6698 sayılı Kanun'un 10. maddesi)
 * Son Güncelleme: 24 Ekim 2025
 */

export const KVKK_CLARIFICATION = {
  title: "Kişisel Verilerin Korunması Aydınlatma Metni",
  lastUpdated: "24 Ekim 2025",
  sections: [
    {
      id: "1",
      title: "1. VERİ SORUMLUSU",
      content: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla aşağıdaki şirket tarafından işlenmektedir:

**Ünvan:** Diligent Computer Systems & Digital Commerce - Dilek Aydemir
**Telefon:** +905359216894
**E-posta:** info@davetim.app
**KEP Adresi:** info@davetim.app`
    },
    {
      id: "2",
      title: "2. KİŞİSEL VERİLERİNİZİN İŞLENME AMAÇLARI",
      content: `Kişisel verileriniz, aşağıdaki amaçlarla KVKK'nın 5. ve 6. maddelerinde belirtilen kişisel veri işleme şartları ve amaçları dahilinde işlenmektedir:

**a) Hizmet Sunumu:**
• Platform hizmetlerinin sağlanması
• Kullanıcı hesabı oluşturma ve yönetme
• Davetiye oluşturma ve paylaşma hizmeti
• RSVP takibi ve misafir yönetimi

**b) Ticari İletişim:**
• Ödeme işlemlerinin gerçekleştirilmesi
• Fatura ve makbuz düzenleme
• Abonelik yönetimi
• Müşteri destek hizmetleri

**c) Yasal Yükümlülükler:**
• 6563 sayılı E-Ticaret Kanunu gereği kayıt tutma
• VUK gereği belge saklama (5 yıl)
• Mahkeme kararları ve yasal taleplerin yerine getirilmesi

**d) Güvenlik:**
• Platformun güvenliğinin sağlanması
• Dolandırıcılık tespiti ve önleme
• Yetkisiz erişim engelleme
• Log kayıtlarının tutulması

**e) Geliştirme ve İyileştirme:**
• Hizmet kalitesinin artırılması
• Kullanıcı deneyimi analizi
• İstatistiksel raporlama
• A/B testleri

**f) Pazarlama (Onayınız ile):**
• Kampanya ve promosyon bildirimleri
• Kişiselleştirilmiş içerik sunumu
• Bülten gönderimi`
    },
    {
      id: "3",
      title: "3. İŞLENEN KİŞİSEL VERİLER VE KATEGORİLER",
      content: `**Kimlik Bilgileri:**
• Ad, soyad
• T.C. kimlik numarası (isteğe bağlı, ödeme için)
• Doğum tarihi (isteğe bağlı)

**İletişim Bilgileri:**
• E-posta adresi
• Cep telefonu numarası
• Adres bilgisi

**Müşteri İşlem Bilgileri:**
• Oluşturulan davetiyeler
• RSVP yanıtları
• Misafir listeleri
• Kullanım geçmişi
• Abonelik bilgileri

**Finansal Bilgiler:**
• Ödeme türü (kredi kartı/banka kartı)
• Son 4 hane kart numarası (güvenlik için)
• Fatura bilgileri
• Ödeme geçmişi
*(Tam kart bilgileri saklanmaz, PCI DSS uyumlu ödeme sağlayıcıda işlenir)*

**İşlem Güvenliği Bilgileri:**
• IP adresi
• Çerez bilgileri
• Cihaz bilgileri (tarayıcı, işletim sistemi)
• Giriş/çıkış log kayıtları
• Konum bilgisi (isteğe bağlı)

**Görsel ve İşitsel Kayıtlar:**
• Profil fotoğrafı (isteğe bağlı)
• Davetiye görselleri
• Yüklenen medya dosyaları

**Pazarlama Bilgileri (Onay ile):**
• İlgi alanları
• Tercihler ve favoriler
• Kampanya etkileşimleri`
    },
    {
      id: "4",
      title: "4. KİŞİSEL VERİLERİN TOPLANMA YÖNTEMİ",
      content: `Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:

**Otomatik Yöntemler:**
• Web sitesi ve mobil uygulama kullanımı
• Çerezler (cookies) ve benzeri teknolojiler
• Log kayıtları
• API entegrasyonları

**Otomatik Olmayan Yöntemler:**
• Kayıt formları
• İletişim formları
• E-posta ve telefon ile iletişim
• Müşteri hizmetleri görüşmeleri
• Anket ve geri bildirimler

**Üçüncü Taraf Kaynaklar:**
• Sosyal medya platformları (Facebook, Google ile giriş)
• Ödeme servis sağlayıcıları
• Kamu kurumları (yasal zorunluluk halinde)`
    },
    {
      id: "5",
      title: "5. KİŞİSEL VERİLERİN AKTARILDIĞI TARAFLAR",
      content: `Kişisel verileriniz, KVKK'nın 8. ve 9. maddelerine uygun olarak aşağıdaki taraflara aktarılabilir:

**a) Yurt İçi Aktarımlar:**

**Hizmet Sağlayıcılar:**
• İyzico (ödeme işlemleri) - PCI DSS sertifikalı
• Supabase (veri barındırma) - AB GDPR uyumlu
• E-posta servisleri (iletişim)
• SMS gateway (bildirimler)
• CDN sağlayıcılar (içerik dağıtımı)

**İş Ortakları:**
• Muhasebecilik hizmetleri (fatura düzenleme)
• Hukuk danışmanlığı (yasal süreçler)

**Yasal Merciler:**
• Mahkemeler
• Savcılıklar
• Emniyet Müdürlükleri
• Vergi daireleri
• Ticaret Bakanlığı
• BTK

**b) Yurt Dışı Aktarımlar:**
• Supabase (ABD/AB) - Yeterli koruma veya sözleşmesel güvenceler ile
• Cloud servisler - GDPR ve KVKK uyumlu

**Aktarım Şartları:**
• Hizmet sunumu için gereklilik
• Yasal zorunluluk
• İlgili kişinin açık rızası
• Sözleşmenin ifası için gereklilik`
    },
    {
      id: "6",
      title: "6. KVKK KAPSAMINDA HAKLARINIZ",
      content: `KVKK'nın 11. maddesi uyarınca, veri sorumlusuna başvurarak aşağıdaki haklarınızı kullanabilirsiniz:

**a)** Kişisel verilerinizin işlenip işlenmediğini öğrenme

**b)** Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme

**c)** Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme

**d)** Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme

**e)** Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme

**f)** KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme

**g)** (e) ve (f) bentleri uyarınca yapılan işlemlerin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme

**h)** İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme

**i)** Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması hâlinde zararın giderilmesini talep etme

**Başvuru Yöntemleri:**
• E-posta: info@davetim.app
• KEP: info@davetim.app
• Platform: Hesap Ayarları > KVKK Hakları

**Yanıt Süresi:** 30 gün içinde (ücretsiz)`
    },
    {
      id: "7",
      title: "7. KİŞİSEL VERİLERİN SAKLANMA SÜRESİ",
      content: `Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca saklanır:

**Hesap Aktif İken:**
• Tüm veriler aktif olarak saklanır
• Düzenli yedekleme yapılır

**Hesap Silindikten Sonra:**
• 30 gün içinde: Geri dönüş için saklama
• 30 gün sonra: Kullanıcı verileri silinir
• Yasal saklama yükümlülüğü: 5 yıl (VUK)
  - Faturalar
  - Ödeme kayıtları
  - Sözleşmeler

**Log Kayıtları:**
• Güvenlik logları: 1 yıl
• Erişim logları: 6 ay
• Hata logları: 3 ay

**Pazarlama Verileri:**
• Onay iptalinden sonra 6 ay içinde silinir

**Silme/Yok Etme/Anonim Hale Getirme:**
Saklama süreleri sona erdiğinde veriler:
• Güvenli silme protokolleri ile silinir
• Geri getirilemez şekilde yok edilir
• Veya istatistiksel amaçla anonimleştirilir`
    },
    {
      id: "8",
      title: "8. VERİ GÜVENLİĞİ ÖNLEMLERİ",
      content: `KVKK'nın 12. maddesi gereği, kişisel verilerinizin güvenliğini sağlamak için alınan önlemler:

**Teknik Önlemler:**
• SSL/TLS şifreleme (HTTPS)
• Veritabanı şifreleme (AES-256)
• Güvenlik duvarı (Firewall)
• DDoS koruması
• Penetrasyon testleri
• Güvenlik açığı taraması
• İki faktörlü kimlik doğrulama (2FA)
• Otomatik yedekleme

**İdari Önlemler:**
• Erişim yetkilendirme matrisi
• Veri sınıflandırması
• Gizlilik sözleşmeleri (çalışanlar)
• Düzenli güvenlik eğitimleri
• Veri ihlali müdahale planı
• Denetim ve log izleme

**Fiziksel Önlemler:**
• Güvenli veri merkezleri
• 7/24 izleme
• Yangın ve sel koruması
• Yedekli güç kaynakları`
    },
    {
      id: "9",
      title: "9. VERİ İHLALİ BİLDİRİMİ",
      content: `Kişisel veri ihlali durumunda KVKK uyarınca:

**Şirket Yükümlülükleri:**
• 72 saat içinde Kişisel Verileri Koruma Kurumu'na bildirim
• Etkilenen kullanıcılara derhal bilgilendirme
• İhlal kapsamı, nedeni ve alınan önlemler hakkında bilgi

**Kullanıcı Hakları:**
• İhlal hakkında bilgi alma
• Zararın giderilmesini talep etme
• Şikayet ve dava hakları

**İletişim:**
Veri ihlali şüphesi veya tespiti: info@davetim.app`
    },
    {
      id: "10",
      title: "10. ONAY VE KABUL",
      content: `Bu aydınlatma metnini okuduğunuzu ve anladığınızı, kişisel verilerinizin yukarıda belirtilen amaçlar ve şartlarda işlenmesine rıza gösterdiğinizi kabul ve beyan edersiniz.

Platform kullanımı ile bu metni kabul etmiş sayılırsınız.

**İletişim:**
Sorularınız için: info@davetim.app

**Revizyon:**
Bu metin, yasal değişikliklere uyum sağlamak için güncellenebilir.

**Yürürlük Tarihi:** 24 Ekim 2025
**Sürüm:** 1.0`
    }
  ]
};

