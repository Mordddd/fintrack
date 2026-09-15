import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

@Injectable()
export class SafeThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const header = req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"];
    if (header) {
      const first = Array.isArray(header) ? header[0] : header.split(",")[0];
      return first.trim();
    }
    return req.socket?.remoteAddress || "127.0.0.1";
  }
}
