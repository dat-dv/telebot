import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleAuthService } from './google-auth.service';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleTasksService } from './google-tasks.service';
import { UserTokenEntity } from '../database/entities/user-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserTokenEntity])],
  providers: [GoogleAuthService, GoogleCalendarService, GoogleTasksService],
  exports: [GoogleAuthService, GoogleCalendarService, GoogleTasksService],
})
export class GoogleModule {}
