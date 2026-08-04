/**
 * Mesafeli Satış Sözleşmesi (6502 sayılı Tüketicinin Korunması Hakkında Kanun)
 * Cayma Hakkı: 3 gün (Gönüllü - Dijital İçerik İstisnası)
 * Son Güncelleme: 13 Kasım 2024
 */

export interface DistanceSalesContractParams {
  userName?: string;
  userEmail?: string;
  planName?: string;
  planPeriod?: string;
  amount?: number;
}

/**
 * Generates the Distance Sales Contract text
 * Can be used with or without user-specific data
 */
export function generateDistanceSalesContractText(params?: DistanceSalesContractParams): string {
  const userName = params?.userName || '[ALICI AD SOYAD]';
  const userEmail = params?.userEmail || '[ALICI E-POSTA]';
  const planName = params?.planName || '[PLAN ADI]';
  const amount = params?.amount || '[TUTAR]';
  const planPeriod = params?.planPeriod || '[PERİYOT]';
  const contractDate = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return `MESAFELİ SATIŞ SÖZLEŞMESİ

1. TARAFLAR
İşbu Sözleşme aşağıdaki taraflar arasında aşağıda belirtilen hüküm ve şartlar çerçevesinde imzalanmıştır.

1.1. SATICI:
Ünvan: Diligent Computer Systems & Digital Commerce - Dilek Aydemir
Telefon: +90 535 921 68 94
E-posta: info@davetim.app
Web: davetim.app

1.2. ALICI:
Ad Soyad: ${userName}
E-posta: ${userEmail}

2. SÖZLEŞME KONUSU
İşbu Sözleşme'nin konusu, ALICI'nın SATICI'ya ait davetim.app internet sitesi üzerinden elektronik ortamda siparişini yaptığı aşağıda nitelikleri ve satış fiyatı belirtilen ürün/hizmetin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkındaki Kanun ve Mesafeli Sözleşmelere Dair Yönetmelik hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.

3. ÜRÜN/HİZMET BİLGİLERİ
Hizmet: ${planName} Plan
Açıklama: Dijital davetiye oluşturma ve yönetim hizmeti
Fiyat: ${amount} TRY (KDV Dahil)
Ödeme Şekli: Kredi Kartı (${planPeriod} Abonelik)
Teslimat: Elektronik ortamda anında

Hizmet Kapsamı:
${getServiceFeatures(planName)}

Önemli Notlar:
• Bu bir dijital hizmet satışıdır
• Hizmet, ödeme onayı sonrası anında aktif hale gelir
• Kullanım süresi boyunca erişim sağlanır

4. GENEL HÜKÜMLER
4.1. ALICI, davetim.app internet sitesinde sözleşme konusu ürün/hizmetin temel nitelikleri, satış fiyatı ve ödeme şekli ile teslimat/kullanıma açılma süresine ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda gerekli teyidi verdiğini beyan eder.

4.2. Sözleşme konusu hizmet, yasal 30 günlük süreyi aşmamak kaydı ile her bir ürün için ALICI'nın yerleşim yerinin uzaklığına bağlı olarak internet sitesinde ön bilgiler içinde açıklanan süre içinde ALICI veya gösterdiği adresteki kişi/kuruluşa teslim edilir.

4.3. Dijital içerik ve hizmetler, teslim edildikten sonra iade ve cayma hakkı kapsamı dışındadır.

5. CAYMA HAKKI
5.1. Cayma Hakkı Süresi:
ALICI, dijital içeriğin teslimatına başlanmadan önce cayma hakkına sahiptir. Ancak, 6502 sayılı Tüketicinin Korunması Hakkında Kanun'un 15. maddesi uyarınca, dijital içeriğin teslimi yapılmış ise cayma hakkı kullanılamaz.

İşbu sözleşmede:
• Abonelik başlangıç tarihinden itibaren 3 (üç) gün içinde cayma hakkı kullanılabilir
• Bu süre içinde ALICI, hizmeti kullanmış olsa dahi cayma hakkını kullanabilir
• 3 günlük süre, işletme tarafından müşteri memnuniyeti kapsamında sunulan gönüllü bir haktır

5.2. Cayma Hakkının Kullanılması:
Cayma hakkının kullanılması için 3 gün içinde SATICI'ya yazılı olarak veya kalıcı veri saklayıcısı (e-posta, platform hesap ayarları vb.) ile bildirimde bulunulması gerekmektedir.

5.3. Cayma Hakkı Bildirimi:
• E-posta: info@davetim.app
• Telefon: +90 535 921 68 94
• Platform: Hesap Ayarları > Abonelik Yönetimi > İptal Et

5.4. Cayma Hakkının Sonuçları:
Cayma hakkının kullanılması durumunda:
• Ödenen tutar 10 (on) iş günü içinde ALICI'ya tam olarak iade edilir
• Hizmet erişimi derhal sonlandırılır ve hesap FREE plana düşürülür
• Kredi kartına iadeler, banka tarafından hesaba yansıtılır (2-4 hafta sürebilir)
• 3 gün içinde cayma hakkı kullanılırsa, kullanım yapılmış olsa bile tam iade yapılır

5.5. Dijital İçerik ve Hizmet Özelliği:
6502 sayılı Kanun'un 15. maddesi, 1. fıkrası, (ı) bendi gereğince:
"Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz."

Buna rağmen:
• İşletme, müşteri memnuniyeti için 3 günlük cayma hakkı tanımaktadır
• Bu süre içinde ALICI cayma hakkını kullanabilir
• 3 günlük süre sonrasında, dijital içerik teslim edildiği için cayma hakkı sona erer

5.6. Cayma Hakkı İstisnası:
3 günlük süre geçtikten sonra cayma hakkı kullanılamaz. Bu durumda:
• ALICI, aboneliğini iptal edebilir (yenilenmez)
• Mevcut abonelik süresi sonuna kadar hizmet kullanılmaya devam edilir
• Ödeme iadesi yapılmaz, ancak yenileme yapılmaz

6. SATICI'NIN HAK VE YÜKÜMLÜLÜKLERİ
6.1. Satıcı Yükümlülükleri:
• Hizmeti, sözleşmede belirtilen niteliklere uygun olarak sunmak
• Platform güvenliğini ve veri gizliliğini sağlamak
• Teknik destek hizmeti vermek
• ALICI'nın haklarını korumak
• Yasal mevzuata uymak

6.2. Satıcı Hakları:
• Hizmet koşullarını değiştirme (önceden bildirerek)
• Kötüye kullanım durumunda hesabı askıya alma
• Yasal yükümlülükler için gerekli bilgileri saklama
• Ödeme tahsil etme

6.3. QR Kod ve Medya Güvenliği:
ALICI, oluşturulan davetiyelerdeki QR kodlar aracılığıyla yüklenen veya erişilen medyaların güvenliğinden bizzat sorumludur. QR kodun üçüncü şahıslarla paylaşılması, çalınması veya yetkisiz kişilerce taranması sonucu medyalara erişim sağlanması durumunda, SATICI hiçbir sorumluluk kabul etmez. ALICI, QR kodların paylaşımı konusunda gerekli hassasiyeti göstermekle yükümlüdür.

7. ALICI'NIN HAK VE YÜKÜMLÜLÜKLERİ
7.1. Alıcı Yükümlülükleri:
• Sözleşme bedelini ödemek
• Kullanım koşullarına uymak
• Hesap güvenliğini sağlamak
• Doğru ve güncel bilgiler vermek
• Hizmeti yasalara uygun kullanmak

7.2. Alıcı Hakları:
• Cayma hakkı (3 gün - gönüllü)
• Kişisel verilerin korunmasını isteme
• Teknik destek alma
• Hizmetin kesintisiz sunumunu talep etme
• Şikayet ve itiraz hakkı

8. ÖDEME VE TESLİMAT
8.1. Ödeme:
ALICI, sözleşme konusu hizmet bedelini, belirtilen ödeme yöntemi ile ödemeyi kabul ve taahhüt eder.

8.2. Teslimat:
Hizmet, ödeme onayı sonrasında elektronik ortamda anında teslim edilir. Kullanıcı hesabı, abonelik süresi boyunca aktif kalır.

8.3. Ödeme Sorunları:
Kredi kartı ile ödeme yapılması halinde, kartın kullanıma uygun olmaması veya banka tarafından işlemin onaylanmaması durumunda, SATICI'nın hizmeti sunma yükümlülüğü doğmaz.

9. ÖDEME GÜVENLİĞİ
ALICI, bu sözleşmedeki ödeme işlemlerinde kullanacağı kredi kartının kendi adına düzenlenmiş olduğunu, hukuka aykırı kartın kullanımından kaynaklanan zararlar konusunda sorumlu olduğunu kabul, beyan ve taahhüt eder.

Kredi kartı bilgileri, PCI DSS standartlarına uygun şekilde, güvenli ödeme altyapısı (İyzico) üzerinden işlenir. SATICI, kredi kartı bilgilerini saklamaz.

10. UYUŞMAZLIKLARIN ÇÖZÜMÜ
İşbu Sözleşme'den kaynaklanan uyuşmazlıklarda;

Tüketici Hakem Heyetleri:
• 2024 yılı için belirlenen parasal sınırlara kadar
• İl ve İlçe Tüketici Hakem Heyetleri'ne başvurulabilir

Tüketici Mahkemeleri:
• ALICI'nın veya SATICI'nın yerleşim yerindeki Tüketici Mahkemeleri yetkilidir

Başvuru Süreleri:
• Hizmetin teslim tarihinden itibaren 3 (üç) yıl içinde
• Cayma hakkı: 3 (üç) gün içinde

11. KİŞİSEL VERİLERİN KORUNMASI
ALICI'ya ait kişisel veriler, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili mevzuat hükümlerine uygun olarak işlenmektedir. Detaylı bilgi için Gizlilik Politikası'na bakınız.

ALICI, kişisel verilerinin işlenmesine açık rıza göstermektedir.

12. YÜRÜRLÜK VE ONAY
ALICI, işbu sözleşmeyi elektronik ortamda onaylamakla, sözleşme konusu hizmetin türü, miktarı, marka/modeli, satış bedeli, ödeme şekli, teslimat koşulları ve cayma hakkı ile ilgili tüm ön bilgileri okuduğunu, anladığını ve sözleşme ile bağlı olduğunu kabul, beyan ve taahhüt eder.

Sözleşme Tarihi: ${contractDate}
Onay Yöntemi: Elektronik (Ödeme onayı ile)

İşbu sözleşme 12 (on iki) maddeden ibaret olup, taraflarca elektronik ortamda onaylanmış ve yürürlüğe girmiştir.

SATICI:
Diligent Computer Systems & Digital Commerce - Dilek Aydemir

ALICI:
${userName}
${userEmail}`;
}

