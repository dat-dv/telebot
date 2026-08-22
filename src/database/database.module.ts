import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { UserEntity } from './entities/user.entity';
import { InviteEntity } from './entities/invite.entity';
import { UserTokenEntity } from './entities/user-token.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dataDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const dbPath = path.join(dataDir, 'telebot.sqlite');
        return {
          type: 'better-sqlite3',
          database: dbPath,
          entities: [UserEntity, InviteEntity, UserTokenEntity],
          synchronize: true,
          logging: false,
        };
      },
    }),
    TypeOrmModule.forFeature([UserEntity, InviteEntity, UserTokenEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
