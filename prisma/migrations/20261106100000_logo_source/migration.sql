-- Where each company logo came from, so Claude-found logos can be checked by the owner.
ALTER TABLE "Company" ADD COLUMN "logoSource" TEXT;
ALTER TABLE "Company" ADD COLUMN "logoOrigin" TEXT;
ALTER TABLE "Company" ADD COLUMN "logoRejected" JSONB NOT NULL DEFAULT '[]';
-- Logos that already exist were mostly small favicons fetched automatically before this change.
-- List them for the owner to check: Right keeps one, Wrong lets Claude find a better one.
UPDATE "Company" SET "logoSource" = 'auto' WHERE "logo" IS NOT NULL AND "sample" = false;
