import type { Metadata, Viewport } from 'next';
import './prototype.css';
import './globals.css';
import { Shell } from '@/components/Shell';
import { loadDataset } from '@/lib/repo';
import { authEnabled, currentOwner } from '@/lib/supabase/server';
import type { Dataset } from '@/lib/types';
import { defaultSettings } from '@/lib/fit';
import { DEFAULT_ANT, DEFAULT_MET, DEFAULT_POST } from '@/lib/constants';

export const metadata: Metadata = { title: 'BirdNest · Hub', description: 'Private corporate-development instrument for ophthalmology BD.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const owner = await currentOwner();
  let data: Dataset = { companies: [], intros: [], settings: { ...defaultSettings(), post: [...DEFAULT_POST], ant: [...DEFAULT_ANT], met: [...DEFAULT_MET] } };
  let dbError = '';
  if (owner) {
    try { data = await loadDataset(); } catch (e) { dbError = e instanceof Error ? e.message : String(e); }
  }
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Shell initial={data} signedIn={!!owner} authOn={authEnabled()} dbError={dbError}>{children}</Shell>
      </body>
    </html>
  );
}
