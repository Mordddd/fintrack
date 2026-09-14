import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ExportService } from './export.service';
import { ExportQueryDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('transactions/csv')
  async exportCSV(
    @CurrentUser('id') userId: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportTransactionsCSV(
      userId,
      query.startDate,
      query.endDate,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  }

  @Get('transactions/json')
  async exportJSON(
    @CurrentUser('id') userId: string,
    @Query() query: ExportQueryDto,
  ) {
    return this.exportService.exportTransactionsJSON(
      userId,
      query.startDate,
      query.endDate,
    );
  }
}
