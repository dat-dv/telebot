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
import { AuditLogEntity } from './entities/audit-log.entity';
import { AuditLogSubscriber } from './audit-log.subscriber';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dataDir = path.resolve(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const dbPath = path.join(dataDir, 'telebot.sqlite');
        return {
          type: 'better-sqlite3',
          database: dbPath,
          entities: [
            UserEntity,
            InviteEntity,
            UserTokenEntity,
            ReminderEntity,
            FinanceTransactionEntity,
            DebtEntity,
            DebtContactEntity,
            AuditLogEntity,
          ],
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
      AuditLogEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
