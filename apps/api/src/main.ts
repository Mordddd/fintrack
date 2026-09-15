import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(cookieParser());
  const corsOrigin = config.get("CORS_ORIGIN", "http://localhost:3000");
  app.enableCors({
    origin: corsOrigin.includes(",")
      ? corsOrigin.split(",").map((s: string) => s.trim())
      : corsOrigin === "*"
        ? true
        : corsOrigin,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle("FinTrack API")
    .setDescription("Personal finance management API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = config.get("PORT") || config.get("API_PORT", 3001);
  await app.listen(port, "0.0.0.0");
  console.log(`FinTrack API running on http://0.0.0.0:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
