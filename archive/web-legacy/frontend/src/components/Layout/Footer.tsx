import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold">Davetim</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Türkiye'nin en hızlı davetiye platformu. 5 dakikada profesyonel davetiyeler oluşturun.
              Düğün, doğum günü, baby shower ve tüm özel anlarınız için.
            </p>
            <div className="flex space-x-4">
              <a href="mailto:info@davetim.app" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href="tel:+905359216894" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hızlı Erişim</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/templates" className="text-gray-400 hover:text-white transition-colors">
                  Şablonlar
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                  Fiyatlar
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bilgi Al</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/legal/gizlilik-politikasi" className="text-gray-400 hover:text-white transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/legal/kullanim-kosullari" className="text-gray-400 hover:text-white transition-colors">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link to="/legal/iptal-ve-iade-kosullari" className="text-gray-400 hover:text-white transition-colors">
                  İptal ve İade
                </Link>
              </li>
              <li>
                <Link to="/legal/kvkk-aydinlatma" className="text-gray-400 hover:text-white transition-colors">
                  KVKK Aydınlatma
                </Link>
              </li>
              <li>
                <Link to="/legal/ticari-elektronik-ileti" className="text-gray-400 hover:text-white transition-colors">
                  Ticari İleti Onayı
                </Link>
              </li>
              <li>
                <Link to="/legal/mesafeli-satis-sozlesmesi" className="text-gray-400 hover:text-white transition-colors">
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/bank_band_logo.png" 
              alt="Güvenli Ödeme - Desteklenen Banka ve Kartlar" 
              className="h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Davetim. Tüm hakları saklıdır.
            </div>
            <div className="flex items-center text-gray-400 text-sm">
              <span>Türkiye'de</span>
              <Heart className="h-4 w-4 text-red-500 mx-1" />
              <span>ile yapıldı</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