/**
 * Get service features description based on plan name
 */
function getServiceFeatures(planName: string): string {
  const plan = planName.toUpperCase();

  const features: Record<string, string> = {
    'FREE': `• 1 adet dijital davetiye (tek kullanım)
• 5 temel şablona erişim
• PDF/PNG indirme ve link paylaşımı
• RSVP takibi (50 misafir)
• 5 MB depolama, watermark'lı yayın`,

    'PRO': `• Aylık 3 dijital davetiye
• PRO seviyesi şablonlar
• Görsel yükleme ve renk özelleştirme
• Sosyal medya paylaşımı + Excel export
• Sınırsız RSVP ve 100 MB depolama`,

    'PREMIUM': `• Sınırsız dijital davetiye
• Premium şablonlar ve PRO özellikleri
• QR medya yükleme (3 ay / yıllıkta 12 ay)
• 24/7 öncelikli destek
• Watermark'sız yayın ve 500 MB depolama`
  };

  return features[plan] || features['FREE'];
}

/**
 * Legacy interface for compatibility with existing code
 * @deprecated Use generateDistanceSalesContractText instead
 */
export interface DistanceSalesContractData {
  contractNumber: string;
  date: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAddress: string;
  planName: string;
  planPeriod: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
}

/**
 * Legacy function for compatibility
 * @deprecated Use generateDistanceSalesContractText instead
 */
export const generateDistanceSalesContract = (data: DistanceSalesContractData) => ({
  title: "MESAFELİ SATIŞ SÖZLEŞMESİ",
  contractNumber: data.contractNumber,
  date: data.date,
  sections: [
    {
      id: "1",
      title: "MADDE 1 - TARAFLAR",
      content: generateDistanceSalesContractText({
        userName: data.userName,
        userEmail: data.userEmail,
        planName: data.planName,
        planPeriod: data.planPeriod,
        amount: data.amount
      })
    }
  ]
});

/**
 * Generate static legal document for LegalPage
 */
export const DISTANCE_SALES_CONTRACT = {
  title: "Mesafeli Satış Sözleşmesi",
  lastUpdated: "13 Kasım 2024",
  sections: [
    {
      id: "contract",
      title: "Mesafeli Satış Sözleşmesi",
      content: generateDistanceSalesContractText()
    }
  ]
};
