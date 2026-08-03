-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "menuBoardImages" TEXT[] DEFAULT ARRAY[]::TEXT[];
