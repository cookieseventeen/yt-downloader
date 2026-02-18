import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全域 API 前綴
  app.setGlobalPrefix('api');

  // 啟用 CORS（前端 4200 → 後端 3000）
  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'DELETE'],
    exposedHeaders: ['Content-Disposition'],
  });

  // 全域驗證管線
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger 文件
  const config = new DocumentBuilder()
    .setTitle('YouTube 下載器 API')
    .setDescription('YouTube 搜尋與 yt-dlp 下載 API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('🚀 NestJS 後端已啟動：http://localhost:3000');
  console.log('📄 Swagger 文件：http://localhost:3000/api/docs');
}
bootstrap();
