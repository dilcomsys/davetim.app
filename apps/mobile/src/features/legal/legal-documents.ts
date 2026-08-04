export type LegalSection = { content: string; title: string };
export type LegalDocument = { lastUpdated: string; sections: LegalSection[]; title: string };

const contact = 'Sorularınız ve KVKK kapsamındaki talepleriniz için info@davetim.app adresine ulaşabilirsiniz.';

export const legalDocuments: Record<string, LegalDocument> = {
  privacy: {
    title: 'Gizlilik Politikası',
    lastUpdated: '4 Ağustos 2026',
    sections: [
      { title: 'Veri sorumlusu', content: `Davetim hizmeti, Diligent Computer Systems & Digital Commerce - Dilek Aydemir tarafından sunulur. ${contact}` },
      { title: 'İşlediğimiz veriler', content: 'Hesap bilgileri (ad ve e-posta), oluşturduğunuz davetler, davetli ve RSVP kayıtları, yüklemeyi seçtiğiniz fotoğraf/video dosyaları ile güvenlik için gerekli sınırlı cihaz ve işlem kayıtları işlenebilir. Bildirimleri açtığınızda cihazınıza ait bildirim jetonu saklanır; bildirimleri kapattığınızda silinir. Uygulamayı nasıl kullandığınıza dair olay kayıtları (hangi ekranın açıldığı, davetin yayınlanması gibi) istatistik amacıyla toplanır. Kart veya web ödeme verisi işlenmez.' },
      { title: 'Amaç ve hukuki sebep', content: 'Veriler; hesabı ve davet hizmetini çalıştırmak, davet/RSVP bağlantılarını sunmak, kötüye kullanımı önlemek, destek taleplerini yanıtlamak ve yasal yükümlülükleri yerine getirmek için sözleşmenin ifası, meşru menfaat, hukuki yükümlülük veya gerektiğinde açık rıza temelinde işlenir.' },
      { title: 'Davetli ve medya verileri', content: 'Davet sahibi, davetli bilgilerini yalnızca etkinliği yönetmek amacıyla eklemelidir. Davetlilerin QR galerisine yüklediği içerik açık onayla alınır. Galeri bağlantısına sahip kişiler içeriği görebileceğinden bağlantı dikkatle paylaşılmalıdır.' },
      { title: 'Hizmet sağlayıcılar ve aktarım', content: 'Kimlik doğrulama, veritabanı ve özel dosya depolama için Supabase altyapısı kullanılabilir. Uygulama kullanım istatistikleri için Google Firebase Analytics kullanılır; bu kapsamda hesabınız e-posta veya adınızla değil, yalnızca takma bir hesap kimliğiyle ilişkilendirilir. Anlık bildirimler Expo bildirim servisi ve platformun kendi bildirim altyapısı (Apple APNs / Google FCM) üzerinden iletilir. Ödüllü reklamlar etkinleştirildiğinde reklam sağlayıcısı, yalnızca izinler ve platform kuralları kapsamında cihaz/reklam etkileşim verisi işleyebilir; uygulama kişiselleştirilmemiş reklam ister ve reklam kimliğinize (IDFA) erişmez. Zorunlu olmayan takip için gerekli kullanıcı tercihi alınır.' },
      { title: 'Saklama ve güvenlik', content: 'Veriler hizmet için gerekli süre boyunca; hesap silme talebinden sonra ise yasal yükümlülükler ve sınırlı yedek döngüleri saklı kalmak üzere silme sürecine alınır. Erişim yetkileri, satır düzeyi kurallar, özel depolama ve süreli bağlantılarla sınırlandırılır.' },
      { title: 'Haklarınız', content: `KVKK'nın 11. maddesi kapsamındaki bilgi alma, düzeltme, silme, aktarılan tarafları öğrenme ve itiraz haklarınızı kullanabilirsiniz. ${contact}` },
    ],
  },
  terms: {
    title: 'Kullanım Koşulları',
    lastUpdated: '4 Ağustos 2026',
    sections: [
      { title: 'Hizmetin kapsamı', content: 'Davetim; dijital davet tasarlama, bağlantıyla paylaşma, RSVP takibi ve isteğe bağlı QR medya galerisi özellikleri sunar. Özellikler bakım, güvenlik veya platform gereklilikleri nedeniyle değişebilir.' },
      { title: 'Hesap güvenliği', content: 'Doğru bilgi vermek, hesabınızı ve davet bağlantılarınızı korumak sizin sorumluluğunuzdadır. Yetkisiz erişim şüphesinde info@davetim.app adresine bildirim yapmalısınız.' },
      { title: 'İçerik ve lisans', content: 'Yüklediğiniz içerik üzerindeki haklar sizde kalır. İçeriği hizmeti sunmak için barındırmamıza ve davet bağlantınız üzerinden göstermemize sınırlı izin verirsiniz. Yüklediğiniz içeriği kullanma ve paylaşma hakkına sahip olmalısınız.' },
      { title: 'Yasaklı kullanım', content: 'Yasadışı, yanıltıcı, taciz edici, zararlı veya üçüncü kişilerin fikrî mülkiyet ve kişilik haklarını ihlal eden içerik; yetkisiz erişim, tersine mühendislik, spam ve otomatik kötüye kullanım yasaktır.' },
      { title: 'Reklamla açılan haklar', content: 'Ödüllü reklamlar zorunlu değildir ve yalnızca açıkça seçilen tekil bir kullanım hakkı sağlayabilir. Reklam izlenmediğinde temel davet oluşturma, paylaşma ve RSVP işlevleri engellenmez. Bu sürümde web ödeme sistemi veya uygulama içi satın alma bulunmaz.' },
      { title: 'Sorumluluk ve erişilebilirlik', content: 'Hizmetin kesintisiz olacağı garanti edilmez. Planlı bakım, üçüncü taraf servisleri veya mücbir sebepler kesintiye yol açabilir. Mevzuatın izin verdiği ölçüde dolaylı kayıplardan sorumluluk kabul edilmez.' },
      { title: 'İletişim ve değişiklikler', content: `Önemli koşul değişiklikleri yürürlüğe girmeden önce uygun kanallardan duyurulur. ${contact}` },
    ],
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    lastUpdated: '4 Ağustos 2026',
    sections: [
      { title: 'Veri sorumlusu ve kapsam', content: '6698 sayılı Kanun uyarınca veri sorumlusu Diligent Computer Systems & Digital Commerce - Dilek Aydemir’dir. Bu metin hesap sahipleri, davetliler ve QR galerisi katılımcıları için temel işleme faaliyetlerini açıklar.' },
      { title: 'Toplama yöntemleri', content: 'Veriler mobil uygulama, herkese açık davet/RSVP bağlantıları, QR galerisi yüklemeleri, destek iletişimi, uygulama kullanım istatistikleri ve hizmet güvenliği kayıtları üzerinden otomatik veya kullanıcı tarafından sağlanan yöntemlerle toplanır.' },
      { title: 'İşleme amaçları', content: 'Hesap ve oturum yönetimi, dijital davet hizmetinin sunulması, RSVP ve galeri işlemleri, davetli yanıtları hakkında bildirim gönderilmesi, hizmetin iyileştirilmesine yönelik kullanım istatistikleri, güvenlik/kötüye kullanım önleme, destek ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla işlenir.' },
      { title: 'Aktarım', content: 'Veriler hizmetin sunulması için altyapı sağlayıcılarına, açık rızaya dayalı özelliklerde ilgili sağlayıcılara ve hukuken zorunlu olduğunda yetkili mercilere aktarılabilir. Yurt dışı aktarımında yürürlükteki KVKK şartları uygulanır.' },
      { title: 'Başvuru', content: `KVKK'nın 11. maddesindeki haklarınıza ilişkin başvurunuzu kimliğinizi doğrulayacak bilgilerle iletebilirsiniz. ${contact}` },
    ],
  },
};
