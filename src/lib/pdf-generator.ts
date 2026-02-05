import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Company {
  name: string
  address: string
  city: string
  phone: string
  email: string
}

interface Supplier {
  name: string
  contact_name?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

interface POLine {
  part_number: string
  part_name: string
  description?: string | null
  quantity: number
  unit_price: number
  line_total: number
}

interface PurchaseOrderData {
  po_number: string
  order_date: string
  required_by_date: string
  supplier: Supplier
  lines: POLine[]
  total_amount: number
  notes?: string | null
  terms?: string
}

const COMPANY_INFO: Company = {
  name: 'ARC MARINE MANUFACTURING',
  address: '1234 Harbor Drive',
  city: 'Seattle, WA 98101',
  phone: '(555) 123-4567',
  email: 'orders@arcmarine.com'
}

export class POPDFGenerator {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF()
  }

  generate(poData: PurchaseOrderData): void {
    this.addHeader()
    this.addTitle()
    this.addCompanyInfo()
    this.addSupplierInfo(poData.supplier)
    this.addPODetails(poData)
    this.addLineItems(poData.lines)
    this.addTotals(poData.total_amount)
    if (poData.notes) {
      this.addNotes(poData.notes)
    }
    this.addTermsAndConditions(poData.terms)
    this.addFooter(poData.po_number)
  }

  private addHeader(): void {
    // Header bar
    this.doc.setFillColor(0, 0, 0)
    this.doc.rect(0, 0, 210, 15, 'F')
    
    // Company name in header
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(COMPANY_INFO.name, 10, 10)
  }

  private addTitle(): void {
    this.doc.setTextColor(0, 0, 0)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('PURCHASE ORDER', 105, 28, { align: 'center' })
  }

  private addCompanyInfo(): void {
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    
    const startY = 38
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('FROM:', 10, startY)
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(COMPANY_INFO.name, 10, startY + 5)
    this.doc.text(COMPANY_INFO.address, 10, startY + 10)
    this.doc.text(COMPANY_INFO.city, 10, startY + 15)
    this.doc.text(`Phone: ${COMPANY_INFO.phone}`, 10, startY + 20)
    this.doc.text(`Email: ${COMPANY_INFO.email}`, 10, startY + 25)
  }

  private addSupplierInfo(supplier: Supplier): void {
    this.doc.setFontSize(9)
    
    const startY = 38
    const startX = 110
    
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('VENDOR:', startX, startY)
    
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(supplier.name, startX, startY + 5)
    
    if (supplier.contact_name) {
      this.doc.text(`Attn: ${supplier.contact_name}`, startX, startY + 10)
    }
    
    if (supplier.address) {
      const lines = this.doc.splitTextToSize(supplier.address, 90)
      this.doc.text(lines, startX, startY + 15)
    }
    
    let yOffset = startY + 20
    if (supplier.phone) {
      this.doc.text(`Phone: ${supplier.phone}`, startX, yOffset)
      yOffset += 5
    }
    
    if (supplier.email) {
      this.doc.text(`Email: ${supplier.email}`, startX, yOffset)
    }
  }

  private addPODetails(poData: PurchaseOrderData): void {
    const startY = 75
    
    // Create a box for PO details
    this.doc.setDrawColor(0, 0, 0)
    this.doc.setLineWidth(0.5)
    this.doc.rect(10, startY, 190, 20)
    
    // Vertical lines to separate columns
    this.doc.line(75, startY, 75, startY + 20)
    this.doc.line(140, startY, 140, startY + 20)
    
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'bold')
    
    // PO Number
    this.doc.text('PO NUMBER:', 12, startY + 6)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(poData.po_number, 12, startY + 12)
    
    // Order Date
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('ORDER DATE:', 77, startY + 6)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(new Date(poData.order_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 77, startY + 12)
    
    // Required By Date
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('REQUIRED BY:', 142, startY + 6)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(new Date(poData.required_by_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), 142, startY + 12)
  }

