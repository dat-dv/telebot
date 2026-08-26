import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDebtPaymentAllocations1724670000000 implements MigrationInterface {
  name = 'CreateDebtPaymentAllocations1724670000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "debt_payment_allocations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" character varying NOT NULL,
        "finance_transaction_id" character varying NOT NULL,
        "debt_id" character varying NOT NULL,
        "amount" integer NOT NULL,
        "allocated_at" TIMESTAMP NOT NULL,
        "note" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_debt_payment_allocations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_debt_payment_allocations_transaction" FOREIGN KEY ("finance_transaction_id") REFERENCES "finance_transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_debt_payment_allocations_debt" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_debt_payment_allocations_user_id" ON "debt_payment_allocations" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_debt_payment_allocations_finance_transaction_id" ON "debt_payment_allocations" ("finance_transaction_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_debt_payment_allocations_debt_id" ON "debt_payment_allocations" ("debt_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "debt_payments"
      ADD COLUMN IF NOT EXISTS "finance_transaction_id" character varying
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_debt_payments_finance_transaction_id" ON "debt_payments" ("finance_transaction_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_debt_payments_finance_transaction_id"`);
    await queryRunner.query(
      `ALTER TABLE "debt_payments" DROP COLUMN IF EXISTS "finance_transaction_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "debt_payment_allocations"`);
  }
}
