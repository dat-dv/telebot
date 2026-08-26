import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentDebtHierarchy1724680000000 implements MigrationInterface {
  name = 'AddParentDebtHierarchy1724680000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "debts"
      ADD COLUMN IF NOT EXISTS "parent_debt_id" character varying
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_debts_parent_debt_id" ON "debts" ("parent_debt_id")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_debts_parent_debt_id'
        ) THEN
          ALTER TABLE "debts"
          ADD CONSTRAINT "FK_debts_parent_debt_id"
          FOREIGN KEY ("parent_debt_id")
          REFERENCES "debts"("id")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "debts" DROP CONSTRAINT IF EXISTS "FK_debts_parent_debt_id"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_debts_parent_debt_id"`);
    await queryRunner.query(`ALTER TABLE "debts" DROP COLUMN IF EXISTS "parent_debt_id"`);
  }
}
