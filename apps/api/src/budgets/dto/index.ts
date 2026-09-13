import { IsString, IsNumber, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @IsString()
  categoryId!: string;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month!: number;

  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year!: number;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  limitAmount!: number;
}

export class UpdateBudgetDto {
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  limitAmount!: number;
}

export class BudgetQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Type(() => Number)
  year?: number;
}
