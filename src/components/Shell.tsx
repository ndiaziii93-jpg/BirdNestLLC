'use client';
import { usePathname } from 'next/navigation';
import { StoreProvider } from '@/store/StoreProvider';
import { UiProvider } from '@/store/UiProvider';
import { SearchProvider } from '@/store/SearchProvider';
import { DashProvider } from '@/store/DashProvider';
import type { Dataset } from '@/lib/types';
import { TopBar } from './TopBar';
import { ModalHost } from './modals/ModalHost';
import { ErrorBar } from './ErrorBar';

export function Shell({ initial, signedIn, authOn, dbError, children }: { initial: Dataset; signedIn: boolean; authOn: boolean; dbError: string; children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith('/signin') || !signedIn) return <>{children}</>;
  return (
    <StoreProvider initial={initial} loadError={dbError}>
      <UiProvider>
        <SearchProvider>
        <DashProvider>
          <div className="app" id="app" data-view={path === '/' ? 'map' : path.slice(1)}>
            <TopBar />
            {dbError ? <div className="dberr"><b>Could not read your data.</b> Nothing has been lost; reload the page in a moment. If this keeps happening, send this to whoever maintains the Hub: <code>{dbError}</code></div> : null}
            {children}
            <div className="foot">BIRDNEST · NDIII{authOn ? <form action="/auth/signout" method="post" style={{ display: 'inline' }}><button className="signout">Sign out</button></form> : null}</div>
          </div>
          <ModalHost />
          <ErrorBar />
        </DashProvider>
        </SearchProvider>
      </UiProvider>
    </StoreProvider>
  );
}
