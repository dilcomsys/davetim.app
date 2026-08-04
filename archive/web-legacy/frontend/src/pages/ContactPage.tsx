import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../components/SEO/SEOHead';
import toast from 'react-hot-toast';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactInfo = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: 'E-posta',
      value: 'info@davetim.app',
      link: 'mailto:info@davetim.app',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <Phone className="h-5 w-5" />,
      title: 'Telefon',
      value: '+90 535 921 68 94',
      link: 'tel:+905359216894',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Çalışma Saatleri',
      value: 'Hafta içi 09:00 - 18:00',
      link: null,
      color: 'from-purple-500 to-purple-600'
    },
  ];

  const faqItems = [
    {
      question: 'Davetiye oluşturmak ne kadar sürer?',
      answer: 'Ortalama 5 dakika içinde profesyonel bir davetiye oluşturabilirsiniz.'
    },
    {
      question: 'Ücretsiz plan ile ne yapabilirim?',
      answer: 'FREE plan ile 1 adet davetiye oluşturabilir, 50 misafir ekleyebilir ve PDF/PNG olarak indirebilirsiniz.'
    },
    {
      question: 'Ödeme güvenli mi?',
      answer: 'Evet, tüm ödemeler SSL şifreleme ve güvenli ödeme altyapısı (İyzico) ile korunmaktadır.'
    },
    {
      question: 'İptal ve iade nasıl yapılır?',
      answer: '3 gün içinde iptal ederseniz tam iade alırsınız. Hesap ayarlarından kolayca iptal edebilirsiniz.'
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send via Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Show success message
      setIsSubmitted(true);
      toast.success('Mesajınız başarıyla gönderildi!');
      
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
      
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="İletişim | Davetim.app"
        description="Davetim.app ile iletişime geçin. Sorularınız için bize ulaşın. E-posta: info@davetim.app, Telefon: +90 535 921 68 94"
        keywords="iletişim, destek, yardım, davetim, müşteri hizmetleri"
        url="https://davetim.app/contact"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700">
          {/* Decorative Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <MessageCircle className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">7/24 Destek</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Size Nasıl
                <br />
                <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                  Yardımcı Olabiliriz?
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                Sorularınız, önerileriniz veya destek talepleriniz için bizimle iletişime geçin. 
                En kısa sürede size dönüş yapacağız.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} text-white mb-4`}>
                  {info.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  {info.title}
                </h3>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-lg font-bold text-gray-900">
                    {info.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left - Contact Form */}
            <div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Mesaj Gönderin
                  </h2>
                  <p className="text-gray-600">
                    Formu doldurun, size en kısa sürede dönüş yapalım
                  </p>
                </div>

                {isSubmitted && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900 mb-1">
                        Mesajınız Gönderildi!
                      </p>
                      <p className="text-sm text-green-700">
                        En kısa sürede size dönüş yapacağız.
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="Adınız ve soyadınız"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="ornek@email.com"
                      required
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Konu
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="Mesajınızın konusu"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Mesajınız <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                      placeholder="Mesajınızı buraya yazın..."
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Gönderiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Mesaj Gönder</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Mesajınızı göndererek{' '}
                    <Link to="/legal/gizlilik-politikasi" className="text-primary-600 hover:underline">
                      Gizlilik Politikası
                    </Link>
                    'nı kabul etmiş olursunuz.
                  </p>
                </form>
              </div>
            </div>

            {/* Right - FAQ */}
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Sık Sorulan Sorular
                </h2>
                <p className="text-gray-600">
                  Aradığınız cevap burada olabilir
                </p>
              </div>

              <div className="space-y-4">
                {faqItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:border-primary-300 transition-all"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {item.question}
                    </h3>
                    <p className="text-gray-600">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>

              {/* Additional Help */}
              <div className="mt-8 bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-6 border border-primary-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Daha Fazla Yardım mı Gerekiyor?
                </h3>
                <p className="text-gray-600 mb-4">
                  Detaylı bilgi için yardım merkezimizi ziyaret edebilir veya doğrudan bizimle iletişime geçebilirsiniz.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/legal/kullanim-kosullari"
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary-300 transition-all text-center text-sm"
                  >
                    Kullanım Koşulları
                  </Link>
                  <Link
                    to="/legal/iptal-ve-iade-kosullari"
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-primary-300 transition-all text-center text-sm"
                  >
                    İptal ve İade
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Hemen Başlamaya Hazır mısınız?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              5 dakikada profesyonel davetiyeler oluşturun
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/templates"
                className="px-8 py-3 bg-white text-primary-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Ücretsiz Başla
              </Link>
              <Link
                to="/about"
                className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                Hakkımızda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;

