import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { Invoice, InvoiceStatus, InvoiceItem } from '../entities/invoice.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../../users/entities/user.entity';
import { EmailService } from '../../../common/services/email.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private readonly invoicesDir: string;

  constructor(
    private invoiceRepository: InvoiceRepository,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    // Setup invoices directory
    this.invoicesDir = path.join(process.cwd(), 'storage', 'invoices');
    this.ensureInvoicesDirectory();
  }

  private ensureInvoicesDirectory() {
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
      this.logger.log(`Created invoices directory: ${this.invoicesDir}`);
    }
  }

  /**
   * Create an invoice for a transaction
   */
  async createInvoiceForTransaction(transaction: Transaction, user: User): Promise<Invoice> {
    try {
      const invoiceNumber = await this.invoiceRepository.getNextInvoiceNumber();

      // Calculate amounts
      const subtotal = Number(transaction.amount);
      const taxAmount = 0; // TODO: Implement tax calculation based on location
      const total = subtotal + taxAmount;

      // Prepare invoice items
      const items: InvoiceItem[] = [
        {
          description: transaction.description || 'Subscription Payment',
          quantity: 1,
          unitPrice: subtotal,
          amount: subtotal,
          taxRate: 0,
        },
      ];

      // Create invoice
      const invoice = this.invoiceRepository.create({
        invoiceNumber,
        userId: user.id,
        transactionId: transaction.id,
        status: InvoiceStatus.PAID,
        issueDate: new Date(),
        dueDate: new Date(), // Already paid
        subtotal,
        taxAmount,
        discountAmount: 0,
        total,
        currency: transaction.currency,
        items,
        billingAddress: {
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
        },
        metadata: {
          transactionType: transaction.transactionType,
          paymentMethod: transaction.paymentMethod,
        },
      });

      await this.invoiceRepository.save(invoice);

      this.logger.log(`Invoice ${invoiceNumber} created for transaction ${transaction.id}`);

      return invoice;
    } catch (error) {
      this.logger.error('Error creating invoice', error);
      throw new BadRequestException(`Failed to create invoice: ${error.message}`);
    }
  }

  /**
   * Generate PDF for an invoice
   */
  async generatePDF(invoiceId: string): Promise<string> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['user', 'transaction'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    try {
      const fileName = `${invoice.invoiceNumber}.pdf`;
      const filePath = path.join(this.invoicesDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // Pipe to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Build PDF content
      this.generatePDFContent(doc, invoice);

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });

      // Update invoice with PDF path
      invoice.pdfPath = filePath;
      await this.invoiceRepository.save(invoice);

      this.logger.log(`PDF generated for invoice ${invoice.invoiceNumber}: ${filePath}`);

      return filePath;
    } catch (error) {
      this.logger.error(`Error generating PDF for invoice ${invoiceId}`, error);
      throw new BadRequestException(`Failed to generate PDF: ${error.message}`);
    }
  }

  /**
   * Generate PDF content
   */
  private generatePDFContent(doc: typeof PDFDocument, invoice: Invoice) {
    const appName = this.configService.get<string>('APP_NAME') || 'Subscription Service';

    // Header
    doc
      .fontSize(20)
      .text(appName, 50, 50, { align: 'left' })
      .fontSize(10)
      .text('Invoice', 50, 80, { align: 'left' });

    // Invoice details - right side
    doc
      .fontSize(10)
      .text(`Invoice #: ${invoice.invoiceNumber}`, 350, 50, { align: 'right' })
      .text(`Date: ${this.formatDate(invoice.issueDate)}`, 350, 65, { align: 'right' })
      .text(`Status: ${invoice.status.toUpperCase()}`, 350, 80, { align: 'right' });

    // Line separator
    doc.moveTo(50, 120).lineTo(545, 120).stroke();

    // Billing information
    doc
      .fontSize(12)
      .text('Bill To:', 50, 140, { underline: true })
      .fontSize(10)
      .text(invoice.billingAddress?.name || 'N/A', 50, 160)
      .text(invoice.billingAddress?.email || '', 50, 175);

    if (invoice.billingAddress?.address) {
      doc.text(invoice.billingAddress.address, 50, 190);
      let y = 205;
      if (invoice.billingAddress?.city) {
        doc.text(
          `${invoice.billingAddress.city}${invoice.billingAddress.state ? ', ' + invoice.billingAddress.state : ''} ${invoice.billingAddress.zipCode || ''}`,
          50,
          y,
        );
        y += 15;
      }
      if (invoice.billingAddress?.country) {
        doc.text(invoice.billingAddress.country, 50, y);
      }
    }

    // Items table header
    const tableTop = 280;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Description', 50, tableTop)
      .text('Qty', 300, tableTop, { width: 50, align: 'center' })
      .text('Unit Price', 350, tableTop, { width: 90, align: 'right' })
      .text('Amount', 440, tableTop, { width: 100, align: 'right' });

    // Line under header
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .stroke();

    // Items
    let y = tableTop + 25;
    doc.font('Helvetica');

    invoice.items.forEach((item: InvoiceItem) => {
      doc
        .text(item.description, 50, y, { width: 240 })
        .text(item.quantity.toString(), 300, y, { width: 50, align: 'center' })
        .text(this.formatCurrency(item.unitPrice, invoice.currency), 350, y, {
          width: 90,
          align: 'right',
        })
        .text(this.formatCurrency(item.amount, invoice.currency), 440, y, {
          width: 100,
          align: 'right',
        });
      y += 25;
    });

    // Totals section
    const totalsTop = y + 20;
    doc.moveTo(350, totalsTop).lineTo(545, totalsTop).stroke();

    y = totalsTop + 10;

    // Subtotal
    doc
      .text('Subtotal:', 350, y)
      .text(this.formatCurrency(Number(invoice.subtotal), invoice.currency), 440, y, {
        width: 100,
        align: 'right',
      });

    y += 20;

    // Tax
    if (Number(invoice.taxAmount) > 0) {
      doc
        .text('Tax:', 350, y)
        .text(this.formatCurrency(Number(invoice.taxAmount), invoice.currency), 440, y, {
          width: 100,
          align: 'right',
        });
      y += 20;
    }

    // Discount
    if (Number(invoice.discountAmount) > 0) {
      doc
        .text('Discount:', 350, y)
        .text(`-${this.formatCurrency(Number(invoice.discountAmount), invoice.currency)}`, 440, y, {
          width: 100,
          align: 'right',
        });
      y += 20;
    }

    // Total
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Total:', 350, y)
      .text(this.formatCurrency(Number(invoice.total), invoice.currency), 440, y, {
        width: 100,
        align: 'right',
      });

    // Notes
    if (invoice.notes) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .text('Notes:', 50, y + 40)
        .text(invoice.notes, 50, y + 55, { width: 495 });
    }

    // Footer
    const footerTop = 720;
    doc
      .fontSize(8)
      .text('Thank you for your business!', 50, footerTop, { align: 'center' })
      .text(`Generated on ${this.formatDate(new Date())}`, 50, footerTop + 15, { align: 'center' });
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['user', 'transaction'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Get invoices for a user
   */
  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return this.invoiceRepository.findByUserId(userId);
  }

  /**
   * Get invoice PDF path
   */
  async getInvoicePDF(invoiceId: string): Promise<string> {
    const invoice = await this.getInvoice(invoiceId);

    if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
      // Generate PDF if it doesn't exist
      return this.generatePDF(invoiceId);
    }

    return invoice.pdfPath;
  }

  /**
   * Send invoice via email
   */
  async sendInvoiceEmail(invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['user'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Ensure PDF is generated
    const pdfPath =
      invoice.pdfPath && fs.existsSync(invoice.pdfPath)
        ? invoice.pdfPath
        : await this.generatePDF(invoiceId);

    // Send email
    await this.emailService.sendInvoiceEmail(
      invoice.user.email,
      `${invoice.user.firstName} ${invoice.user.lastName}`.trim(),
      invoice.invoiceNumber,
      Number(invoice.total),
      invoice.currency,
      pdfPath,
    );

    // Mark as sent
    await this.markEmailSent(invoiceId);
  }

  /**
   * Mark invoice as email sent
   */
  async markEmailSent(invoiceId: string): Promise<void> {
    const invoice = await this.getInvoice(invoiceId);
    invoice.emailSent = true;
    invoice.emailSentAt = new Date();
    await this.invoiceRepository.save(invoice);
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  /**
   * Format date
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  }
}
