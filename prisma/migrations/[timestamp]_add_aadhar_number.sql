-- AlterTable
ALTER TABLE "User" ADD COLUMN "aadharNumber" TEXT NOT NULL DEFAULT '';

-- After all existing records are migrated, you can remove the default
ALTER TABLE "User" ALTER COLUMN "aadharNumber" DROP DEFAULT; 