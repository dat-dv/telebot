import { Module } from '@nestjs/common';
import { GoogleModule } from '../google/google.module';
import { UsersModule } from '../users/users.module';
import { RemindersModule } from '../reminders/reminders.module';
import { GeminiService } from './gemini.service';
import { CreateCalendarTool } from './tools/create-calendar.tool';
import { ListCalendarTool } from './tools/list-calendar.tool';
import { DeleteCalendarTool } from './tools/delete-calendar.tool';
import { CreateTaskTool } from './tools/create-task.tool';
import { ListTasksTool } from './tools/list-tasks.tool';
import { CompleteTaskTool } from './tools/complete-task.tool';
import { LoginGoogleTool } from './tools/login-google.tool';
import { InviteUserTool } from './tools/invite-user.tool';
import { ListUsersTool } from './tools/list-users.tool';
import { BanUserTool } from './tools/ban-user.tool';
import { CreateReminderTool } from './tools/create-reminder.tool';
import { ListRemindersTool } from './tools/list-reminders.tool';
import { DeleteReminderTool } from './tools/delete-reminder.tool';

@Module({
  imports: [GoogleModule, UsersModule, RemindersModule],
  providers: [
    GeminiService,
    CreateCalendarTool,
    ListCalendarTool,
    DeleteCalendarTool,
    CreateTaskTool,
    ListTasksTool,
    CompleteTaskTool,
    LoginGoogleTool,
    InviteUserTool,
    ListUsersTool,
    BanUserTool,
    CreateReminderTool,
    ListRemindersTool,
    DeleteReminderTool,
  ],
  exports: [GeminiService],
})
export class GeminiModule {}
