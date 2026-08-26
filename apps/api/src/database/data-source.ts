import { DataSource } from 'typeorm';
import { config as loadDotenv } from 'dotenv';
import { fromProjectRoot } from '../config/project-root';
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
import { FinancePlaceEntity } from './entities/finance-place.entity';
import { AuditLogSubscriber } from './audit-log.subscriber';
import { InitSchema1724650000000 } from './migrations/1724650000000-InitSchema';
import { MigrateLegacyPlaceContacts1724660000000 } from './migrations/1724660000000-MigrateLegacyPlaceContacts';

// Load environment variables for TypeORM CLI
loadDotenv({ path: fromProjectRoot('.env.local') });
loadDotenv({ path: fromProjectRoot('.env') });

const databaseUrl = (
  process.env.DATABASE_URL || 'postgresql://telebot:telebot@localhost:5432/telebot'
).trim();
const databaseSsl = process.env.DATABASE_SSL?.trim().toLowerCase() === 'true';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: databaseSsl ? { rejectUnauthorized: false } : false,
  entities: [
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
    FinancePlaceEntity,
  ],
  subscribers: [AuditLogSubscriber],
  migrations: [InitSchema1724650000000, MigrateLegacyPlaceContacts1724660000000],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});

export default AppDataSource;
