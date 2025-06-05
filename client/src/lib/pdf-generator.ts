import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { IsolationPoint } from '@shared/schema';

interface PDFMetadata {
  listName: string;
  jsaNumber: string;
  workOrder: string;
  jobDescription: string;
  generatedDate: string;
  totalPoints: number;
}

interface PDFExportData {
  points: IsolationPoint[];
  metadata: PDFMetadata;
}

export class EnterprisePDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape orientation
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  public generateLOTOProcedure(data: PDFExportData): void {
    this.addHeader(data.metadata);
    this.addProcedureInfo(data.metadata);
    this.addIsolationTable(data.points);
    this.addFooter();
  }

  private addHeader(metadata: PDFMetadata): void {
    // Company Header
    this.doc.setFillColor(21, 101, 192); // Industrial blue
    this.doc.rect(0, 0, this.pageWidth, 25, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('LOCKOUT/TAGOUT PROCEDURE', this.pageWidth / 2, 12, { align: 'center' });
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Industrial Safety Management System', this.pageWidth / 2, 18, { align: 'center' });

    // Reset color and position
    this.doc.setTextColor(0, 0, 0);
    this.currentY = 35;

    // Document title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(metadata.listName.toUpperCase(), this.margin, this.currentY);
    this.currentY += 15;
  }

  private addSafetyWarnings(): void {
    // Safety warning box
    this.doc.setFillColor(255, 112, 67); // Safety orange
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('⚠ DANGER - AUTHORIZED PERSONNEL ONLY', this.pageWidth / 2, this.currentY + 8, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('This procedure must be followed exactly as written. Unauthorized modifications are prohibited.', this.pageWidth / 2, this.currentY + 15, { align: 'center' });
    this.doc.text('Failure to follow proper LOTO procedures may result in serious injury or death.', this.pageWidth / 2, this.currentY + 20, { align: 'center' });

    this.doc.setTextColor(0, 0, 0);
    this.currentY += 35;
  }

  private addProcedureInfo(metadata: PDFMetadata): void {
    // Information table - simplified to essential fields only
    const infoData = [
      ['JSA Number:', metadata.jsaNumber],
      ['Work Order:', metadata.workOrder],
      ['Job Description:', metadata.jobDescription]
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Field', 'Value']],
      body: infoData,
      theme: 'grid',
      headStyles: {
        fillColor: [21, 101, 192],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 120 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  private addIsolationTable(points: IsolationPoint[]): void {
    // Procedure steps header
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ISOLATION PROCEDURE STEPS', this.margin, this.currentY);
    this.currentY += 10;

    // Table data preparation - simplified format without type column
    const tableData = points.map((point, index) => [
      (index + 1).toString(),
      point.kks,
      point.unit,
      point.description,
      point.isolationMethod
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Step', 'KKS Code', 'Unit', 'Description', 'Isolation Method']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [21, 101, 192],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 35, fontStyle: 'bold', textColor: [21, 101, 192] },
        2: { cellWidth: 20 },
        3: { cellWidth: 85 },
        4: { cellWidth: 60 }
      },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
  }

  private addSignatureSection(): void {
    // Check if we need a new page
    if (this.currentY + 60 > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Signature section
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AUTHORIZATION & VERIFICATION', this.margin, this.currentY);
    this.currentY += 15;

    const signatureData = [
      ['Procedure Prepared By:', '', 'Date:', ''],
      ['Authorized By (Supervisor):', '', 'Date:', ''],
      ['Electrical Isolation Verified By:', '', 'Date:', ''],
      ['Mechanical Isolation Verified By:', '', 'Date:', ''],
      ['Work Completed - Isolation Removed By:', '', 'Date:', '']
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      body: signatureData,
      theme: 'grid',
      bodyStyles: {
        fontSize: 10,
        cellPadding: 8
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 60 },
        2: { cellWidth: 25, fontStyle: 'bold' },
        3: { cellWidth: 35 }
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15;

    // Safety reminders
    this.doc.setFillColor(255, 245, 235);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SAFETY REMINDERS:', this.margin + 5, this.currentY + 8);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('• Verify zero energy state before beginning work', this.margin + 5, this.currentY + 14);
    this.doc.text('• Test isolation devices after each step', this.margin + 5, this.currentY + 18);
    this.doc.text('• Only authorized personnel may remove locks and tags', this.margin + 5, this.currentY + 22);
  }

  private addFooter(): void {
    const totalPages = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(21, 101, 192);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      
      this.doc.text('Industrial Isolation Management System', this.margin, this.pageHeight - 8);
      this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin, this.pageHeight - 8, { align: 'right' });
      this.doc.text(`Generated: ${new Date().toLocaleString()}`, this.pageWidth / 2, this.pageHeight - 8, { align: 'center' });
    }
  }

  public save(filename: string): void {
    this.doc.save(filename);
  }

  public getBlob(): Blob {
    return this.doc.output('blob');
  }
}

export function generateLOTOPDF(data: PDFExportData): void {
  const generator = new EnterprisePDFGenerator();
  generator.generateLOTOProcedure(data);
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `LOTO-Procedure-${data.metadata.listName.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.pdf`;
  
  generator.save(filename);
}