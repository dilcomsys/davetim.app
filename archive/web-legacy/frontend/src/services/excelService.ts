import * as XLSX from 'xlsx';
import { Guest } from './guestService';
import toast from 'react-hot-toast';

class ExcelService {
  /**
   * Export guests to Excel file
   */
  exportGuestsToExcel(guests: Guest[], invitationTitle: string): void {
    try {
      // Prepare data for Excel
      const excelData = guests.map((guest, index) => ({
        'Sıra': index + 1,
        'Ad Soyad': guest.full_name,
        'E-posta': guest.email || '-',
        'Telefon': guest.phone || '-',
        'RSVP Durumu': this.getRSVPStatusText(guest.rsvp_status),
        'Refakatçi': guest.companion_count || 0,
        'Toplam Kişi': 1 + (guest.companion_count || 0),
        'Diyet Kısıtlamaları': guest.dietary_restrictions || '-',
        'Notlar (Davetli)': guest.notes || '-',
        'RSVP Tarihi': guest.rsvp_responded_at 
          ? new Date(guest.rsvp_responded_at).toLocaleDateString('tr-TR')
          : '-',
        'Eklenme Tarihi': new Date(guest.created_at).toLocaleDateString('tr-TR'),
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      
      // Set column widths
      const columnWidths = [
        { wch: 6 },  // Sıra
        { wch: 25 }, // Ad Soyad
        { wch: 30 }, // E-posta
        { wch: 18 }, // Telefon
        { wch: 15 }, // RSVP Durumu
        { wch: 10 }, // Refakatçi
        { wch: 12 }, // Toplam Kişi
        { wch: 25 }, // Diyet
        { wch: 40 }, // Notlar
        { wch: 15 }, // RSVP Tarihi
        { wch: 15 }, // Eklenme Tarihi
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Davetli Listesi');

      // Generate filename
      const sanitizedTitle = invitationTitle
        .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Davetli_Listesi_${sanitizedTitle}_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, filename);

      console.log('✅ Excel file exported:', filename);
      toast.success(`Excel dosyası indirildi: ${filename}`);
    } catch (error) {
      console.error('❌ Excel export error:', error);
      toast.error('Excel dosyası oluşturulurken hata oluştu');
      throw error;
    }
  }

  /**
   * Export guests with statistics summary
   */
  exportGuestsWithStats(
    guests: Guest[], 
    invitationTitle: string,
    stats: {
      total: number;
      attending: number;
      declined: number;
      pending: number;
      total_attending: number;
    }
  ): void {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // === Sheet 1: Summary Statistics ===
      const summaryData = [
        ['Davetiye Başlığı', invitationTitle],
        ['Export Tarihi', new Date().toLocaleDateString('tr-TR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })],
        [],
        ['İSTATİSTİKLER'],
        ['Toplam Davetli', stats.total],
        ['Gelecek', stats.attending],
        ['Bekliyor', stats.pending],
        ['Gelemeyecek', stats.declined],
        ['Toplam Katılımcı (Davetli + Refakatçi)', stats.total_attending],
        [],
        ['RSVP ORANI'],
        ['Yanıt Veren', stats.attending + stats.declined],
        ['Yanıt Vermeyen', stats.pending],
        ['Yanıt Oranı (%)', stats.total > 0 ? Math.round(((stats.attending + stats.declined) / stats.total) * 100) : 0],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 35 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet');

      // === Sheet 2: Guest List ===
      const guestsData = guests.map((guest, index) => ({
        'Sıra': index + 1,
        'Ad Soyad': guest.full_name,
        'E-posta': guest.email || '-',
        'Telefon': guest.phone || '-',
        'RSVP Durumu': this.getRSVPStatusText(guest.rsvp_status),
        'Refakatçi': guest.companion_count || 0,
        'Toplam Kişi': 1 + (guest.companion_count || 0),
        'Diyet Kısıtlamaları': guest.dietary_restrictions || '-',
        'Notlar (Davetli)': guest.notes || '-',
        'RSVP Tarihi': guest.rsvp_responded_at 
          ? new Date(guest.rsvp_responded_at).toLocaleDateString('tr-TR')
          : '-',
        'Eklenme Tarihi': new Date(guest.created_at).toLocaleDateString('tr-TR'),
      }));

      const guestsSheet = XLSX.utils.json_to_sheet(guestsData);
      guestsSheet['!cols'] = [
        { wch: 6 }, { wch: 25 }, { wch: 30 }, { wch: 18 }, 
        { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 25 }, 
        { wch: 40 }, { wch: 15 }, { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, guestsSheet, 'Davetliler');

      // === Sheet 3: Attending Only ===
      const attendingGuests = guests.filter(g => g.rsvp_status === 'attending');
      if (attendingGuests.length > 0) {
        const attendingData = attendingGuests.map((guest, index) => ({
          'Sıra': index + 1,
          'Ad Soyad': guest.full_name,
          'E-posta': guest.email || '-',
          'Telefon': guest.phone || '-',
          'Refakatçi': guest.companion_count || 0,
          'Toplam Kişi': 1 + (guest.companion_count || 0),
          'Diyet Kısıtlamaları': guest.dietary_restrictions || '-',
        }));

        const attendingSheet = XLSX.utils.json_to_sheet(attendingData);
        attendingSheet['!cols'] = [
          { wch: 6 }, { wch: 25 }, { wch: 30 }, { wch: 18 }, 
          { wch: 10 }, { wch: 12 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(workbook, attendingSheet, 'Gelecekler');
      }

      // Generate filename
      const sanitizedTitle = invitationTitle
        .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Davetli_Raporu_${sanitizedTitle}_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, filename);

      console.log('✅ Detailed Excel report exported:', filename);
      toast.success(`Detaylı rapor indirildi: ${filename}`);
    } catch (error) {
      console.error('❌ Excel export error:', error);
      toast.error('Excel raporu oluşturulurken hata oluştu');
      throw error;
    }
  }

  /**
   * Get RSVP status text in Turkish
   */
  private getRSVPStatusText(status: string): string {
    switch (status) {
      case 'attending':
        return 'Gelecek';
      case 'declined':
        return 'Gelemeyecek';
      case 'pending':
        return 'Bekliyor';
      default:
        return status;
    }
  }
}

export const excelService = new ExcelService();

