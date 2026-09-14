import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRecurringDto {
  @IsString()
  accountId!: string;

  @IsString()
  categoryId!: string;

  @IsEnum(['INCOME', 'EXPENSE'])
  type!: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  frequency!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateRecurringDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  frequency?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
