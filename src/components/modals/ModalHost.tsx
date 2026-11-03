'use client';
import { useUi } from '@/store/UiProvider';
import { ProfileSheet } from './ProfileSheet';
import { AccountSheet } from './AccountSheet';
import { MatrixSheet } from './MatrixSheet';
import { ExportSheet } from './ExportSheet';
import { AddSheet } from './AddSheet';
import { ListSheet } from './ListSheet';

export function ModalHost() {
  const { modals } = useUi();
  return (
    <>
      {modals.map((m, i) => {
        const key = m.kind + i;
        switch (m.kind) {
          case 'profile': return <ProfileSheet key={key} id={m.id} />;
          case 'new': return <ProfileSheet key={key} id={null} preset={m.preset} />;
          case 'account': return <AccountSheet key={key} id={m.id} />;
          case 'matrix': return <MatrixSheet key={key} id={m.id} hl={m.hl} />;
          case 'export': return <ExportSheet key={key} id={m.id} />;
          case 'add': return <AddSheet key={key} />;
          case 'list': return <ListSheet key={key} />;
        }
      })}
    </>
  );
}
