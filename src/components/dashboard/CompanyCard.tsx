'use client';
import { KIND } from '@/lib/constants';
import { dealName, lastTopic, lastTouch, rightsOpen } from '@/lib/derive';
import { fmtDate } from '@/lib/dates';
import { useStore } from '@/store/StoreProvider';
import { useUi } from '@/store/UiProvider';
import { Pill } from '../bits';
import { FitRing } from './FitRing';
import type { Company } from '@/lib/types';

export function CompanyCard({ d }: { d: Company }) {
  const ui = useUi();
  const { today } = useStore();
  const buyer = d.kind && d.kind !== 'seeking';
  const last = lastTouch(d, today);
  const topic = lastTopic(d).replace(/\.$/, '');
  return (
    <aside className="card" id="card">
      <div className="ch">
        <div className="n">
          <span className="cname">{d.name}</span><span className="sight" />
          <span className="cmeta">{d.city}, {d.cdisp} · {d.own}</span>
          <div className="pillrow"><Pill dec={d.dec} /><span className="kchip">{KIND[d.kind || 'seeking'].label}</span><span>{buyer ? d.seg + ' focus' : d.type + ' · ' + d.seg}</span></div>
        </div>
        <FitRing d={d} />
      </div>
      <div className="lead"><span>{d.kind === 'investor' ? 'Investment focus' : d.kind === 'pharma' ? 'Partnering focus' : 'Lead asset'}</span><b>{d.asset}</b></div>
      <div className="metrics">
        <div><span>{buyer ? 'Category' : d.type === 'Device' ? 'Device stage' : 'Clinical stage'}</span><b>{buyer ? KIND[d.kind].label : d.phaseLabel}</b></div>
        <div><span>Deal stage</span><b>{dealName(d)}</b></div>
        <div><span>{d.kind === 'investor' ? 'Check size' : d.kind === 'pharma' ? 'Deal appetite' : 'Rights open'}</span><b className={buyer ? '' : 'm'}>{buyer ? d.appetite || '—' : rightsOpen(d) + '/6'}</b></div>
        <div><span>{d.kind === 'investor' ? 'Stage focus' : d.kind === 'pharma' ? 'Revenue' : 'Runway' + (d.runwayAsOf ? ' · as of ' + fmtDate(d.runwayAsOf) : '')}</span><b className={buyer ? '' : 'm'}>{buyer ? d.scale || '—' : d.runway != null ? d.runway + ' mo' : '—'}</b></div>
        <div><span>{d.kind === 'investor' ? 'Fund' : d.kind === 'pharma' ? 'Recent ophthalmic deal' : 'Last raise'}</span><b>{d.raise || '—'}</b></div>
        <div><span>Last discussion{last < 999 ? ' · ' + last + 'd' : ''}</span><b>{topic}</b></div>
      </div>
      <div className="catbox"><span className="dia" /><span>Next catalyst · {d.cat || 'None set'}</span></div>
      <div className="cact">
        <button className="primary" style={{ flex: 1 }} onClick={() => ui.open({ kind: 'account', id: d.id })}>Open profile</button>
        <button className="sec" onClick={() => ui.open({ kind: 'export', id: d.id })}>Export one-pager</button>
      </div>
    </aside>
  );
}
