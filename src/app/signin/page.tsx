import Link from 'next/link';
import { Lockup } from '@/components/Lockup';
import { authEnabled } from '@/lib/supabase/server';
import { SignInButton } from './SignInButton';

export const dynamic = 'force-dynamic';

export default async function SignIn({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const sp = await searchParams;
  const enabled = authEnabled();
  return (
    <div className="signin">
      <div className="sicard">
        <Lockup size={44} />
        <h1>Private corporate-development instrument</h1>
        <p>One user. Public information and your own notes only.</p>
        {sp.denied ? <p className="sierr">That Google account is not the owner of this BirdNest. Sign out and try the owner account.</p> : null}
        {enabled ? <SignInButton denied={!!sp.denied} /> : <Link className="primary sibtn" href="/">Sign-in is off · open the Hub</Link>}
        <span className="mfootl">BIRDNEST · NDIII</span>
      </div>
    </div>
  );
}
