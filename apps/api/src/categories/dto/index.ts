import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CategoryType } from "@fintrack/shared";

export class CreateCategoryDto {
  @ApiProperty({ example: "Groceries" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: CategoryType, example: CategoryType.EXPENSE })
  @IsEnum(CategoryType)
  type!: CategoryType;

  @ApiPropertyOptional({ example: "shopping-bag" })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: "#10B981" })
  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: "Groceries & Supermarket" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: CategoryType })
  @IsEnum(CategoryType)
  @IsOptional()
  type?: CategoryType;

  @ApiPropertyOptional({ example: "shopping-cart" })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: "#059669" })
  @IsString()
  @IsOptional()
  color?: string;
}

export class CategoryQueryDto {
  @ApiPropertyOptional({ enum: CategoryType })
  @IsEnum(CategoryType)
  @IsOptional()
  type?: CategoryType;
}
