-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'seeking',
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "cdisp" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT 'Americas',
    "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lon" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'Drug',
    "seg" TEXT NOT NULL DEFAULT 'Posterior',
    "ind" TEXT NOT NULL DEFAULT '',
    "asset" TEXT NOT NULL DEFAULT '',
    "phase" TEXT NOT NULL DEFAULT 'Preclinical',
    "phaseLabel" TEXT NOT NULL DEFAULT 'Preclinical',
    "trend" INTEGER NOT NULL DEFAULT 0,
    "dec" TEXT NOT NULL DEFAULT 'Watch',
    "deal" INTEGER NOT NULL DEFAULT 0,
    "cat" TEXT NOT NULL DEFAULT '',
    "runway" INTEGER,
    "runwayAsOf" DATE,
    "raise" TEXT NOT NULL DEFAULT '',
    "rightsArr" JSONB NOT NULL DEFAULT '[true,true,true,true,true,true]',
    "own" TEXT NOT NULL DEFAULT 'Private',
    "founded" TEXT NOT NULL DEFAULT '',
    "heads" TEXT NOT NULL DEFAULT '',
    "rationale" TEXT NOT NULL DEFAULT '',
    "scores" JSONB NOT NULL DEFAULT '[3,3,3,3,3,3]',
    "why" JSONB NOT NULL DEFAULT '["","","","","",""]',
    "svcScores" JSONB NOT NULL DEFAULT '[3,3,3,3,3]',
    "svcWhy" JSONB NOT NULL DEFAULT '["","","","",""]',
    "prevFit" INTEGER NOT NULL DEFAULT 60,
    "fit" INTEGER NOT NULL DEFAULT 60,
    "logo" TEXT,
    "appetite" TEXT NOT NULL DEFAULT '',
    "scale" TEXT NOT NULL DEFAULT '',
    "lens" TEXT NOT NULL DEFAULT 'partnering',
    "ai" JSONB,
    "buyBox" JSONB,
    "sample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Note',
    "text" TEXT NOT NULL,
    "priv" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intro" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Introduced',
    "note" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Intro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Company_kind_idx" ON "Company"("kind");

-- CreateIndex
CREATE INDEX "Company_region_idx" ON "Company"("region");

-- CreateIndex
CREATE INDEX "Note_companyId_date_idx" ON "Note"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Intro_buyerId_sellerId_key" ON "Intro"("buyerId", "sellerId");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intro" ADD CONSTRAINT "Intro_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intro" ADD CONSTRAINT "Intro_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
