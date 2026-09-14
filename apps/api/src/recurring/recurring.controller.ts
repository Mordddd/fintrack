import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto, UpdateRecurringDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('recurring')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateRecurringDto) {
    return this.recurringService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.recurringService.findAll(userId);
  }

  @Post('process')
  process(@CurrentUser('id') userId: string) {
    return this.recurringService.processDueRecurring(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.recurringService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringDto,
  ) {
    return this.recurringService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.recurringService.remove(userId, id);
  }

  @Post(':id/pause')
  pause(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.recurringService.pause(userId, id);
  }

  @Post(':id/resume')
  resume(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.recurringService.resume(userId, id);
  }
}
