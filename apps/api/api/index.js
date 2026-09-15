require("reflect-metadata");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { NestFactory } = require("@nestjs/core");
const { ValidationPipe } = require("@nestjs/common");
const { ExpressAdapter } = require("@nestjs/platform-express");
const { AppModule } = require("../dist/app.module");

let appPromise = null;
const server = express();

server.set("trust proxy", 1);
server.use((req, res, next) => {
  if (!req.socket) req.socket = {};
  if (!req.socket.remoteAddress) {
    const raw = req.headers["x-forwarded-for"] || req.headers["x-real-ip"];
    req.socket.remoteAddress = (Array.isArray(raw) ? raw[0] : (raw || "127.0.0.1")).split(",")[0].trim();
  }
  next();
});

async function bootstrap() {
  const adapter = new ExpressAdapter(server);
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ["error", "warn", "log"],
  });

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  await app.init();
  return server;
}

module.exports = async (req, res) => {
  try {
    if (!appPromise) {
      appPromise = bootstrap();
    }
    await appPromise;
    server(req, res);
  } catch (err) {
    console.error("Vercel Serverless Function Crash:", err);
    res.status(500).json({
      success: false,
      error: {
        message: err?.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
      },
    });
  }
};
