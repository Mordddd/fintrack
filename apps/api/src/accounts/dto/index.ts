import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AccountType } from "@fintrack/shared";

export class CreateAccountDto {
  @ApiProperty({ example: "BCA Main" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.BANK })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiProperty({ example: 5000000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initialBalance!: number;

  @ApiPropertyOptional({ example: "IDR", default: "IDR" })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: "#059669", default: "#059669" })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: "landmark", default: "wallet" })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: "BCA Primary" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: AccountType })
  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @ApiPropertyOptional({ example: 6000000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  initialBalance?: number;

  @ApiPropertyOptional({ example: "IDR" })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: "#10B981" })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: "credit-card" })
  @IsString()
  @IsOptional()
  icon?: string;
}
