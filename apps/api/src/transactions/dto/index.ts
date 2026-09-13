import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType } from "@fintrack/shared";

export class CreateTransactionDto {
  @ApiProperty({ example: "acc_123" })
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @ApiProperty({ example: "cat_123" })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ example: 45000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: "Lunch with team" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "2026-09-13T10:00:00.000Z" })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: "Reimbursable" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: "acc_123" })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({ example: "cat_123" })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ example: 50000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: "Lunch with clients" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "2026-09-13T10:00:00.000Z" })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ example: "Reimbursed" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class TransactionQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: "2026-09-01T00:00:00.000Z" })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: "2026-09-30T23:59:59.999Z" })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: "date" })
  @IsString()
  @IsOptional()
  sortBy?: string = "date";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "desc" })
  @IsString()
  @IsOptional()
  sortOrder?: "asc" | "desc" = "desc";
}
