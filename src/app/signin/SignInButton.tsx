'use client';
import { useEffect, useState } from 'react';

export function SignInButton({ denied }: { denied: boolean }) {
  const [err, setErr] = useState('');
  // Errors that arrive after the # in the address never reach the server; show them here.
  useEffect(() => {
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const m = h.get('error_description') || h.get('error');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (m) setErr(m.replace(/\+/g, ' '));
  }, []);
  return (<>
    {err ? <p className="sierr">Could not start sign-in: {err}</p> : null}
    <a className="primary sibtn" href={denied ? '/auth/signin?switch=1' : '/auth/signin'}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="currentColor" opacity=".8" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="currentColor" opacity=".6" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="currentColor" opacity=".9" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"/></svg>
      {denied ? 'Sign out and try another account' : 'Sign in with Google'}
    </a>
  </>);
}
