import { Module } from '@nestjs/common';
import { GoogleModule } from '../google/google.module';
import { UsersModule } from '../users/users.module';
import { RemindersModule } from '../reminders/reminders.module';
import { GeminiService } from './gemini.service';
import { CreateCalendarTool } from './tools/create-calendar.tool';
import { ListCalendarTool } from './tools/list-calendar.tool';
import { DeleteCalendarTool } from './tools/delete-calendar.tool';
import { CreateTaskTool } from './tools/create-task.tool';
import { CreateTasksTool } from './tools/create-tasks.tool';
import { ListTasksTool } from './tools/list-tasks.tool';
import { CompleteTaskTool } from './tools/complete-task.tool';
import { LoginGoogleTool } from './tools/login-google.tool';
import { InviteUserTool } from './tools/invite-user.tool';
import { ListUsersTool } from './tools/list-users.tool';
import { BanUserTool } from './tools/ban-user.tool';
import { CreateReminderTool } from './tools/create-reminder.tool';
import { ListRemindersTool } from './tools/list-reminders.tool';
import { DeleteReminderTool } from './tools/delete-reminder.tool';
import { FinanceModule } from '../finance/finance.module';
import { CreateFinanceTransactionTool } from './tools/create-finance-transaction.tool';
import { GetFinanceSummaryTool } from './tools/get-finance-summary.tool';
import { CreateDebtTool } from './tools/create-debt.tool';
import { ListDebtsTool } from './tools/list-debts.tool';
import { RecordDebtPaymentTool } from './tools/record-debt-payment.tool';
import { ResolveDebtContactTool } from './tools/resolve-debt-contact.tool';
import { UpdateDebtContactTool } from './tools/update-debt-contact.tool';
import { UpdateReminderTool } from './tools/update-reminder.tool';

@Module({
  imports: [GoogleModule, UsersModule, RemindersModule, FinanceModule],
  providers: [
    GeminiService,
    CreateCalendarTool,
    ListCalendarTool,
    DeleteCalendarTool,
    CreateTaskTool,
    CreateTasksTool,
    ListTasksTool,
    CompleteTaskTool,
    LoginGoogleTool,
    InviteUserTool,
    ListUsersTool,
    BanUserTool,
    CreateReminderTool,
    ListRemindersTool,
    DeleteReminderTool,
    CreateFinanceTransactionTool,
    GetFinanceSummaryTool,
    CreateDebtTool,
    ListDebtsTool,
    RecordDebtPaymentTool,
    ResolveDebtContactTool,
    UpdateDebtContactTool,
    UpdateReminderTool,
  ],
  exports: [GeminiService],
})
export class GeminiModule {}
