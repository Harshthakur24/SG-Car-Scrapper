-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "aadharNumber" TEXT NOT NULL,
    "adharCard" TEXT NOT NULL,
    "panCard" TEXT NOT NULL,
    "registrationCertificate" TEXT NOT NULL,
    "deathCertificate" TEXT,
    "cancelledCheck" TEXT NOT NULL,
    "challanSeizureMemo" TEXT NOT NULL,
    "hypothecationClearanceDoc" TEXT,
    "isHypothecated" BOOLEAN NOT NULL DEFAULT false,
    "isRcLost" BOOLEAN NOT NULL DEFAULT false,
    "rcLostDeclaration" TEXT,
    "vahanRegistrationLink" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "paymentDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_vehicleNumber_key" ON "User"("vehicleNumber");
