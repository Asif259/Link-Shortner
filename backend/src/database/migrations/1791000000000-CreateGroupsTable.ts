import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGroupsTable1791000000000 implements MigrationInterface {
  name = 'CreateGroupsTable1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "groups" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_groups_user_id" ON "groups"("user_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "group_id" UUID REFERENCES "groups"("id") ON DELETE SET NULL`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_links_group_id" ON "links"("group_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_links_group_id"`);
    await queryRunner.query(`ALTER TABLE "links" DROP COLUMN IF EXISTS "group_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_groups_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "groups"`);
  }
}
