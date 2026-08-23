import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { AuditModule } from '../audit/audit.module';
import { GoogleModule } from '../google/google.module';
import { RemindersModule } from '../reminders/reminders.module';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../database/database.module';
import { ReportsController } from './reports.controller';
import { DashboardAuthModule } from '../dashboard-auth/dashboard-auth.module';
@Module({
  imports: [
    DatabaseModule,
    DashboardAuthModule,
    FinanceModule,
    AuditModule,
    GoogleModule,
    RemindersModule,
    UsersModule,
  ],
  controllers: [ReportsController],
  providers: [],
})
export class ReportsModule {}
