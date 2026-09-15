import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ExpressAdapter } from "@nestjs/platform-express";
import express, { Request, Response } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";

const server = express();
let isReady = false;

async function bootstrap(expressApp: express.Express) {
  const adapter = new ExpressAdapter(expressApp);
  const app = await NestFactory.create(AppModule, adapter);

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
}

export default async function handler(req: Request, res: Response) {
  if (!isReady) {
    await bootstrap(server);
    isReady = true;
  }
  return server(req, res);
}
