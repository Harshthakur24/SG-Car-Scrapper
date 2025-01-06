-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "adharCard" TEXT NOT NULL,
    "panCard" TEXT NOT NULL,
    "registrationCertificate" TEXT NOT NULL,
    "deathCertificate" TEXT,
    "cancelledCheck" TEXT NOT NULL,
    "challanSeizureMemo" TEXT NOT NULL,
    "isHypothecated" BOOLEAN NOT NULL,
    "hypothecationClearanceDoc" TEXT,
    "isRcLost" BOOLEAN NOT NULL,
    "rcLostDeclaration" TEXT,
    "vahanRegistrationLink" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verificationExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
