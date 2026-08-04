import { ArrowLeft, Mail, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect } from 'react'

export type PageKey = 'privacy' | 'terms' | 'support' | 'account-deletion'
type Section = { title: string; content: string }

const pages: Record<PageKey, { title: string; description: string; icon: typeof ShieldCheck; sections: Section[] }> = {
  privacy: {
    title: 'Gizlilik Politikası', description: 'Davetim’in kişisel verileri nasıl işlediğini öğrenin.', icon: ShieldCheck,
    sections: [
      { title: 'İşlenen veriler', content: 'Hesap bilgileri, oluşturduğunuz davet ve RSVP kayıtları, seçerek yüklediğiniz medya ile hizmet güvenliği için gereken sınırlı işlem kayıtları işlenebilir. Kart veya web ödeme verisi işlenmez.' },
      { title: 'Kullanım amacı', content: 'Veriler hesabı ve davet hizmetini çalıştırmak, RSVP ve QR galerisini sunmak, kötüye kullanımı önlemek, destek sağlamak ve yasal yükümlülükleri yerine getirmek amacıyla işlenir.' },
      { title: 'Sağlayıcılar', content: 'Kimlik doğrulama, veritabanı ve özel dosya depolama için Supabase kullanılabilir. Ödüllü reklamlar etkinleştirildiğinde reklam sağlayıcısı yalnızca platform izinleri ve kullanıcı tercihleri kapsamında sınırlı etkileşim verisi işleyebilir.' },
      { title: 'Haklarınız', content: 'KVKK kapsamındaki bilgi alma, düzeltme, silme ve itiraz haklarınız için info@davetim.app adresine başvurabilirsiniz.' },
    ],
  },
  terms: {
    title: 'Kullanım Koşulları', description: 'Davetim hizmetinin kullanım esasları.', icon: ShieldCheck,
    sections: [
      { title: 'Hizmet', content: 'Davetim; dijital davet tasarlama, paylaşma, RSVP takibi ve isteğe bağlı QR medya galerisi sunar. Hesap ve davet bağlantılarının güvenliğini korumak kullanıcı sorumluluğundadır.' },
      { title: 'İçerik', content: 'Yüklediğiniz içerik üzerindeki haklar sizde kalır. İçeriği hizmeti sunmak amacıyla barındırmamıza sınırlı izin verirsiniz ve paylaşma hakkına sahip olduğunuzu kabul edersiniz.' },
      { title: 'Reklam modeli', content: 'Ödüllü reklamlar zorunlu değildir; yalnızca kullanıcının açıkça seçtiği tekil bir ek hakkı sağlar. Temel davet ve RSVP akışı reklamsızdır. Bu sürümde web ödeme sistemi veya uygulama içi satın alma bulunmaz.' },
      { title: 'İletişim', content: 'Koşullarla ilgili sorularınızı info@davetim.app adresine iletebilirsiniz.' },
    ],
  },
  support: {
    title: 'Destek', description: 'Davetim ekibine ulaşın.', icon: Mail,
    sections: [
      { title: 'Nasıl yardımcı olabiliriz?', content: 'Hesap, davet, RSVP, QR galeri veya güvenlik sorunlarınızda cihaz türünüzü ve karşılaştığınız adımları belirterek bize yazın. Parola, oturum kodu veya özel anahtar göndermeyin.' },
      { title: 'E-posta', content: 'info@davetim.app — Destek talepleri çalışma saatleri içinde sırayla yanıtlanır.' },
    ],
  },
  'account-deletion': {
    title: 'Hesap Silme', description: 'Davetim hesabınızı ve ilişkili verileri silme talebi oluşturun.', icon: Trash2,
    sections: [
      { title: 'Uygulamadan silme', content: 'Davetim uygulamasında Profil → Hesap ve veriler → Hesabı sil bölümüne gidin. Onay alanına “HESABIMI SİL” yazarak talebi tamamlayın.' },
      { title: 'Uygulamaya erişemiyorsanız', content: 'Kayıtlı e-posta adresinizden info@davetim.app adresine “Hesap silme talebi” konulu e-posta gönderin. Güvenlik için hesabın size ait olduğu doğrulanır.' },
      { title: 'Silinen veriler', content: 'Hesap, davetler, davetli kayıtları ve bağlı medya silme sürecine alınır. Yasal olarak tutulması zorunlu kayıtlar ve sınırlı yedek döngüleri ilgili süre boyunca saklanabilir.' },
    ],
  },
}

export function LegalPage({ pageKey }: { pageKey: PageKey }) {
  const page = pages[pageKey]
  const Icon = page.icon
  useEffect(() => { document.title = `${page.title} · Davetim` }, [page.title])
  return <main className="legal-shell"><a className="legal-back" href="/"><ArrowLeft size={17} /> Ana sayfa</a><header className="legal-hero"><span className="legal-icon"><Icon size={28} /></span><p className="section-kicker">Davetim · 3 Ağustos 2026</p><h1>{page.title}</h1><p>{page.description}</p></header><div className="legal-sections">{page.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.content}</p></section>)}</div><a className="legal-contact" href="mailto:info@davetim.app">info@davetim.app adresine yazın <Mail size={17} /></a></main>
}
