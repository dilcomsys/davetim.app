import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock3,
  Globe2,
  Images,
  LayoutTemplate,
  Link2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

import './App.css'
import { LegalPage, type PageKey } from './LegalPage'
import { Seal } from './Seal'
import { AppStoreBadge, GooglePlayBadge } from './StoreBadges'

const appStoreUrl = import.meta.env.VITE_APP_STORE_URL as string | undefined
const playStoreUrl = import.meta.env.VITE_PLAY_STORE_URL as string | undefined
const legalPaths: Record<string, PageKey> = {
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/support': 'support',
  '/account-deletion': 'account-deletion',
}

const promises = [
  { icon: Globe2, text: 'Misafirler uygulama indirmez' },
  { icon: Link2, text: 'Paylaştığınız bağlantı değişmez' },
  { icon: CalendarCheck, text: 'Yanıtlar listenize anında düşer' },
]

const features = [
  {
    className: 'feature-card--templates',
    icon: LayoutTemplate,
    label: 'Tasarım',
    title: 'Hazır başlayın, size özel bitsin.',
    text: 'Nikâh, nişan, kına, doğum günü ve baby shower için hazırlanmış davetiyeleri yazı, renk ve fotoğraflarınızla kişiselleştirin.',
  },
  {
    className: 'feature-card--link',
    icon: Link2,
    label: 'Paylaşım',
    title: 'Tek bağlantı, hep güncel.',
    text: 'Saat ya da adres değiştiğinde yeniden mesaj göndermeyin. Davetliler aynı bağlantıda her zaman son hâli görür.',
  },
  {
    className: 'feature-card--rsvp',
    icon: Users,
    label: 'RSVP',
    title: 'Kim geliyor, artık belli.',
    text: 'Gelenleri, gelemeyenleri, yanıt beklediklerinizi ve misafir notlarını tek listede takip edin.',
  },
  {
    className: 'feature-card--gallery',
    icon: Images,
    label: 'QR galeri',
    title: 'Gecenin fotoğrafları bir arada.',
    text: 'Masadaki QR kodunu okutan misafirler fotoğraflarını doğrudan özel galerinize eklesin.',
  },
]

const steps = [
  {
    title: 'Davetiyenizi oluşturun',
    text: 'Tasarımınızı seçin, metinleri düzenleyin ve dilerseniz kendi fotoğrafınızı ekleyin.',
  },
  {
    title: 'Davetli listenizi ekleyin',
    text: 'Kişileri tek tek kaydedin ya da elinizdeki listeyi CSV olarak içe aktarın.',
  },
  {
    title: 'Paylaşın, gerisini izleyin',
    text: 'Kişiye özel bağlantıları gönderin; yanıtlar geldikçe listeniz kendiliğinden güncellensin.',
  },
]

const faq = [
  {
    question: 'Misafirlerimin uygulamayı indirmesi gerekiyor mu?',
    answer:
      'Hayır. Davetiye ve katılım formu doğrudan tarayıcıda açılır. Uygulama yalnızca davetiyeyi hazırlayan kişi içindir.',
  },
  {
    question: 'Davetiyeyi gönderdikten sonra değiştirebilir miyim?',
    answer:
      'Evet. Saat, adres ya da metin değişirse düzenleyip kaydetmeniz yeterli. Paylaştığınız bağlantı aynı kalır.',
  },
  {
    question: 'Katılım yanıtlarını nasıl görüyorum?',
    answer:
      'Her davetlinin kendine özel bir bağlantısı olur. Yanıt verdiğinde listedeki durumu ve varsa notu anında güncellenir.',
  },
  {
    question: 'Verilerimi silebilir miyim?',
    answer:
      'Evet. Uygulamadan verilerinizi dışa aktarabilir, hesabınızın ve ilişkili verilerinizin silinmesini talep edebilirsiniz.',
  },
]

/* ─── Shared animation variants ─── */
const EASE = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
}

const staggerContainer: Variants = {
  hidden: {},
  shown: {
    transition: {
      delayChildren: 0.06,
      staggerChildren: 0.1,
    },
  },
}

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
}

const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  shown: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: EASE },
  },
}

const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 32, rotate: 4 },
  shown: {
    opacity: 1,
    x: 0,
    rotate: 1.2,
    transition: { duration: 0.7, ease: EASE },
  },
}

const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 28 },
  shown: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
}

