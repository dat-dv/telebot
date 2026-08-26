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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_debts_parent_debt_id"`);
    await queryRunner.query(`ALTER TABLE "debts" DROP COLUMN IF EXISTS "parent_debt_id"`);
  }
}
