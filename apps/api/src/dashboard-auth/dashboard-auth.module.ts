import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ReportsTokenService } from '../reports/reports-token.service';

@Module({
  imports: [DatabaseModule],
  providers: [ReportsTokenService],
  exports: [ReportsTokenService],
})
export class DashboardAuthModule {}
