import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Star, Sparkles, Zap, Heart, Shield, QrCode, Wand2 } from 'lucide-react';
import { SEOHead, JSONLDSchema, CanonicalURL, ResourceHints } from '../components/SEO/SEOHead';
import { templateService, type Template } from '../services/templateService';
import { getTemplateThumbnailUrl } from '../utils/templateImageUrl';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // State for templates
  const [featuredTemplates, setFeaturedTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Load featured templates
  useEffect(() => {
    loadFeaturedTemplates();
  }, []);

  const loadFeaturedTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      // Get 3 featured templates for homepage
      const templates = await templateService.getFeaturedTemplates(3);
      setFeaturedTemplates(templates);
    } catch (error) {
      console.error('Error loading featured templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Schema.org structured data
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Davetim',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '129',
      priceCurrency: 'TRY',
      offerCount: '3',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '10000',
    },
    description: 'Özel günleriniz için profesyonel dijital davetiyeler oluşturun. Hazır şablonlar, kolay düzenleme, RSVP takibi.',
  };

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "5 Dakikada Hazır",
      description: "Hızlı ve kolay davetiye oluşturma"
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "100+ Şablon",
      description: "Her özel anınız için tasarımlar"
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "RSVP Takibi",
      description: "Davetlilerinizi kolayca yönetin"
    },
    {
      icon: <QrCode className="h-5 w-5" />,
      title: "QR Medya",
      description: "QR kod ile fotoğraf paylaşımı"
    },
    {
      icon: <Wand2 className="h-5 w-5" />,
      title: "AI Tasarım",
      description: "Yapay zeka destekli öneriler"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Güvenli & Hızlı",
      description: "Verileriniz güvende, hizmet kesintisiz"
    }
  ];

  const stats = [
    { number: "10K+", label: "Mutlu Kullanıcı" },
    { number: "50K+", label: "Davetiye" },
    { number: "4.9", label: "Puan", icon: <Star className="h-4 w-4 text-yellow-400 fill-current inline" /> },
  ];

  const benefits = [
    "Ücretsiz başlayın, kredi kartı gerekmez",
    "100+ profesyonel şablon",
    "Sınırsız PDF indirme",
    "WhatsApp & sosyal medya paylaşımı",
    "RSVP takibi ve Excel export",
    "QR kod ile fotoğraf paylaşımı (Premium)",
    "AI destekli tasarım önerileri (Premium)",
    "7/24 destek"
  ];

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOHead
        title="Davetim - Profesyonel Dijital Davetiye Oluşturucu | Ücretsiz Dene"
        description="Özel günleriniz için profesyonel dijital davetiyeler oluşturun. 100+ hazır şablon, kolay düzenleme, RSVP takibi, WhatsApp paylaşım. Ücretsiz başlayın!"
        keywords="dijital davetiye, online davetiye, davetiye tasarımı, düğün davetiyesi, nişan davetiyesi, doğum günü davetiyesi, ücretsiz davetiye"
        url="https://davetim.app"
        type="website"
      />
      <JSONLDSchema data={schemaData} />
      <CanonicalURL url="https://davetim.app" />
      <ResourceHints />

      <div className="min-h-screen">
        {/* Hero Section - Modern & Compact */}
        <section className="relative bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 pt-16 pb-12 px-4 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl -z-10" />
          
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-primary-200/50">
                <Sparkles className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-semibold text-gray-700">Türkiye'nin En Hızlı Davetiye Platformu</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">5 Dakikada</span>
                <br />
                Profesyonel Davetiye
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Düğün, doğum günü, baby shower ve tüm özel anlarınız için hazır şablonlarla hemen davetiye oluşturun.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                <button
                  onClick={() => navigate('/templates')}
                  className="group px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                >
                  Hemen Başla
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link
                  to="/pricing"
                  className="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all border border-gray-200"
                >
                  Fiyatları İncele
                </Link>
              </div>

              {/* Stats - Compact */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                      {stat.number}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1 flex items-center justify-center gap-1">
                      {stat.label}
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Compact Grid */}
        <section className="py-12 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Neden Davetim?
              </h2>
              <p className="text-gray-600">
                Hızlı, kolay ve profesyonel
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="group p-5 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white mb-3 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Template Preview Section - Minimalist */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Profesyonel Şablonlar
              </h2>
              <p className="text-gray-600">
                Her özel anınız için özel tasarımlar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoadingTemplates ? (
                // Loading skeleton - Compact
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse border border-gray-200">
                    <div className="h-56 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : featuredTemplates.length > 0 ? (
                // Real templates - Modern cards
                featuredTemplates.map((template) => (
                  <Link
                    key={template.id}
                    to={`/editor?template=${template.id}`}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden border border-gray-200 hover:border-primary-300 transition-all"
                  >
                    <div className="h-56 relative overflow-hidden">
                      <img
                        src={getTemplateThumbnailUrl(template.thumbnail_url || template.default_image_url)}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      {template.tier !== 'free' && (
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                            template.tier === 'pro' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          }`}>
                            {template.tier === 'pro' ? 'PRO' : 'PREMIUM'}
                          </span>
                        </div>
                      )}
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-white font-semibold text-sm flex items-center gap-1">
                          Şablonu Kullan
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm">{template.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 font-medium">4.9</span>
                        </div>
                        <span className={`text-xs font-bold ${
                          template.tier === 'free' 
                            ? 'text-green-600' 
                            : template.tier === 'pro' 
                              ? 'text-blue-600' 
                              : 'text-purple-600'
                        }`}>
                          {template.tier === 'free' ? 'Ücretsiz' : template.tier === 'pro' ? 'PRO' : 'PREMIUM'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                // Fallback with static templates
                [
                  { name: 'Klasik Beyaz Düğün', tier: 'free', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=600&fit=crop&crop=center' },
                  { name: 'Lüks Altın Düğün', tier: 'pro', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&crop=center' },
                  { name: 'Saray Düğünü', tier: 'premium', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&crop=center' }
                ].map((template, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden border border-gray-200 hover:border-primary-300 transition-all"
                  >
                    <div className="h-56 relative overflow-hidden">
                      <img
                        src={template.image}
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      {template.tier !== 'free' && (
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                            template.tier === 'pro' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          }`}>
                            {template.tier === 'pro' ? 'PRO' : 'PREMIUM'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 text-sm">{template.name}</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-600 font-medium">4.9</span>
                        </div>
                        <span className={`text-xs font-bold ${
                          template.tier === 'free' 
                            ? 'text-green-600' 
                            : template.tier === 'pro' 
                              ? 'text-blue-600' 
                              : 'text-purple-600'
                        }`}>
                          {template.tier === 'free' ? 'Ücretsiz' : template.tier === 'pro' ? 'PRO' : 'PREMIUM'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/templates"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Tüm Şablonları Gör
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-gray-500 text-xs mt-2">
                100+ profesyonel şablon
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section - Compact List */}
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-8 border border-primary-200/50 shadow-sm">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Neler Dahil?
                </h2>
                <p className="text-sm text-gray-600">
                  Ücretsiz planla bile çok şey yapabilirsiniz
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/50">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Modern & Compact */}
        <section className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-purple-700 py-16 px-4 overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Ücretsiz Başlayın</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              İlk Davetiyenizi Oluşturun
            </h2>
            <p className="text-lg text-primary-100 mb-6 max-w-2xl mx-auto">
              Kredi kartı gerektirmez. 5 dakikada profesyonel davetiye.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => navigate('/templates')}
                className="group px-8 py-3.5 bg-white hover:bg-gray-50 text-primary-700 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
              >
                Hemen Başla
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                to="/pricing"
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 transition-all"
              >
                Planları İncele
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
