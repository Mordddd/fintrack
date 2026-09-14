import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../database/prisma.service";
import { ActivityService } from "../activity/activity.service";
import { UpdateProfileDto, ChangePasswordDto } from "./dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  private sanitizeUser(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      timezone: user.timezone,
      avatarUrl: user.avatarUrl,
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : user.createdAt,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name ?? undefined,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : undefined,
        currency: dto.currency ?? undefined,
        timezone: dto.timezone ?? undefined,
      },
    });

    await this.activity.log(userId, "UPDATE", "USER", userId, {
      updatedFields: Object.keys(dto),
    });

    return this.sanitizeUser(updated);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException("Current password does not match");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.activity.log(userId, "UPDATE", "USER", userId, {
      field: "password",
    });

    return {
      success: true,
      message: "Password updated successfully",
    };
  }

  async deleteAccount(userId: string, confirmationEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      confirmationEmail.toLowerCase().trim() !==
      user.email.toLowerCase().trim()
    ) {
      throw new BadRequestException("Confirmation email does not match");
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }
}
