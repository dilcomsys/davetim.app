import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar, Building } from 'lucide-react';
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  CANCELLATION_REFUND_POLICY,
  KVKK_CLARIFICATION,
  COMMERCIAL_ELECTRONIC_MESSAGE,
  DISTANCE_SALES_CONTRACT,
  LEGAL_DOCUMENTS,
  type LegalDocument,
} from '../legal';
import SEOHead, { CanonicalURL } from '../components/SEO/SEOHead';
import { pdfExportService } from '../services/pdfExportService';
import toast from 'react-hot-toast';

const LegalPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isDownloading, setIsDownloading] = useState(false);

  // Map slug to document
  const getDocument = (): LegalDocument | null => {
    switch (slug) {
      case 'gizlilik-politikasi':
        return PRIVACY_POLICY;
      case 'kullanim-kosullari':
        return TERMS_OF_SERVICE;
      case 'iptal-ve-iade-kosullari':
        return CANCELLATION_REFUND_POLICY;
      case 'kvkk-aydinlatma':
        return KVKK_CLARIFICATION;
      case 'ticari-elektronik-ileti':
        return COMMERCIAL_ELECTRONIC_MESSAGE;
      case 'mesafeli-satis-sozlesmesi':
        return DISTANCE_SALES_CONTRACT;
      default:
        return null;
    }
  };

  const document = getDocument();
  const documentInfo = LEGAL_DOCUMENTS.find((d) => d.slug === slug);

  if (!document || !documentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20 px-4">
        <div className="max-w-4xl mx-auto text-center py-20">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Belge Bulunamadı</h1>
          <p className="text-gray-600 mb-8">Aradığınız yasal belge bulunamadı.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!document || !documentInfo) return;

    setIsDownloading(true);
    const loadingToast = toast.loading('PDF oluşturuluyor...');

    try {
      const filename = `${documentInfo.slug}-${new Date().toISOString().split('T')[0]}.pdf`;
      await pdfExportService.exportLegalDocumentToPDF(document, filename);
      toast.success('PDF başarıyla indirildi!', { id: loadingToast });
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('PDF indirme başarısız oldu', { id: loadingToast });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <SEOHead
        title={`${document.title} | Davetim.app`}
        description={documentInfo.description}
        url={`https://davetim.app/legal/${slug}`}
      />
      <CanonicalURL url={`https://davetim.app/legal/${slug}`} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana Sayfaya Dön
            </Link>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{documentInfo.icon}</span>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {document.title}
                  </h1>
                </div>
                <p className="text-gray-600">{documentInfo.description}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
                  disabled={isDownloading}
                >
                  <FileText className="h-4 w-4" />
                  Yazdır
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                  {isDownloading ? 'İndiriliyor...' : 'PDF İndir'}
                </button>
              </div>
            </div>
          </div>

          {/* Document Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Son Güncelleme</p>
                  <p className="font-medium text-gray-900">{document.lastUpdated}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Yayınlayan</p>
                  <p className="font-medium text-gray-900">Diligent Computer Systems & Digital Commerce - Dilek Aydemir</p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 print:shadow-none print:border-0">
            <div className="prose prose-gray max-w-none">
              {document.sections.map((section) => (
                <div key={section.id} className="mb-8 last:mb-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {section.title}
                  </h2>
                  <div
                    className="text-gray-700 leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: section.content.replace(/\n\n/g, '</p><p class="mt-4">').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer Contact */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">📞 İletişim</h3>
            <p className="text-blue-800 text-sm mb-3">
              Bu belge ile ilgili sorularınız için bizimle iletişime geçebilirsiniz:
            </p>
            <div className="space-y-1 text-sm text-blue-900">
              <p>
                <strong>E-posta:</strong> info@davetim.app
              </p>
              <p>
                <strong>Telefon:</strong> +905359216894
              </p>
            </div>
          </div>

          {/* Other Legal Documents */}
          <div className="mt-12">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Diğer Yasal Belgeler</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LEGAL_DOCUMENTS.filter((d) => d.slug !== slug).map((doc) => (
                <Link
                  key={doc.id}
                  to={`/legal/${doc.slug}`}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{doc.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .prose {
            max-width: 100%;
          }
          button, nav, footer, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default LegalPage;

