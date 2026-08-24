require('reflect-metadata');

const { DataSource } = require('typeorm');
const { UserEntity } = require('../dist/database/entities/user.entity');
const { InviteEntity } = require('../dist/database/entities/invite.entity');
const { UserTokenEntity } = require('../dist/database/entities/user-token.entity');
const { ReminderEntity } = require('../dist/database/entities/reminder.entity');
const { FinanceTransactionEntity } = require('../dist/database/entities/finance-transaction.entity');
const { DebtEntity } = require('../dist/database/entities/debt.entity');
const { DebtContactEntity } = require('../dist/database/entities/debt-contact.entity');
const { DebtPaymentEntity } = require('../dist/database/entities/debt-payment.entity');
const { AuditLogEntity } = require('../dist/database/entities/audit-log.entity');
const {
  DashboardExchangeTokenEntity,
} = require('../dist/database/entities/dashboard-exchange-token.entity');
const { UserCategoryEntity } = require('../dist/database/entities/user-category.entity');

const entities = [
  UserEntity,
  InviteEntity,
  UserTokenEntity,
  ReminderEntity,
  FinanceTransactionEntity,
  DebtContactEntity,
  DebtEntity,
  DebtPaymentEntity,
  AuditLogEntity,
  DashboardExchangeTokenEntity,
  UserCategoryEntity,
];

function required(name) {
  const value = process.env[name] && process.env[name].trim();
  if (!value) throw new Error(`${name} must be set before migration.`);
  return value;
}

async function copyEntity(source, targetManager, entity) {
  const sourceRepository = source.getRepository(entity);
  const targetRepository = targetManager.getRepository(entity);
  const rows = await sourceRepository.find();
  const targetCount = await targetRepository.count();
  const tableName = sourceRepository.metadata.tableName;

  if (targetCount > 0 && process.env.MIGRATION_ALLOW_NONEMPTY !== 'true') {
    throw new Error(
      `${tableName} already contains ${targetCount} record(s). Refusing to overwrite a non-empty PostgreSQL target.`,
    );
  }

  if (rows.length > 0) await targetRepository.save(rows, { chunk: 100 });

  const copiedCount = await targetRepository.count();
  if (copiedCount < rows.length) {
    throw new Error(`${tableName}: copied ${copiedCount} records but expected at least ${rows.length}.`);
  }
  console.log(`✓ ${tableName}: ${rows.length} record(s) copied.`);
}

async function main() {
  if (process.env.MIGRATION_CREATE_SCHEMA !== 'true') {
    throw new Error('Set MIGRATION_CREATE_SCHEMA=true for the initial migration to an empty PostgreSQL database.');
  }

  const source = new DataSource({
    type: 'better-sqlite3',
    database: process.env.SQLITE_SOURCE_PATH || '/app/data/telebot.sqlite',
    entities,
  });
  const target = new DataSource({
    type: 'postgres',
    url: required('DATABASE_URL'),
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities,
  });

  await source.initialize();
  await target.initialize();
  try {
    await target.synchronize();
    await target.transaction(async (targetManager) => {
      for (const entity of entities) await copyEntity(source, targetManager, entity);
    });
    console.log('SQLite → PostgreSQL migration completed successfully.');
  } finally {
    await Promise.all([source.destroy(), target.destroy()]);
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
