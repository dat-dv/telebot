import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentDebtHierarchy1724680000000 implements MigrationInterface {
  name = 'AddParentDebtHierarchy1724680000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'debts' AND column_name = 'id' AND data_type = 'uuid'
        ) THEN
          ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "parent_debt_id" uuid;
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'debts' AND column_name = 'parent_debt_id' AND data_type = 'character varying'
          ) THEN
            ALTER TABLE "debts" ALTER COLUMN "parent_debt_id" TYPE uuid USING (
              CASE WHEN "parent_debt_id" IS NULL OR "parent_debt_id" = '' THEN NULL ELSE "parent_debt_id"::uuid END
            );
          END IF;
        ELSE
          ALTER TABLE "debts" ADD COLUMN IF NOT EXISTS "parent_debt_id" character varying;
        END IF;
      END $$;
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
