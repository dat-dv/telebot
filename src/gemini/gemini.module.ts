import { Module } from '@nestjs/common';
import { GoogleModule } from '../google/google.module';
import { GeminiService } from './gemini.service';
import { CreateCalendarTool } from './tools/create-calendar.tool';
import { ListCalendarTool } from './tools/list-calendar.tool';
import { DeleteCalendarTool } from './tools/delete-calendar.tool';
import { CreateTaskTool } from './tools/create-task.tool';
import { ListTasksTool } from './tools/list-tasks.tool';
import { CompleteTaskTool } from './tools/complete-task.tool';

@Module({
  imports: [GoogleModule],
  providers: [
    GeminiService,
    CreateCalendarTool,
    ListCalendarTool,
    DeleteCalendarTool,
    CreateTaskTool,
    ListTasksTool,
    CompleteTaskTool,
  ],
  exports: [GeminiService],
})
export class GeminiModule {}