  private addLineItems(lines: POLine[]): void {
    const tableData = lines.map(line => [
      line.part_number,
      line.part_name + (line.description ? `\n${line.description}` : ''),
      line.quantity.toString(),
      `$${line.unit_price.toFixed(2)}`,
      `$${line.line_total.toFixed(2)}`
    ])

    autoTable(this.doc, {
      startY: 100,
      head: [['Part Number', 'Description', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 75 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    })
  }

  private addTotals(totalAmount: number): void {
    const finalY = (this.doc as any).lastAutoTable.finalY || 100
    
    // Subtotal
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Subtotal:', 140, finalY + 10, { align: 'right' })
    this.doc.text(`$${totalAmount.toFixed(2)}`, 200, finalY + 10, { align: 'right' })
    
    // Tax (0% for this demo)
    this.doc.text('Tax (0%):', 140, finalY + 17, { align: 'right' })
    this.doc.text('$0.00', 200, finalY + 17, { align: 'right' })
    
    // Total with bold background
    this.doc.setFillColor(0, 0, 0)
    this.doc.rect(130, finalY + 20, 70, 10, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(12)
    this.doc.text('TOTAL:', 140, finalY + 27, { align: 'right' })
    this.doc.text(`$${totalAmount.toFixed(2)}`, 200, finalY + 27, { align: 'right' })
    
    this.doc.setTextColor(0, 0, 0)
  }

  private addNotes(notes: string): void {
    const finalY = (this.doc as any).lastAutoTable.finalY || 100
    const notesY = finalY + 40
    
    if (notesY > 250) return // Skip if not enough space
    
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('NOTES:', 10, notesY)
    
    this.doc.setFont('helvetica', 'normal')
    const wrappedNotes = this.doc.splitTextToSize(notes, 190)
    this.doc.text(wrappedNotes, 10, notesY + 5)
  }

  private addTermsAndConditions(terms?: string): void {
    const finalY = (this.doc as any).lastAutoTable.finalY || 100
    let termsY = finalY + 55
    
    if (termsY > 250) {
      this.doc.addPage()
      termsY = 20
    }
    
    this.doc.setFontSize(8)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('TERMS AND CONDITIONS:', 10, termsY)
    
    this.doc.setFont('helvetica', 'normal')
    const defaultTerms = terms || `
• Payment terms as agreed in supplier contract
• Goods must be delivered by the required date
• All items must meet specified quality standards
• Prices are as quoted and agreed upon
• Partial shipments require prior authorization
• All shipments must include packing slip with PO number
    `.trim()
    
    const wrappedTerms = this.doc.splitTextToSize(defaultTerms, 190)
    this.doc.text(wrappedTerms, 10, termsY + 5)
  }

  private addFooter(poNumber: string): void {
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Footer line
      this.doc.setDrawColor(0, 0, 0)
      this.doc.setLineWidth(0.5)
      this.doc.line(10, 285, 200, 285)
      
      // Footer text
      this.doc.setFontSize(8)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(
        `${COMPANY_INFO.name} | ${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`,
        105,
        290,
        { align: 'center' }
      )
      
      // Page number and PO number
      this.doc.text(`PO: ${poNumber}`, 10, 290)
      this.doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: 'right' })
    }
  }

  save(filename: string): void {
    this.doc.save(filename)
  }

  output(type: 'blob' | 'datauristring' = 'blob'): Blob | string {
    if (type === 'blob') {
      return this.doc.output('blob')
    }
    return this.doc.output('datauristring')
  }
}

export async function generatePOPDF(
  poData: PurchaseOrderData,
  download: boolean = true
): Promise<Blob> {
  const generator = new POPDFGenerator()
  generator.generate(poData)
  
  if (download) {
    generator.save(`PO-${poData.po_number}.pdf`)
  }
  
  return generator.output('blob') as Blob
}
