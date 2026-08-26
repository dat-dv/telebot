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
import { CreateFinanceTransactionsTool } from './tools/create-finance-transactions.tool';
import { UpdateFinanceTransactionTool } from './tools/update-finance-transaction.tool';
import { GetFinanceSummaryTool } from './tools/get-finance-summary.tool';
import { CreateDebtTool } from './tools/create-debt.tool';
import { ListDebtsTool } from './tools/list-debts.tool';
import { RecordDebtPaymentTool } from './tools/record-debt-payment.tool';
import { ResolveDebtContactTool } from './tools/resolve-debt-contact.tool';
import { UpdateDebtContactTool } from './tools/update-debt-contact.tool';
import { ResolveFinancePlaceTool } from './tools/resolve-finance-place.tool';
import { CreateFinancePlaceTool } from './tools/create-finance-place.tool';
import { UpdateReminderTool } from './tools/update-reminder.tool';
import { ConversationHistoryService } from './services/conversation-history.service';

@Module({
  imports: [GoogleModule, UsersModule, RemindersModule, FinanceModule],
  providers: [
    GeminiService,
    ConversationHistoryService,
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
    CreateFinanceTransactionsTool,
    UpdateFinanceTransactionTool,
    GetFinanceSummaryTool,
    CreateDebtTool,
    ListDebtsTool,
    RecordDebtPaymentTool,
    ResolveDebtContactTool,
    UpdateDebtContactTool,
    ResolveFinancePlaceTool,
    CreateFinancePlaceTool,
    UpdateReminderTool,
  ],
  exports: [GeminiService, ConversationHistoryService],
})
export class GeminiModule {}
