import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPostgresPlaceAndContactUuidTypes1724700000000 implements MigrationInterface {
  name = 'FixPostgresPlaceAndContactUuidTypes1724700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        -- 1. Convert finance_places.id to uuid
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'finance_places' AND column_name = 'id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "finance_places" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "finance_places" ALTER COLUMN "id" TYPE uuid USING (
            CASE WHEN "id" IS NULL OR "id" = '' THEN gen_random_uuid() ELSE "id"::uuid END
          );
          ALTER TABLE "finance_places" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        END IF;

        -- 2. Convert debt_contacts.id to uuid
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debt_contacts' AND column_name = 'id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debt_contacts" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "debt_contacts" ALTER COLUMN "id" TYPE uuid USING (
            CASE WHEN "id" IS NULL OR "id" = '' THEN gen_random_uuid() ELSE "id"::uuid END
          );
          ALTER TABLE "debt_contacts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        END IF;

        -- 3. Convert finance_transactions.id to uuid
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'finance_transactions' AND column_name = 'id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "finance_transactions" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "finance_transactions" ALTER COLUMN "id" TYPE uuid USING (
            CASE WHEN "id" IS NULL OR "id" = '' THEN gen_random_uuid() ELSE "id"::uuid END
          );
          ALTER TABLE "finance_transactions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        END IF;

        -- 4. Convert debts.id to uuid
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debts' AND column_name = 'id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debts" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "debts" ALTER COLUMN "id" TYPE uuid USING (
            CASE WHEN "id" IS NULL OR "id" = '' THEN gen_random_uuid() ELSE "id"::uuid END
          );
          ALTER TABLE "debts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        END IF;

        -- 5. Convert debt_payments.id to uuid
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debt_payments' AND column_name = 'id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debt_payments" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "debt_payments" ALTER COLUMN "id" TYPE uuid USING (
            CASE WHEN "id" IS NULL OR "id" = '' THEN gen_random_uuid() ELSE "id"::uuid END
          );
          ALTER TABLE "debt_payments" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        END IF;

        -- 6. Convert reminders.id to uuid
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'reminders' AND column_name = 'id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "reminders" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "reminders" ALTER COLUMN "id" TYPE uuid USING (
            CASE WHEN "id" IS NULL OR "id" = '' THEN gen_random_uuid() ELSE "id"::uuid END
          );
          ALTER TABLE "reminders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        END IF;

        -- 7. Convert user_categories.id to uuid
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'user_categories' AND column_name = 'id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "user_categories" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "user_categories" ALTER COLUMN "id" TYPE uuid USING (
            CASE WHEN "id" IS NULL OR "id" = '' THEN gen_random_uuid() ELSE "id"::uuid END
          );
          ALTER TABLE "user_categories" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        END IF;

        -- 8. Convert foreign key columns to uuid
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'finance_transactions' AND column_name = 'place_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "finance_transactions" ALTER COLUMN "place_id" TYPE uuid USING (
            CASE WHEN "place_id" IS NULL OR "place_id" = '' THEN NULL ELSE "place_id"::uuid END
          );
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'finance_transactions' AND column_name = 'contact_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "finance_transactions" ALTER COLUMN "contact_id" TYPE uuid USING (
            CASE WHEN "contact_id" IS NULL OR "contact_id" = '' THEN NULL ELSE "contact_id"::uuid END
          );
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debts' AND column_name = 'contact_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debts" ALTER COLUMN "contact_id" TYPE uuid USING (
            CASE WHEN "contact_id" IS NULL OR "contact_id" = '' THEN NULL ELSE "contact_id"::uuid END
          );
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debts' AND column_name = 'parent_debt_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debts" ALTER COLUMN "parent_debt_id" TYPE uuid USING (
            CASE WHEN "parent_debt_id" IS NULL OR "parent_debt_id" = '' THEN NULL ELSE "parent_debt_id"::uuid END
          );
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debt_payments' AND column_name = 'debt_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debt_payments" ALTER COLUMN "debt_id" TYPE uuid USING (
            CASE WHEN "debt_id" IS NULL OR "debt_id" = '' THEN NULL ELSE "debt_id"::uuid END
          );
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debt_payments' AND column_name = 'finance_transaction_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debt_payments" ALTER COLUMN "finance_transaction_id" TYPE uuid USING (
            CASE WHEN "finance_transaction_id" IS NULL OR "finance_transaction_id" = '' THEN NULL ELSE "finance_transaction_id"::uuid END
          );
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debt_payment_allocations' AND column_name = 'id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debt_payment_allocations" ALTER COLUMN "id" DROP DEFAULT;
          ALTER TABLE "debt_payment_allocations" ALTER COLUMN "id" TYPE uuid USING (
            CASE WHEN "id" IS NULL OR "id" = '' THEN gen_random_uuid() ELSE "id"::uuid END
          );
          ALTER TABLE "debt_payment_allocations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debt_payment_allocations' AND column_name = 'finance_transaction_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debt_payment_allocations" ALTER COLUMN "finance_transaction_id" TYPE uuid USING (
            CASE WHEN "finance_transaction_id" IS NULL OR "finance_transaction_id" = '' THEN NULL ELSE "finance_transaction_id"::uuid END
          );
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debt_payment_allocations' AND column_name = 'debt_id' AND data_type = 'character varying'
        ) THEN
          ALTER TABLE "debt_payment_allocations" ALTER COLUMN "debt_id" TYPE uuid USING (
            CASE WHEN "debt_id" IS NULL OR "debt_id" = '' THEN NULL ELSE "debt_id"::uuid END
          );
        END IF;
      END $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Non-destructive down: preserve data and types
  }
}
