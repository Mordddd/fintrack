import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AccountsService } from "./accounts.service";
import { CreateAccountDto, UpdateAccountDto } from "./dto";

@ApiTags("accounts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new financial account" })
  create(@CurrentUser("id") userId: string, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all active accounts for current user" })
  findAll(@CurrentUser("id") userId: string) {
    return this.accountsService.findAll(userId);
  }

  @Get("summary")
  @ApiOperation({ summary: "Get total balance and account breakdown" })
  getSummary(@CurrentUser("id") userId: string) {
    return this.accountsService.getBalanceSummary(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get account by id" })
  findOne(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.accountsService.findOne(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update account details" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Soft-delete account" })
  remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.accountsService.remove(userId, id);
  }
}
