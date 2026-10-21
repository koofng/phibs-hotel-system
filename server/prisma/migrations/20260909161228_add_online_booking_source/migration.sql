-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('STAFF', 'ONLINE');

-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_createdById_fkey";

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "preferredPaymentMethod" "PaymentMethod",
ADD COLUMN     "source" "ReservationSource" NOT NULL DEFAULT 'STAFF',
ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
