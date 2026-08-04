import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Loader2, X, Sparkles, Filter, Heart } from 'lucide-react';
import { templateService, type Template, type TemplateCategory } from '../services/templateService';
import { useAuth } from '../store/authStore';
import { useSubscription } from '../hooks/useSubscription';
import { SEOHead, CanonicalURL } from '../components/SEO/SEOHead';
import TemplateCard from '../components/Templates/TemplateCard';
import UpgradeModal from '../components/Subscription/UpgradeModal';
import { TemplatesPageSkeleton } from '../components/Skeleton/Skeleton';
import toast from 'react-hot-toast';

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const subscription = useSubscription();

  // State
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTemplateTier, setUpgradeTemplateTier] = useState<'pro' | 'premium'>('pro');

  const selectedCategory = searchParams.get('category') || 'all';

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load categories and templates
  useEffect(() => {
    loadData();
  }, [selectedCategory, debouncedSearchTerm]);

  const loadData = async (overrideSearch?: string, overrideCategory?: string) => {
    setIsLoading(true);

    try {
      // Load categories
      const categoriesData = await templateService.getCategories();
      setCategories(categoriesData);

      // Load templates with filters
      const filters: any = {};

      const categoryToUse = overrideCategory !== undefined ? overrideCategory : selectedCategory;
      const searchToUse = overrideSearch !== undefined ? overrideSearch : debouncedSearchTerm;

      // 'favorites' özel bir kategori - API'ye gönderme, tüm şablonları getir ve lokal filtrele
      if (categoryToUse !== 'all' && categoryToUse !== 'favorites') {
        filters.category = categoryToUse;
      }

      if (searchToUse) {
        filters.search = searchToUse;
      }

      const templatesData = await templateService.getTemplates(filters);
      setTemplates(templatesData);

      // Load saved templates if authenticated
      if (isAuthenticated) {
        try {
          const userTemplates = await templateService.getUserTemplates();
          const savedIds = new Set(userTemplates.map(ut => ut.template_id));
          setSavedTemplates(savedIds);
        } catch (error) {
          // user_templates tablosu henüz oluşturulmamış olabilir
          console.warn('Could not load saved templates:', error);
          setSavedTemplates(new Set());
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categorySlug: string) => {
    if (categorySlug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categorySlug);
    }
    setSearchParams(searchParams);
  };

  const handleSaveTemplate = async (templateId: string) => {
    if (!isAuthenticated) {
      toast.error('Şablon kaydetmek için giriş yapmalısınız');
      navigate('/auth');
      return;
    }

    const isSaved = savedTemplates.has(templateId);

    if (isSaved) {
      const success = await templateService.unsaveTemplate(templateId);
      if (success) {
        setSavedTemplates(prev => {
          const next = new Set(prev);
          next.delete(templateId);
          return next;
        });
      }
    } else {
      const success = await templateService.saveTemplate(templateId);
      if (success) {
        setSavedTemplates(prev => new Set(prev).add(templateId));
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    loadData('', selectedCategory);
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    handleCategoryChange('all');
    loadData('', 'all');
  };

  const handleUpgradeNeeded = (templateTier: 'pro' | 'premium') => {
    setUpgradeTemplateTier(templateTier);
    setShowUpgradeModal(true);
  };

  // Calculate search state
  const isSearching = searchTerm !== debouncedSearchTerm;
  const hasActiveSearch = debouncedSearchTerm.trim().length > 0;
  const hasActiveFilters = selectedCategory !== 'all' || hasActiveSearch;

  // Şablonları göster - Favoriler seçiliyse sadece kaydedilen şablonları göster
  const displayedTemplates = selectedCategory === 'favorites'
    ? templates.filter(t => savedTemplates.has(t.id))
    : templates;

  // Show skeleton while loading
  if (isLoading) {
    return <TemplatesPageSkeleton />;
  }

  return (
    <>
      <SEOHead
        title="Davetiye Şablonları - 100+ Hazır Tasarım | Davetim"
        description="Düğün, nişan, doğum günü ve özel günleriniz için 100+ profesyonel davetiye şablonu. Ücretsiz ve premium seçenekler. Hemen düzenlemeye başlayın!"
        keywords="davetiye şablonları, düğün davetiyesi şablonu, nişan davetiyesi, doğum günü davetiyesi, hazır davetiye tasarımları"
        url="https://davetim.app/templates"
      />
      <CanonicalURL url="https://davetim.app/templates" />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - Compact */}
          <div className="text-center mb-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-primary-200/50 mb-4">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-semibold text-gray-700">100+ Profesyonel Şablon</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Davetiye Şablonları
            </h1>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Özel günleriniz için profesyonel tasarlanmış şablonlar
            </p>
          </div>

          {/* Search & Filter - Modern & Compact */}
          <div className="mb-6 animate-fade-in">
            {/* Search Bar - Compact */}
            <div className="relative max-w-2xl mx-auto mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Ara... (Düğün, doğum günü, nişan)"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`w-full pl-11 pr-11 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm ${isSearching
                    ? 'border-primary-300 bg-primary-50/50 shadow-md'
                    : 'border-gray-300 bg-white hover:border-gray-400 focus:shadow-md'
                    }`}
                />

                {/* Right side icons */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {isSearching && (
                    <Loader2 className="text-primary-500 h-4 w-4 animate-spin" />
                  )}
                  {searchTerm && !isSearching && (
                    <button
                      onClick={handleClearSearch}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                      title="Temizle"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Pills - Compact & Scrollable */}
            <div className="relative">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                {/* Favorilerim - Sadece giriş yapmış kullanıcılar için */}
                {isAuthenticated && (
                  <button
                    onClick={() => handleCategoryChange('favorites')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${selectedCategory === 'favorites'
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-red-50 border border-gray-300 hover:border-red-300'
                      }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${selectedCategory === 'favorites' ? 'fill-current' : ''}`} />
                    Favorilerim
                    {savedTemplates.size > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedCategory === 'favorites' ? 'bg-white/20' : 'bg-red-100 text-red-600'
                        }`}>
                        {savedTemplates.size}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-primary-300'
                    }`}
                >
                  Tümü
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.slug)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category.slug
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-primary-300'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count & Clear - Compact */}
          {!isSearching && templates.length > 0 && (
            <div className="mb-4 flex items-center justify-between animate-fade-in">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{templates.length}</span> şablon
                {hasActiveSearch && (
                  <span className="ml-1 text-primary-600 font-medium">
                    "{debouncedSearchTerm}"
                  </span>
                )}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                  Temizle
                </button>
              )}
            </div>
          )}

          {/* Templates Grid - Responsive */}
          {displayedTemplates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 animate-fade-in">
              {displayedTemplates.map((template, index) => (
                <div
                  key={template.id}
                  style={{ animationDelay: `${index * 30}ms` }}
                  className="animate-fade-in"
                >
                  <TemplateCard
                    template={template}
                    onSave={handleSaveTemplate}
                    isSaved={savedTemplates.has(template.id)}
                    onUpgradeNeeded={handleUpgradeNeeded}
                  />
                </div>
              ))}
            </div>
          )}

          {/* No Results - Modern */}
          {!isSearching && displayedTemplates.length === 0 && (
            <div className="bg-white rounded-2xl shadow-md p-8 sm:p-12 text-center animate-fade-in border border-gray-200">
              <div className="max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full mb-4">
                  <Search className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {hasActiveSearch ? 'Sonuç Bulunamadı' : 'Şablon Bulunamadı'}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {hasActiveSearch ? (
                    <>
                      "<span className="font-semibold text-gray-900">{debouncedSearchTerm}</span>" için sonuç yok
                    </>
                  ) : (
                    'Bu kategoride henüz şablon yok'
                  )}
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  {hasActiveFilters ? 'Farklı kelimeler veya kategoriler deneyin' : 'Yakında yeni şablonlar eklenecek'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAllFilters}
                      className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm"
                    >
                      Tüm Şablonlar
                    </button>
                  )}
                  {hasActiveSearch && !hasActiveFilters && (
                    <button
                      onClick={handleClearSearch}
                      className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm"
                    >
                      Aramayı Temizle
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CTA Section - Only for non-premium users */}
          {subscription.currentPlan !== 'premium' && (
            <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 mt-8 text-center border border-primary-200/50 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                <span className="text-xs font-semibold text-gray-700">Premium Özellik</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Özel Şablon İsteğiniz Var mı?
              </h2>
              <p className="text-sm text-gray-600 mb-4 max-w-xl mx-auto">
                Premium planla özel tasarım taleplerinde bulunun
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
              >
                Premium'a Yükselt
              </button>
            </div>
          )}

          {/* Premium User Section - Special message for premium users */}
          {subscription.currentPlan === 'premium' && (
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-6 sm:p-8 mt-8 text-center border border-purple-200/50 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full mb-3">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-xs font-semibold text-gray-700">Premium Üye</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Tüm Premium Şablonlara Erişiminiz Var! 🎉
              </h2>
              <p className="text-sm text-gray-600 mb-4 max-w-xl mx-auto">
                Özel tasarım talepleriniz için destek ekibimizle iletişime geçebilirsiniz
              </p>
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
              >
                Destek Talebi Oluştur
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="premium_templates"
        featureDescription={
          upgradeTemplateTier === 'premium'
            ? "Premium şablonlara erişmek için PREMIUM plana yükseltin!"
            : "PRO şablonlara erişmek için PRO plana yükseltin!"
        }
        currentPlan={subscription.currentPlan}
        recommendedPlan={upgradeTemplateTier === 'premium' ? 'premium' : 'pro'}
      />

      {/* Custom Scrollbar Hide */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default TemplatesPage;
