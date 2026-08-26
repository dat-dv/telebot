import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1724650000000 implements MigrationInterface {
  name = 'InitSchema1724650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 2. Users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" character varying NOT NULL,
        "username" character varying,
        "firstName" character varying,
        "role" character varying NOT NULL DEFAULT 'user',
        "preferredLocale" character varying NOT NULL DEFAULT 'vi',
        "timezone" character varying NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
        "phone_number" character varying,
        "avatar_url" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    // 3. User tokens table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_tokens" (
        "userId" character varying NOT NULL,
        "accessToken" text,
        "refreshToken" text,
        "scope" text,
        "tokenType" character varying,
        "expiryDate" bigint,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_tokens_userId" PRIMARY KEY ("userId")
      )
    `);

    // 4. Invites table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invites" (
        "code" character varying NOT NULL,
        "createdBy" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "expiresAt" character varying NOT NULL,
        "usedBy" character varying,
        "usedAt" character varying,
        CONSTRAINT "PK_invites_code" PRIMARY KEY ("code")
      )
    `);

    // 5. Reminders table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reminders" (
        "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
        "user_id" character varying NOT NULL,
        "title" character varying NOT NULL,
        "remind_at" TIMESTAMP NOT NULL,
        "is_triggered" boolean NOT NULL DEFAULT false,
        "status" character varying NOT NULL DEFAULT 'pending',
        "snooze_count" integer NOT NULL DEFAULT 0,
        "snoozed_until" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "notify_type" character varying NOT NULL DEFAULT 'text',
        "repeat_type" character varying NOT NULL DEFAULT 'none',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reminders_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reminders_user_id" ON "reminders" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reminders_remind_at" ON "reminders" ("remind_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reminders_is_triggered" ON "reminders" ("is_triggered")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reminders_status" ON "reminders" ("status")`,
    );

    // 6. Debt contacts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "debt_contacts" (
        "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
        "user_id" character varying NOT NULL,
        "display_name" character varying NOT NULL,
        "alias" character varying,
        "normalized_name" character varying NOT NULL,
        "normalized_alias" character varying,
        "descriptor" character varying,
        "phone_number" character varying,
        "bank_account_number" character varying,
        "bank_code" character varying,
        "bank_name" character varying,
        "avatar_url" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_debt_contacts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_debt_contacts_user_id" ON "debt_contacts" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_debt_contacts_normalized_name" ON "debt_contacts" ("normalized_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_debt_contacts_normalized_alias" ON "debt_contacts" ("normalized_alias")`,
    );

    // 7. Finance places table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance_places" (
        "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
        "user_id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "normalized_name" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_places_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_places_user_id" ON "finance_places" ("user_id")`,
    );

    // 8. Finance transactions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "finance_transactions" (
        "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
        "user_id" character varying NOT NULL,
        "type" character varying NOT NULL,
        "amount" integer NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'VND',
        "category" character varying NOT NULL DEFAULT 'Khác',
        "payment_method" character varying,
        "receipt_url" character varying,
        "contact_id" character varying,
        "place_id" character varying,
        "note" character varying NOT NULL,
        "occurred_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_finance_transactions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "finance_transactions" ADD COLUMN IF NOT EXISTS "contact_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "finance_transactions" ADD COLUMN IF NOT EXISTS "place_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "finance_transactions" ADD COLUMN IF NOT EXISTS "payment_method" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "finance_transactions" ADD COLUMN IF NOT EXISTS "receipt_url" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "finance_transactions" ADD COLUMN IF NOT EXISTS "currency" character varying DEFAULT 'VND'`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_transactions_user_id" ON "finance_transactions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_transactions_contact_id" ON "finance_transactions" ("contact_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_transactions_place_id" ON "finance_transactions" ("place_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_finance_transactions_occurred_at" ON "finance_transactions" ("occurred_at")`,
    );

    // 9. Debts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "debts" (
        "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
        "user_id" character varying NOT NULL,
        "contact_id" character varying,
        "direction" character varying NOT NULL,
        "counterparty" character varying NOT NULL,
        "counterparty_alias" character varying,
        "original_amount" integer NOT NULL,
        "remaining_amount" integer NOT NULL,
        "currency" character varying NOT NULL DEFAULT 'VND',
        "note" character varying NOT NULL DEFAULT '',
        "status" character varying NOT NULL DEFAULT 'active',
        "due_at" TIMESTAMP,
        "settled_at" TIMESTAMP,
        "occurred_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_debts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "contact_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "counterparty_alias" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "currency" character varying DEFAULT 'VND'`,
    );
    await queryRunner.query(
      `ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "status" character varying DEFAULT 'active'`,
    );
    await queryRunner.query(`ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "due_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "settled_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "occurred_at" TIMESTAMP`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_debts_user_id" ON "debts" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_debts_contact_id" ON "debts" ("contact_id")`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_debts_status" ON "debts" ("status")`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_debts_occurred_at" ON "debts" ("occurred_at")`,
    );
    await queryRunner.query(`UPDATE "debts" SET "created_at" = now() WHERE "created_at" IS NULL`);
    await queryRunner.query(
      `UPDATE "debts" SET "occurred_at" = "created_at" WHERE "occurred_at" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "finance_transactions" SET "created_at" = now() WHERE "created_at" IS NULL`,
    );

    // 10. Debt payments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "debt_payments" (
        "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
        "debt_id" character varying NOT NULL,
        "user_id" character varying NOT NULL,
        "amount" integer NOT NULL,
        "payment_date" TIMESTAMP NOT NULL,
        "note" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_debt_payments_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_debt_payments_debt_id" ON "debt_payments" ("debt_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_debt_payments_user_id" ON "debt_payments" ("user_id")`,
    );

    // 11. Audit logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
        "table_name" character varying NOT NULL,
        "record_id" character varying,
        "action" character varying NOT NULL,
        "actor_id" character varying,
        "before_data" text,
        "after_data" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_table_name" ON "audit_logs" ("table_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_record_id" ON "audit_logs" ("record_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_actor_id" ON "audit_logs" ("actor_id")`,
    );

    // 12. Dashboard exchange tokens table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dashboard_exchange_tokens" (
        "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
        "token_hash" character varying NOT NULL,
        "user_id" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "consumed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dashboard_exchange_tokens_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_dashboard_exchange_tokens_hash" ON "dashboard_exchange_tokens" ("token_hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_dashboard_exchange_tokens_user_id" ON "dashboard_exchange_tokens" ("user_id")`,
    );

    // 13. User categories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_categories" (
        "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
        "user_id" character varying NOT NULL,
        "type" character varying NOT NULL,
        "name" character varying NOT NULL,
        "color" character varying,
        "icon" character varying,
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_categories_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_categories_user_id" ON "user_categories" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_categories_type" ON "user_categories" ("type")`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Non-destructive down: keep data intact
  }
}
