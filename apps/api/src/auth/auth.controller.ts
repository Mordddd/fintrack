import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerResponse,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Register a new user" })
  @SwaggerResponse({ status: 201, description: "User registered" })
  @SwaggerResponse({ status: 409, description: "Email already exists" })
  async register(@Body() dto: RegisterDto) {
    const data = await this.auth.register(dto);
    return { success: true, data };
  }

  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @SwaggerResponse({ status: 200, description: "Login successful" })
  @SwaggerResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() dto: LoginDto) {
    const data = await this.auth.login(dto);
    return { success: true, data };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @SwaggerResponse({ status: 200, description: "Tokens refreshed" })
  @SwaggerResponse({ status: 401, description: "Invalid refresh token" })
  async refresh(@Body("refreshToken") refreshToken: string) {
    const tokens = await this.auth.refresh(refreshToken);
    return { success: true, data: { tokens } };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @SwaggerResponse({ status: 200, description: "User profile" })
  async profile(@CurrentUser("id") userId: string) {
    const user = await this.auth.getProfile(userId);
    return { success: true, data: { user } };
  }
}
