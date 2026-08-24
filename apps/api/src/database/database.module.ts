import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { UserEntity } from './entities/user.entity';
import { InviteEntity } from './entities/invite.entity';
import { UserTokenEntity } from './entities/user-token.entity';
import { ReminderEntity } from './entities/reminder.entity';
import { FinanceTransactionEntity } from './entities/finance-transaction.entity';
import { DebtEntity } from './entities/debt.entity';
import { DebtContactEntity } from './entities/debt-contact.entity';
import { DebtPaymentEntity } from './entities/debt-payment.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { DashboardExchangeTokenEntity } from './entities/dashboard-exchange-token.entity';
import { UserCategoryEntity } from './entities/user-category.entity';
import { AuditLogSubscriber } from './audit-log.subscriber';
import { fromProjectRoot } from '../config/project-root';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const databaseUrl = process.env.DATABASE_URL?.trim();
        const databaseSsl = process.env.DATABASE_SSL?.trim().toLowerCase() === 'true';
        const synchronize = process.env.TYPEORM_SYNCHRONIZE?.trim().toLowerCase() === 'true';
        const entities = [
          UserEntity,
          InviteEntity,
          UserTokenEntity,
          ReminderEntity,
          FinanceTransactionEntity,
          DebtEntity,
          DebtContactEntity,
          DebtPaymentEntity,
          AuditLogEntity,
          DashboardExchangeTokenEntity,
          UserCategoryEntity,
        ];

        if (databaseUrl) {
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            ssl: databaseSsl ? { rejectUnauthorized: false } : false,
            entities,
            subscribers: [AuditLogSubscriber],
            synchronize,
            logging: false,
          };
        }

        const dataDir = fromProjectRoot('data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const dbPath = path.join(dataDir, 'telebot.sqlite');
        return {
          type: 'better-sqlite3',
          database: dbPath,
          entities,
          subscribers: [AuditLogSubscriber],
          synchronize: true,
          logging: false,
        };
      },
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      InviteEntity,
      UserTokenEntity,
      ReminderEntity,
      FinanceTransactionEntity,
      DebtEntity,
      DebtContactEntity,
      DebtPaymentEntity,
      AuditLogEntity,
      DashboardExchangeTokenEntity,
      UserCategoryEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
