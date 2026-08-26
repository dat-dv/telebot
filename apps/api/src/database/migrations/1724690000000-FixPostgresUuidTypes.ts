import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPostgresUuidTypes1724690000000 implements MigrationInterface {
  name = 'FixPostgresUuidTypes1724690000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        -- Check if debts.id is uuid (indicating database uses PostgreSQL native UUID types)
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debts' AND column_name = 'id' AND data_type = 'uuid'
        ) THEN
          -- 1. Fix debts.parent_debt_id to match debts.id (uuid)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'debts' AND column_name = 'parent_debt_id' AND data_type = 'character varying'
          ) THEN
            ALTER TABLE "debts" ALTER COLUMN "parent_debt_id" TYPE uuid USING (
              CASE WHEN "parent_debt_id" IS NULL OR "parent_debt_id" = '' THEN NULL ELSE "parent_debt_id"::uuid END
            );
          END IF;

          -- 2. Fix debts.contact_id if character varying
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'debts' AND column_name = 'contact_id' AND data_type = 'character varying'
          ) THEN
            ALTER TABLE "debts" ALTER COLUMN "contact_id" TYPE uuid USING (
              CASE WHEN "contact_id" IS NULL OR "contact_id" = '' THEN NULL ELSE "contact_id"::uuid END
            );
          END IF;

          -- 3. Fix debt_payments.finance_transaction_id to match finance_transactions.id (uuid)
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'debt_payments' AND column_name = 'finance_transaction_id' AND data_type = 'character varying'
          ) THEN
            ALTER TABLE "debt_payments" ALTER COLUMN "finance_transaction_id" TYPE uuid USING (
              CASE WHEN "finance_transaction_id" IS NULL OR "finance_transaction_id" = '' THEN NULL ELSE "finance_transaction_id"::uuid END
            );
          END IF;

          -- 4. Fix debt_payments.debt_id if character varying
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'debt_payments' AND column_name = 'debt_id' AND data_type = 'character varying'
          ) THEN
            ALTER TABLE "debt_payments" ALTER COLUMN "debt_id" TYPE uuid USING (
              CASE WHEN "debt_id" IS NULL OR "debt_id" = '' THEN NULL ELSE "debt_id"::uuid END
            );
          END IF;

          -- 5. Fix finance_transactions.contact_id if character varying
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'finance_transactions' AND column_name = 'contact_id' AND data_type = 'character varying'
          ) THEN
            ALTER TABLE "finance_transactions" ALTER COLUMN "contact_id" TYPE uuid USING (
              CASE WHEN "contact_id" IS NULL OR "contact_id" = '' THEN NULL ELSE "contact_id"::uuid END
            );
          END IF;

          -- 6. Fix finance_transactions.place_id if character varying
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'finance_transactions' AND column_name = 'place_id' AND data_type = 'character varying'
          ) THEN
            ALTER TABLE "finance_transactions" ALTER COLUMN "place_id" TYPE uuid USING (
              CASE WHEN "place_id" IS NULL OR "place_id" = '' THEN NULL ELSE "place_id"::uuid END
            );
          END IF;

          -- 7. Drop and recreate debt_payment_allocations cleanly with native uuid types
          DROP TABLE IF EXISTS "debt_payment_allocations" CASCADE;

          CREATE TABLE "debt_payment_allocations" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(),
            "user_id" character varying NOT NULL,
            "finance_transaction_id" uuid NOT NULL,
            "debt_id" uuid NOT NULL,
            "amount" integer NOT NULL,
            "allocated_at" TIMESTAMP NOT NULL,
            "note" character varying,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_debt_payment_allocations_id" PRIMARY KEY ("id")
          );

          CREATE INDEX IF NOT EXISTS "IDX_debt_payment_allocations_user_id" ON "debt_payment_allocations" ("user_id");
          CREATE INDEX IF NOT EXISTS "IDX_debt_payment_allocations_finance_transaction_id" ON "debt_payment_allocations" ("finance_transaction_id");
          CREATE INDEX IF NOT EXISTS "IDX_debt_payment_allocations_debt_id" ON "debt_payment_allocations" ("debt_id");
        ELSE
          -- Fallback for non-uuid schema
          CREATE TABLE IF NOT EXISTS "debt_payment_allocations" (
            "id" character varying NOT NULL DEFAULT gen_random_uuid()::text,
            "user_id" character varying NOT NULL,
            "finance_transaction_id" character varying NOT NULL,
            "debt_id" character varying NOT NULL,
            "amount" integer NOT NULL,
            "allocated_at" TIMESTAMP NOT NULL,
            "note" character varying,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_debt_payment_allocations_id" PRIMARY KEY ("id")
          );

          CREATE INDEX IF NOT EXISTS "IDX_debt_payment_allocations_user_id" ON "debt_payment_allocations" ("user_id");
          CREATE INDEX IF NOT EXISTS "IDX_debt_payment_allocations_finance_transaction_id" ON "debt_payment_allocations" ("finance_transaction_id");
          CREATE INDEX IF NOT EXISTS "IDX_debt_payment_allocations_debt_id" ON "debt_payment_allocations" ("debt_id");
        END IF;
      END $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Non-destructive down: preserve data and types
  }
}
