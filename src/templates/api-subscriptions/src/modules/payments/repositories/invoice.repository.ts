import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';

@Injectable()
export class InvoiceRepository extends Repository<Invoice> {
  constructor(private dataSource: DataSource) {
    super(Invoice, dataSource.createEntityManager());
  }

  async findByUserId(userId: string): Promise<Invoice[]> {
    return this.find({
      where: { userId },
      relations: ['transaction'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    return this.findOne({
      where: { invoiceNumber },
      relations: ['user', 'transaction'],
    });
  }

  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `INV-${year}${month}`;

    const lastInvoice = await this.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!lastInvoice || !lastInvoice.invoiceNumber.startsWith(prefix)) {
      return `${prefix}-0001`;
    }

    const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
    const nextNumber = String(lastNumber + 1).padStart(4, '0');
    return `${prefix}-${nextNumber}`;
  }
}
