-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paymentDetails" TEXT,
ADD COLUMN     "paymentOwner" TEXT,
ADD COLUMN     "paymentTiming" TIMESTAMP(3);
