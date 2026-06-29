-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'WITHDRAWN');

-- AlterTable: TEXT -> UserStatus enum
ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE "UserStatus" USING ("status"::"UserStatus");
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
