import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PrismaService } from "./database/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Check service health and database connectivity" })
  @ApiResponse({ status: 200, description: "System is healthy" })
  @ApiResponse({ status: 503, description: "Database is unavailable" })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        success: true,
        data: {
          status: "ok",
          database: "connected",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        },
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        success: false,
        data: {
          status: "error",
          database: "disconnected",
          error: (error as Error).message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}
