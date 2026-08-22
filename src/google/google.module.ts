import { Module } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleTasksService } from './google-tasks.service';

@Module({
  providers: [GoogleAuthService, GoogleCalendarService, GoogleTasksService],
  exports: [GoogleAuthService, GoogleCalendarService, GoogleTasksService],
})
export class GoogleModule {}
