require("reflect-metadata");
const express = require("express");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { NestFactory } = require("@nestjs/core");
const { ValidationPipe } = require("@nestjs/common");
const { ExpressAdapter } = require("@nestjs/platform-express");

let appPromise = null;
const server = express();

async function bootstrap() {
  const { AppModule } = require("../dist/app.module");
  const adapter = new ExpressAdapter(server);
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
  return server;
}

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = bootstrap();
  }
  await appPromise;
  server(req, res);
};
