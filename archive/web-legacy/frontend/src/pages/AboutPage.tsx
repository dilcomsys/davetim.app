import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Users, Zap, Shield, Award, Target } from 'lucide-react';
import { SEOHead } from '../components/SEO/SEOHead';

const AboutPage: React.FC = () => {
  const stats = [
    { icon: <Users className="h-5 w-5" />, value: '10,000+', label: 'Mutlu Kullanıcı' },
    { icon: <Sparkles className="h-5 w-5" />, value: '50,000+', label: 'Oluşturulan Davetiye' },
    { icon: <Heart className="h-5 w-5" />, value: '%99', label: 'Memnuniyet Oranı' },
    { icon: <Zap className="h-5 w-5" />, value: '5 Dk', label: 'Ortalama Oluşturma' },
  ];

  const values = [
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Kullanıcı Odaklı',
      description: 'Her özelliğimizi kullanıcı deneyimini ön planda tutarak tasarlıyoruz'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Güvenilir',
      description: 'Verileriniz SSL şifreleme ve KVKK uyumlu sistemlerle korunur'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Hızlı & Kolay',
      description: '5 dakikada profesyonel davetiyeler oluşturun, anında paylaşın'
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: 'Kaliteli',
      description: 'Profesyonel tasarımcılar tarafından hazırlanan premium şablonlar'
    },
  ];

  return (
    <>
      <SEOHead
        title="Hakkımızda | Davetim.app"
        description="Davetim.app, Türkiye'nin en hızlı ve kullanıcı dostu dijital davetiye platformudur. 5 dakikada profesyonel davetiyeler oluşturun."
        keywords="hakkımızda, davetim, dijital davetiye, online davetiye, davetiye platformu"
        url="https://davetim.app/about"
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
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">Türkiye'nin Dijital Davetiye Platformu</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Özel Anlarınızı
                <br />
                <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
                  Unutulmaz Kılıyoruz
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mb-8">
                Davetim.app, düğün, doğum günü, baby shower ve tüm özel anlarınız için 
                profesyonel dijital davetiyeler oluşturmanızı sağlayan modern bir platformdur.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/templates"
                  className="px-8 py-3 bg-white text-primary-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Hemen Başla
                </Link>
                <Link
                  to="/contact"
                  className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  İletişime Geç
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white mb-4 mx-auto">
                  {stat.icon}
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full mb-6">
                <Heart className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-semibold text-primary-700">Hikayemiz</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Neden Davetim.app?
              </h2>

              <div className="space-y-4 text-gray-600">
                <p>
                  Davetim.app, özel anlarınızı dijital dünyada en güzel şekilde paylaşmanız için 
                  tasarlanmış modern bir platformdur. Geleneksel davetiye süreçlerinin karmaşıklığını 
                  ortadan kaldırarak, herkesin kolayca profesyonel davetiyeler oluşturabilmesini sağlıyoruz.
                </p>

                <p>
                  Misyonumuz, teknolojinin gücünü kullanarak özel anlarınızı daha anlamlı ve 
                  erişilebilir kılmaktır. Her davetiye, bir hikaye anlatır ve biz bu hikayeleri 
                  en güzel şekilde anlatmanıza yardımcı oluyoruz.
                </p>

                <p>
                  Kullanıcı deneyimini ön planda tutarak, sürekli yenilikçi özellikler geliştiriyor 
                  ve platformumuzu daha da iyileştiriyoruz. QR kod ile fotoğraf paylaşımı, gelişmiş 
                  RSVP sistemi ve premium şablonlarımızla davetiyelerinizi bir üst seviyeye taşıyoruz.
                </p>
              </div>
            </div>

            {/* Right - Image/Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-purple-100 rounded-3xl p-8 sm:p-12">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="text-4xl mb-2">🎉</div>
                    <div className="text-sm font-semibold text-gray-900">Düğün</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="text-4xl mb-2">🎂</div>
                    <div className="text-sm font-semibold text-gray-900">Doğum Günü</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="text-4xl mb-2">👶</div>
                    <div className="text-sm font-semibold text-gray-900">Baby Shower</div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="text-4xl mb-2">🎊</div>
                    <div className="text-sm font-semibold text-gray-900">Kutlama</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 rounded-full mb-6">
                <Award className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-semibold text-primary-700">Değerlerimiz</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Neye İnanıyoruz?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Başarımızın arkasındaki temel değerler ve prensipler
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white mb-4 group-hover:scale-110 transition-transform">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Hemen Başlayın</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Özel Anlarınız İçin Hazır mısınız?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              5 dakikada profesyonel davetiyeler oluşturun ve sevdiklerinizle paylaşın
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/templates"
                className="px-8 py-3 bg-white text-primary-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Ücretsiz Başla
              </Link>
              <Link
                to="/pricing"
                className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                Planları İncele
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;

