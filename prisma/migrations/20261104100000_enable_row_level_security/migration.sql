-- Lock the BirdNest tables against Supabase's public Data API.
-- The publishable (anon) key ships to the browser for sign-in; without row-level security, Supabase's
-- REST API would let anyone holding that key read and write these tables directly. With RLS on and no
-- policies, the anon and authenticated roles see nothing. The app is unaffected: Prisma connects as
-- the table owner, which bypasses RLS.
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Note" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Intro" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
