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
import { TransactionsService } from "./transactions.service";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
  CsvImportPayloadDto,
} from "./dto";

@ApiTags("transactions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: "Create a transaction" })
  create(@CurrentUser("id") userId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get paginated, filtered transactions" })
  findAll(
    @CurrentUser("id") userId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.transactionsService.findAll(userId, query);
  }

  @Get("summary")
  @ApiOperation({ summary: "Get monthly aggregates & recent transactions" })
  getSummary(@CurrentUser("id") userId: string) {
    return this.transactionsService.getDashboardMetrics(userId);
  }

  @Post("import")
  @ApiOperation({ summary: "Import batch transactions from CSV" })
  importBatch(
    @CurrentUser("id") userId: string,
    @Body() dto: CsvImportPayloadDto,
  ) {
    return this.transactionsService.importBatch(userId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get transaction by id" })
  findOne(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.transactionsService.findOne(userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update transaction" })
  update(
    @CurrentUser("id") userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(userId, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete transaction and revert balance" })
  remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.transactionsService.remove(userId, id);
  }
}
