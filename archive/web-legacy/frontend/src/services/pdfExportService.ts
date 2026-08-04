import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { LegalDocument } from '../legal';
import type { DistanceSalesContractData } from '../legal/distance-sales-contract';
import { generateDistanceSalesContract } from '../legal/distance-sales-contract';

/**
 * PDF Export Service
 * Yasal belgeleri ve sözleşmeleri PDF formatında indirme
 */

class PDFExportService {
  /**
   * Yasal belgeyi PDF olarak indir
   */
  async exportLegalDocumentToPDF(legalDocument: LegalDocument, filename: string): Promise<void> {
    try {
      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.style.padding = '20mm';
      container.style.backgroundColor = '#ffffff';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.6';
      container.style.color = '#000000';

      // Add document header
      const header = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
          <h1 style="font-size: 24px; margin: 0 0 10px 0; color: #1a1a1a;">${legalDocument.title}</h1>
          <p style="margin: 0; color: #666; font-size: 11px;">Son Güncelleme: ${legalDocument.lastUpdated}</p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 11px;">Diligent Computer Systems & Digital Commerce - Dilek Aydemir</p>
        </div>
      `;

      // Add document content
      const content = legalDocument.sections.map(section => `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="font-size: 16px; margin: 0 0 10px 0; color: #1a1a1a; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            ${section.title}
          </h2>
          <div style="font-size: 12px; color: #333; white-space: pre-wrap;">
            ${this.formatContent(section.content)}
          </div>
        </div>
      `).join('');

      // Add footer
      const footer = `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #333; text-align: center;">
          <p style="margin: 0; font-size: 10px; color: #666;">
            Diligent Computer Systems & Digital Commerce - Dilek Aydemir<br/>
            E-posta: info@davetim.app | Telefon: +905359216894<br/>
            © ${new Date().getFullYear()} Tüm hakları saklıdır.
          </p>
        </div>
      `;

      container.innerHTML = header + content + footer;
      document.body.appendChild(container);

      // Generate PDF using html2canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add pages as needed
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      pdf.save(filename);
    } catch (error) {
      console.error('❌ PDF export error:', error);
      throw new Error('PDF oluşturma başarısız oldu');
    }
  }

  /**
   * Mesafeli satış sözleşmesini PDF olarak indir
   */
  async exportDistanceSalesContractToPDF(
    contractData: DistanceSalesContractData,
    filename: string
  ): Promise<void> {
    try {
      const contract = generateDistanceSalesContract(contractData);

      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.style.padding = '20mm';
      container.style.backgroundColor = '#ffffff';
      container.style.fontFamily = 'Arial, sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.6';
      container.style.color = '#000000';

      // Add contract header
      const header = `
        <div style="text-align: center; margin-bottom: 30px; border: 3px solid #333; padding: 20px;">
          <h1 style="font-size: 26px; margin: 0 0 10px 0; color: #1a1a1a; text-transform: uppercase;">
            ${contract.title}
          </h1>
          <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 11px; color: #666;">
            <p style="margin: 0;"><strong>Sözleşme No:</strong> ${contract.contractNumber}</p>
            <p style="margin: 0;"><strong>Tarih:</strong> ${contract.date}</p>
          </div>
        </div>
      `;

      // Add contract content
      const content = contract.sections.map(section => `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h2 style="font-size: 14px; margin: 0 0 12px 0; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 5px; font-weight: bold;">
            ${section.title}
          </h2>
          <div style="font-size: 12px; color: #333; white-space: pre-wrap; text-align: justify;">
            ${this.formatContent(section.content)}
          </div>
        </div>
      `).join('');

      // Add contract footer
      const footer = `
        <div style="margin-top: 50px; padding: 20px; border: 2px solid #333; background-color: #f9f9f9;">
          <p style="margin: 0 0 10px 0; font-size: 11px; color: #333; text-align: center; font-weight: bold;">
            Bu sözleşme elektronik ortamda onaylanmış ve 6502 sayılı Tüketicinin Korunması Hakkında Kanun<br/>
            ve Mesafeli Sözleşmeler Yönetmeliği hükümlerine göre düzenlenmiştir.
          </p>
          <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #666;">
            <p style="margin: 0;">Diligent Computer Systems & Digital Commerce - Dilek Aydemir</p>
            <p style="margin: 3px 0 0 0;">E-posta: info@davetim.app | Telefon: +905359216894</p>
          </div>
        </div>
      `;

      container.innerHTML = header + content + footer;
      document.body.appendChild(container);

      // Generate PDF
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add pages
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download PDF
      pdf.save(filename);
    } catch (error) {
      console.error('❌ Contract PDF export error:', error);
      throw new Error('Sözleşme PDF oluşturma başarısız oldu');
    }
  }

  /**
   * Format content for PDF (handle markdown-like syntax)
   */
  private formatContent(content: string): string {
    return content
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Line breaks
      .replace(/\n\n/g, '</p><p style="margin: 10px 0;">')
      .replace(/\n/g, '<br/>')
      // Lists
      .replace(/• /g, '<span style="display: inline-block; margin-right: 5px;">•</span>')
      // Links (basic)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #0066cc; text-decoration: underline;">$1</a>')
      // Wrap in paragraph if not already wrapped
      .replace(/^(.*)$/gm, (match) => {
        if (!match.startsWith('<') && match.trim()) {
          return `<p style="margin: 5px 0;">${match}</p>`;
        }
        return match;
      });
  }

  /**
   * Simple text-based PDF (fallback)
   * Bu method daha hafif ve hızlı ama görsel olarak daha basit
   */
  async exportSimpleTextPDF(
    title: string,
    content: string,
    filename: string
  ): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Set font
      pdf.setFont('helvetica');

      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, 20, 20);

      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date().toLocaleDateString('tr-TR'), 20, 30);

      // Add content
      pdf.setFontSize(12);
      const lines = pdf.splitTextToSize(content, 170);
      pdf.text(lines, 20, 40);

      // Download
      pdf.save(filename);
    } catch (error) {
      console.error('❌ Simple PDF export error:', error);
      throw new Error('PDF oluşturma başarısız oldu');
    }
  }
}

export const pdfExportService = new PDFExportService();

