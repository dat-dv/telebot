import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceTransactionEntity } from '../database/entities/finance-transaction.entity';
import { DebtEntity } from '../database/entities/debt.entity';
import { DebtContactEntity } from '../database/entities/debt-contact.entity';
import { FinanceService } from './finance.service';

@Module({
  imports: [TypeOrmModule.forFeature([FinanceTransactionEntity, DebtEntity, DebtContactEntity])],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
