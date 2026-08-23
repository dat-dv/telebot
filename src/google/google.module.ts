import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleAuthController } from './google-auth.controller';
import { GoogleAuthService } from './google-auth.service';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleTasksService } from './google-tasks.service';
import { UserTokenEntity } from '../database/entities/user-token.entity';
import { TokenEncryptionService } from './token-encryption.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserTokenEntity])],
  controllers: [GoogleAuthController],
  providers: [GoogleAuthService, GoogleCalendarService, GoogleTasksService, TokenEncryptionService],
  exports: [GoogleAuthService, GoogleCalendarService, GoogleTasksService],
})
export class GoogleModule {}
