import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from "./dto";
import { CategoryType } from "@fintrack/shared";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        icon: dto.icon ?? (dto.type === CategoryType.INCOME ? "wallet" : "tag"),
        color: dto.color ?? "#059669",
        isDefault: false,
      },
    });
    return category;
  }

  async findAll(userId: string, query?: CategoryQueryDto) {
    const where: any = {
      OR: [{ userId }, { userId: null }, { isDefault: true }],
    };

    if (query?.type) {
      where.type = query.type;
    }

    return this.prisma.category.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    if (category.userId && category.userId !== userId) {
      throw new ForbiddenException("Access denied to this category");
    }

    return category;
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.findOne(userId, id);

    if (!category.userId || category.isDefault) {
      throw new ForbiddenException("Cannot modify system default categories");
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    const category = await this.findOne(userId, id);

    if (!category.userId || category.isDefault) {
      throw new ForbiddenException("Cannot delete system default categories");
    }

    // Check if any transactions reference it
    const txCount = await this.prisma.transaction.count({
      where: { categoryId: id },
    });

    if (txCount > 0) {
      throw new BadRequestException(
        "Cannot delete category that has transactions associated with it",
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async seedDefaults(userId: string) {
    const existingCount = await this.prisma.category.count({
      where: { userId },
    });

    if (existingCount > 0) return;

    const defaultCategories: Array<{
      name: string;
      type: CategoryType;
      icon: string;
      color: string;
    }> = [
      // Income
      { name: "Salary", type: CategoryType.INCOME, icon: "briefcase", color: "#059669" },
      { name: "Freelance", type: CategoryType.INCOME, icon: "laptop", color: "#10B981" },
      { name: "Investment", type: CategoryType.INCOME, icon: "trending-up", color: "#3B82F6" },
      { name: "Gift", type: CategoryType.INCOME, icon: "gift", color: "#EC4899" },
      { name: "Other Income", type: CategoryType.INCOME, icon: "plus-circle", color: "#6B7280" },
      // Expense
      { name: "Food & Drink", type: CategoryType.EXPENSE, icon: "utensils", color: "#F59E0B" },
      { name: "Transportation", type: CategoryType.EXPENSE, icon: "car", color: "#6366F1" },
      { name: "Shopping", type: CategoryType.EXPENSE, icon: "shopping-bag", color: "#EC4899" },
      { name: "Bills & Utilities", type: CategoryType.EXPENSE, icon: "file-text", color: "#EF4444" },
      { name: "Entertainment", type: CategoryType.EXPENSE, icon: "film", color: "#8B5CF6" },
      { name: "Health", type: CategoryType.EXPENSE, icon: "heart-pulse", color: "#14B8A6" },
      { name: "Education", type: CategoryType.EXPENSE, icon: "graduation-cap", color: "#0284C7" },
      { name: "Other Expense", type: CategoryType.EXPENSE, icon: "minus-circle", color: "#9CA3AF" },
    ];

    await this.prisma.category.createMany({
      data: defaultCategories.map((c) => ({
        userId,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        isDefault: false,
      })),
    });
  }
}
