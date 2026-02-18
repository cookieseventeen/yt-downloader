import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YoutubeModule } from './youtube/youtube.module';
import { DownloadModule } from './download/download.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    YoutubeModule,
    DownloadModule,
  ],
})
export class AppModule {}
