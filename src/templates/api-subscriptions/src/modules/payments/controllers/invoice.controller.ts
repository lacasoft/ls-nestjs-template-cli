import { Controller, Get, Param, Request, Res, UseGuards, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InvoiceService } from '../services/invoice.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices for the authenticated user' })
  async getUserInvoices(@Request() req: AuthenticatedRequest) {
    const invoices = await this.invoiceService.getUserInvoices(req.user.userId);
    return {
      success: true,
      data: invoices,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific invoice by ID' })
  async getInvoice(@Param('id') invoiceId: string, @Request() req: AuthenticatedRequest) {
    const invoice = await this.invoiceService.getInvoice(invoiceId);

    // Ensure user owns this invoice
    if (invoice.userId !== req.user.userId) {
      throw new NotFoundException('Invoice not found');
    }

    return {
      success: true,
      data: invoice,
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download invoice PDF' })
  async downloadInvoice(
    @Param('id') invoiceId: string,
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const invoice = await this.invoiceService.getInvoice(invoiceId);

    // Ensure user owns this invoice
    if (invoice.userId !== req.user.userId) {
      throw new NotFoundException('Invoice not found');
    }

    const pdfPath = await this.invoiceService.getInvoicePDF(invoiceId);

    // Send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.sendFile(pdfPath);
  }
}
