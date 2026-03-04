import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YoutubeModule } from './youtube/youtube.module';
import { DownloadModule } from './download/download.module';
import { AuthModule } from './auth/auth.module';
import { OperationRecordModule } from './operation-record/operation-record.module';
import { User } from './auth/entities/user.entity';
import { OperationRecord } from './operation-record/entities/operation-record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/app.db',
      entities: [User, OperationRecord],
      synchronize: true,
    }),
    AuthModule,
    OperationRecordModule,
    YoutubeModule,
    DownloadModule,
  ],
})
export class AppModule {}
