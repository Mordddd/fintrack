import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTransferDto {
  @ApiProperty({ example: "acc_source" })
  @IsString()
  @IsNotEmpty()
  fromAccountId!: string;

  @ApiProperty({ example: "acc_dest" })
  @IsString()
  @IsNotEmpty()
  toAccountId!: string;

  @ApiProperty({ example: 500000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: "Monthly savings transfer" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "2026-09-13T10:00:00.000Z" })
  @IsDateString()
  @IsOptional()
  date?: string;
}
