import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { TransactionType } from "@fintrack/shared";

export class CsvImportItemDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsString()
  categoryId!: string;

  @IsString()
  accountId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CsvImportPayloadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CsvImportItemDto)
  items!: CsvImportItemDto[];

  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;
}
