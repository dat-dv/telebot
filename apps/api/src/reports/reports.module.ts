import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { AuditModule } from '../audit/audit.module';
import { GoogleModule } from '../google/google.module';
import { RemindersModule } from '../reminders/reminders.module';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../database/database.module';
import { ReportsController } from './reports.controller';
import { ReportsTokenService } from './reports-token.service';
@Module({
  imports: [DatabaseModule, FinanceModule, AuditModule, GoogleModule, RemindersModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsTokenService],
  exports: [ReportsTokenService],
})
export class ReportsModule {}