const VP_ONCE = { once: true, amount: 0.15 } as const

function App() {
  const reduceMotion = useReducedMotion()
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'
  const legalPage = legalPaths[pathname]
  if (legalPage) return <LegalPage pageKey={legalPage} />

  const heroCopy: Variants = {
    hidden: { opacity: 0, y: 18 },
    shown: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.12,
        staggerChildren: 0.08,
        duration: 0.55,
        ease: EASE,
      },
    },
  }
  const heroLine: Variants = {
    hidden: { opacity: 0, y: 12 },
    shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  }
  const initial = reduceMotion ? false : 'hidden'

  return (
    <div className="site-shell">
      <a className="skip-link" href="#ana-icerik">Ana içeriğe geç</a>

      <header className="site-header-wrap">
        <div className="site-header">
          <a aria-label="Davetim ana sayfa" className="brand" href="#top">
            <Seal size={31} />
            <span>davetim</span>
          </a>
          <nav aria-label="Ana menü" className="nav-links">
            <a href="#ozellikler">Özellikler</a>
            <a href="#deneyim">Misafir deneyimi</a>
            <a href="#nasil">Nasıl çalışır?</a>
            <a href="#sorular">Sorular</a>
          </nav>
          <a className="nav-cta" href="#indir">
            Uygulamayı alın <ArrowRight aria-hidden="true" size={16} />
          </a>
        </div>
      </header>

      <main id="ana-icerik" tabIndex={-1}>
        {/* ─── HERO ─── */}
        <section className="hero" id="top">
          <div aria-hidden="true" className="hero-motif hero-motif--one" />
          <div aria-hidden="true" className="hero-motif hero-motif--two" />

          <motion.div className="hero-copy" animate="shown" initial={initial} variants={heroCopy}>
            <motion.p className="engraved" variants={heroLine}>Davetim · Mobil davet asistanı</motion.p>
            <motion.h1 variants={heroLine}>
              Davetiyeden<br />
              davetli listesine,<br />
              <em>hepsi bir yerde.</em>
            </motion.h1>
            <motion.p className="hero-lede" variants={heroLine}>
              Özenli bir dijital davetiye hazırlayın, tek bağlantıyla paylaşın ve kimin geleceğini telefonunuzdan takip edin.
            </motion.p>
            <motion.div className="hero-actions" variants={heroLine}>
              <div className="store-badges">
                <AppStoreBadge href={appStoreUrl} pendingLabel="App Store · çok yakında" />
                <GooglePlayBadge href={playStoreUrl} pendingLabel="Google Play · çok yakında" />
              </div>
              <a className="text-link" href="#deneyim">
                Nasıl çalıştığını görün <ChevronRight aria-hidden="true" size={17} />
              </a>
            </motion.div>
            <motion.p className="hero-note" variants={heroLine}>
              <Check aria-hidden="true" size={15} /> Ücretsiz başlayın · Kart bilgisi gerekmez
            </motion.p>
          </motion.div>

          <motion.div
            aria-label="Davetim uygulamasında dijital davetiye ve RSVP ekranı örneği"
            className="product-stage"
            role="img"
            animate={{ opacity: 1, y: 0, scale: 1 }}
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
            transition={{ delay: 0.28, duration: 0.68, ease: EASE }}>
            <div aria-hidden="true" className="paper-invite">
              <Seal size={49} />
              <span className="engraved engraved--tiny">12 Eylül 2026 · İstanbul</span>
              <strong>Ece <i>&amp;</i> Mert</strong>
              <span className="paper-rule" />
              {/* No manual line break: the forced line ran wider than the
                  card and spilled past its edge under the phone. */}
              <small>Bu güzel günümüzde sizi de aramızda görmek isteriz.</small>
            </div>

            <div aria-hidden="true" className="phone">
              <div className="phone-topbar"><span>9:41</span><span className="phone-island" /><span>•••</span></div>
              <div className="phone-screen">
                <div className="mini-header">
                  <div><small>Davet detayları</small><strong>Ece &amp; Mert</strong></div>
                  <span className="mini-badge">Yayında</span>
                </div>
                <div className="mini-card">
                  <span className="engraved engraved--tiny">12 Eylül · 19.30</span>
                  <strong>Nikâh<br />Töreni</strong>
                  <span className="mini-rule" />
                  <small>Beykoz Kasrı, İstanbul</small>
                </div>
                <div className="mini-section-label"><span>Katılım durumu</span><span>34 davetli</span></div>
                <div className="mini-stats">
                  <div><strong>24</strong><span>Geliyor</span></div>
                  <div><strong>7</strong><span>Bekliyor</span></div>
                  <div><strong>3</strong><span>Gelemiyor</span></div>
                </div>
                <div className="mini-row"><CalendarCheck size={15} /> Selin katılacağını bildirdi <span>Şimdi</span></div>
              </div>
            </div>

            <div aria-hidden="true" className="response-toast">
              <span><Check size={15} /></span>
              <div><strong>Yeni yanıt</strong><small>Selin Aydın · 2 kişi</small></div>
            </div>
          </motion.div>
        </section>

        {/* ─── PROMISE STRIP ─── */}
        <motion.section
          aria-label="Davetim ürün güvenceleri"
          className="promise-strip"
          initial={initial}
          variants={staggerContainer}
          viewport={VP_ONCE}
          whileInView="shown">
          {promises.map(({ icon: Icon, text }) => (
            <motion.div key={text} variants={staggerItem}>
              <Icon aria-hidden="true" size={19} strokeWidth={1.7} /><span>{text}</span>
            </motion.div>
          ))}
        </motion.section>

        {/* ─── FEATURES ─── */}
        <section aria-labelledby="ozellikler-baslik" className="features" id="ozellikler">
          <motion.div
            className="section-head section-head--split"
            initial={initial}
            variants={fadeUp}
            viewport={VP_ONCE}
            whileInView="shown">
            <div>
              <p className="engraved">Davetin tüm akışı</p>
              <h2 id="ozellikler-baslik">Güzel görünür.<br />Daha da iyi çalışır.</h2>
            </div>
            <p>Davetiye hazırlamaktan son fotoğrafı toplamaya kadar dağınık işleri tek, sakin bir akışta birleştirin.</p>
          </motion.div>
          <motion.div
            className="feature-grid"
            initial={initial}
            variants={staggerContainer}
            viewport={VP_ONCE}
            whileInView="shown">
            {features.map(({ className, icon: Icon, label, text, title }) => (
              <motion.article className={`feature-card ${className}`} key={title} variants={staggerItem}>
                <div className="feature-card-top">
                  <span className="feature-icon"><Icon aria-hidden="true" size={21} strokeWidth={1.7} /></span>
                  <span className="feature-label">{label}</span>
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* ─── GUEST EXPERIENCE ─── */}
        <motion.section
          aria-labelledby="deneyim-baslik"
          className="guest-experience"
          id="deneyim"
          initial={initial}
          variants={staggerContainer}
          viewport={VP_ONCE}
          whileInView="shown">
          <motion.div className="guest-copy" variants={slideFromLeft}>
            <p className="engraved engraved--light">Misafir deneyimi</p>
            <h2 id="deneyim-baslik">Onlar için de tek dokunuş kadar kolay.</h2>
            <p>Davetliniz bağlantıyı açar, davetin güncel ayrıntılarını görür ve katılım durumunu bildirir. Üyelik ya da uygulama indirme adımı yoktur.</p>
            <ul className="check-list">
              <li><Check aria-hidden="true" size={16} /> Her telefonda tarayıcıdan açılır</li>
              <li><Check aria-hidden="true" size={16} /> Kişiye özel ve güvenli bağlantı</li>
              <li><Check aria-hidden="true" size={16} /> Yanıt ve not tek ekranda tamamlanır</li>
            </ul>
          </motion.div>

          <motion.div aria-hidden="true" className="guest-browser" variants={slideFromRight}>
            <div className="browser-bar"><span /><span /><span /><div>davetim.app/i/ece-mert</div></div>
            <div className="browser-content">
              <div className="browser-invite">
                <Seal size={42} />
                <span className="engraved engraved--tiny">Ece &amp; Mert</span>
                <strong>12 Eylül Cumartesi<br />19.30</strong>
                <small>Beykoz Kasrı · İstanbul</small>
              </div>
              <div className="rsvp-panel">
                <span className="rsvp-kicker">Katılım bildirimi</span>
                <strong>Aramızda olacak mısınız?</strong>
                <div className="rsvp-options"><span className="selected"><Check size={14} /> Katılacağım</span><span>Katılamayacağım</span></div>
                <div className="rsvp-note">2 kişi · "Büyük bir mutlulukla!"</div>
                <span className="rsvp-button">Yanıtı gönder</span>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ─── STEPS ─── */}
        <section aria-labelledby="nasil-baslik" className="steps" id="nasil">
          <div className="steps-inner">
            <motion.div
              className="section-head section-head--left"
              initial={initial}
              variants={fadeUp}
              viewport={VP_ONCE}
              whileInView="shown">
              <p className="engraved">Nasıl çalışır?</p>
              <h2 id="nasil-baslik">Üç adım.<br />Sonrası kendiliğinden.</h2>
              <p className="steps-lede">Davetiyenizi bir öğle arasında hazırlayın. Geri kalan takibi Davetim üstlensin.</p>
            </motion.div>
            <motion.ol
              className="steps-list"
              initial={initial}
              variants={staggerContainer}
              viewport={VP_ONCE}
              whileInView="shown">
              {steps.map(({ text, title }) => (
                <motion.li key={title} variants={staggerItem}>
                  <div><h3>{title}</h3><p>{text}</p></div>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>

        {/* ─── DOWNLOAD ─── */}
        <section className="download" id="indir">
          <motion.div
            className="download-card"
            initial={initial}
            variants={scaleUp}
            viewport={VP_ONCE}
            whileInView="shown">
            <div aria-hidden="true" className="download-decoration"><Seal size={190} tone="light" /></div>
            <div className="download-icon"><Sparkles aria-hidden="true" size={21} /></div>
            <p className="engraved engraved--light">Davetiniz hazır olduğunda</p>
            <h2>İlk davetiyenizi bu hafta sonu gönderin.</h2>
            <p>iOS ve Android uygulamaları çok yakında. Mağaza sayfaları açıldığında rozetler doğrudan indirme bağlantısına dönüşecek.</p>
            <motion.div
              className="store-badges store-badges--dark"
              initial={initial}
              variants={staggerContainer}
              viewport={VP_ONCE}
              whileInView="shown">
              <motion.div variants={staggerItem}>
                <AppStoreBadge href={appStoreUrl} pendingLabel="App Store · çok yakında" />
              </motion.div>
              <motion.div variants={staggerItem}>
                <GooglePlayBadge href={playStoreUrl} pendingLabel="Google Play · çok yakında" />
              </motion.div>
            </motion.div>
            <span className="download-trust"><ShieldCheck aria-hidden="true" size={16} /> Temel davet ve RSVP akışı ücretsizdir</span>
          </motion.div>
        </section>

        {/* ─── FAQ ─── */}
        <section aria-labelledby="sorular-baslik" className="faq" id="sorular">
          <motion.div
            className="section-head section-head--left"
            initial={initial}
            variants={fadeUp}
            viewport={VP_ONCE}
            whileInView="shown">
            <p className="engraved">Merak edilenler</p>
            <h2 id="sorular-baslik">Kısa ve net yanıtlar.</h2>
          </motion.div>
          <motion.div
            className="faq-list"
            initial={initial}
            variants={staggerContainer}
            viewport={VP_ONCE}
            whileInView="shown">
            {faq.map(({ answer, question }) => (
              <motion.details key={question} variants={staggerItem}>
                <summary><span>{question}</span><span className="faq-toggle"><ChevronRight aria-hidden="true" size={19} /></span></summary>
                <p>{answer}</p>
              </motion.details>
            ))}
          </motion.div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <motion.footer
        initial={initial}
        variants={fadeUp}
        viewport={VP_ONCE}
        whileInView="shown">
        <div className="footer-brand">
          <a aria-label="Davetim ana sayfa" className="brand brand--footer" href="#top"><Seal size={28} tone="light" /><span>davetim</span></a>
          <p>Davetiyeniz, davetlileriniz ve o güne ait tüm hatıralarınız tek yerde.</p>
        </div>
        <nav aria-label="Yasal ve destek bağlantıları" className="footer-links">
          <a href="/privacy">Gizlilik</a>
          <a href="/terms">Koşullar</a>
          <a href="/support">Destek</a>
          <a href="/account-deletion">Hesap silme</a>
        </nav>
        <div className="footer-meta"><span>© {new Date().getFullYear()} Davetim</span><span><Clock3 aria-hidden="true" size={14} /> İstanbul'da özenle geliştiriliyor</span></div>
      </motion.footer>
    </div>
  )
}

export default App
