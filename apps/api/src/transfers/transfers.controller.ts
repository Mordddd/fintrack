import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { TransfersService } from "./transfers.service";
import { CreateTransferDto } from "./dto";

@ApiTags("transfers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("transfers")
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({ summary: "Transfer funds between two accounts" })
  create(@CurrentUser("id") userId: string, @Body() dto: CreateTransferDto) {
    return this.transfersService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all transfers" })
  findAll(@CurrentUser("id") userId: string) {
    return this.transfersService.findAll(userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete transfer and revert balances" })
  remove(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.transfersService.remove(userId, id);
  }
}
