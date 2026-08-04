import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportData {
  invitations: any[];
  guestStats: any;
  activities: any[];
}

interface ExportAnalyticsProps {
  data: ExportData;
}

export const ExportAnalytics: React.FC<ExportAnalyticsProps> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const { invitations } = data;

      // CSV header
      const headers = [
        'Davetiye Başlığı',
        'Durum',
        'Oluşturulma Tarihi',
        'Etkinlik Tarihi',
        'Lokasyon',
        'Görüntüleme',
        'Toplam Davetli',
        'Katılacak',
        'Katılmayacak',
      ];

      // CSV rows
      const rows = invitations.map((inv: any) => [
        inv.title || '',
        inv.status || '',
        new Date(inv.created_at).toLocaleDateString('tr-TR'),
        inv.event_date ? new Date(inv.event_date).toLocaleDateString('tr-TR') : '',
        inv.location || '',
        inv.view_count || 0,
        inv.total_guests || 0,
        inv.attending_guests || 0,
        inv.not_attending_guests || 0,
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `davetim-analytics-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV dosyası indirildi!');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('Dışa aktarma sırasında bir hata oluştu');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      // For PDF export, we'll create a simple HTML report and open it in a new window
      // User can then use browser's "Print to PDF" functionality
      const { invitations, guestStats } = data;

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <title>Davetim Analytics Raporu</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              max-width: 1200px;
              margin: 0 auto;
            }
            h1 {
              color: #6366f1;
              border-bottom: 3px solid #6366f1;
              padding-bottom: 10px;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin: 30px 0;
            }
            .stat-card {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #6366f1;
            }
            .stat-card h3 {
              margin: 0;
              color: #6b7280;
              font-size: 14px;
            }
            .stat-card p {
              margin: 5px 0 0 0;
              font-size: 28px;
              font-weight: bold;
              color: #111827;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 30px;
            }
            th, td {
              text-align: left;
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            th {
              background: #f3f4f6;
              font-weight: 600;
              color: #374151;
            }
            tr:hover {
              background: #f9fafb;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>📊 Davetim Analytics Raporu</h1>
          <p style="color: #6b7280;">Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>

          <div class="summary">
            <div class="stat-card">
              <h3>Toplam Davetiye</h3>
              <p>${invitations.length}</p>
            </div>
            <div class="stat-card">
              <h3>Toplam Görüntüleme</h3>
              <p>${invitations.reduce((sum: number, inv: any) => sum + (inv.view_count || 0), 0)}</p>
            </div>
            <div class="stat-card">
              <h3>Toplam Davetli</h3>
              <p>${Object.values(guestStats).reduce((sum: number, stats: any) => sum + (stats.total || 0), 0)}</p>
            </div>
            <div class="stat-card">
              <h3>Katılacak</h3>
              <p>${Object.values(guestStats).reduce((sum: number, stats: any) => sum + (stats.total_attending || 0), 0)}</p>
            </div>
          </div>

          <h2>Davetiyeler</h2>
          <table>
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th>Görüntüleme</th>
                <th>Davetli</th>
              </tr>
            </thead>
            <tbody>
              ${invitations.map((inv: any) => `
                <tr>
                  <td><strong>${inv.title || 'Başlıksız'}</strong></td>
                  <td>${inv.status === 'published' ? '✓ Yayında' : '📝 Taslak'}</td>
                  <td>${inv.event_date ? new Date(inv.event_date).toLocaleDateString('tr-TR') : '-'}</td>
                  <td>${inv.view_count || 0}</td>
                  <td>${guestStats[inv.id]?.total || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Bu rapor <strong>Davetim</strong> tarafından otomatik olarak oluşturulmuştur.</p>
            <p>davetim.app</p>
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="
              background: #6366f1;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
            ">
              🖨️ Yazdır / PDF Olarak Kaydet
            </button>
          </div>
        </body>
        </html>
      `;

      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        toast.success('Rapor yeni pencerede açıldı. Yazdırma menüsünden PDF olarak kaydedebilirsiniz.');
      } else {
        toast.error('Pop-up engellendi. Lütfen tarayıcınızın pop-up ayarlarını kontrol edin.');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Dışa aktarma sırasında bir hata oluştu');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Raporları Dışa Aktar</h3>
      
      <p className="text-sm text-gray-600 mb-6">
        İstatistiklerinizi ve davetiye verilerinizi dışa aktarın
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CSV Export */}
        <button
          onClick={exportToCSV}
          disabled={isExporting || !data.invitations || data.invitations.length === 0}
          className="flex items-center justify-center gap-3 p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">Excel / CSV</p>
            <p className="text-xs text-gray-600">Detaylı veri tablosu</p>
          </div>
          {isExporting && <Loader2 className="h-4 w-4 animate-spin text-green-600" />}
        </button>

        {/* PDF Export */}
        <button
          onClick={exportToPDF}
          disabled={isExporting || !data.invitations || data.invitations.length === 0}
          className="flex items-center justify-center gap-3 p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-200 transition-colors">
            <FileText className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">PDF Rapor</p>
            <p className="text-xs text-gray-600">Görsel özet raporu</p>
          </div>
          {isExporting && <Loader2 className="h-4 w-4 animate-spin text-red-600" />}
        </button>
      </div>

      {(!data.invitations || data.invitations.length === 0) && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ Dışa aktarılacak veri yok. En az bir davetiye oluşturun.
          </p>
        </div>
      )}
    </div>
  );
};

