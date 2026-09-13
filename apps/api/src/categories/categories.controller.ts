import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from "./dto";

@ApiTags("categories")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: "Create a custom category" })
  create(@CurrentUser("id") userId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all user and default categories" })
  findAll(
    @CurrentUser("id") userId: string,
    @Query() query: CategoryQueryDto,
  ) {
    return this.categoriesService.findAll(userId, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get category by id" })
  findOne(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.categoriesService.findOne(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a custom category" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a custom category" })
  remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.categoriesService.remove(userId, id);
  }
}
