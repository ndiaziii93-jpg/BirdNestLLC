import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { extractCandidates, findLogo, isPublicUrl, siteUrl } from '@/lib/logo';

describe('logo candidates on a page', () => {
  const html = `<html><head>
    <link rel="icon" href="/favicon-32.png" sizes="32x32">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple.png">
    <meta property="og:image" content="https://cdn.example.com/hero.jpg">
    </head><body>
    <img src="/img/team.jpg" alt="Our team">
    <a href="/"><img class="site-logo" src="/img/acme-logo.svg" alt="Acme"></a>
    <img src="/partners/bigpharma.png" alt="Partner">
    </body></html>`;
  const c = extractCandidates(html, 'https://acme.com/');
  it('puts the marked logo first and ignores ordinary photos', () => {
    expect(c[0]).toMatchObject({ url: 'https://acme.com/img/acme-logo.svg', kind: 'logo-img' });
    expect(c.map(x => x.url)).not.toContain('https://acme.com/img/team.jpg');
  });
  it('keeps app icons, sharing images and standard fallbacks', () => {
    const urls = c.map(x => x.url);
    expect(urls).toContain('https://acme.com/apple.png');
    expect(urls).toContain('https://cdn.example.com/hero.jpg');
    expect(urls).toContain('https://acme.com/favicon.ico');
    expect(urls.indexOf('https://acme.com/apple.png')).toBeLessThan(urls.indexOf('https://cdn.example.com/hero.jpg'));
  });
});

describe('addresses', () => {
  it('normalises websites', () => {
    expect(siteUrl('acme.com')).toBe('https://acme.com/');
    expect(siteUrl('https://www.acme.com/team')).toBe('https://www.acme.com/');
    expect(siteUrl('')).toBeNull();
    expect(siteUrl('ftp://acme.com')).toBeNull();
  });
  it('refuses private-network addresses', () => {
    for (const u of ['http://localhost/x', 'http://127.0.0.1/', 'http://10.1.2.3/', 'http://192.168.0.5/', 'http://172.20.0.1/', 'http://169.254.169.254/latest', 'file:///etc/passwd']) expect(isPublicUrl(u)).toBe(false);
    expect(isPublicUrl('https://acme.com/logo.png')).toBe(true);
  });
});

describe('finding a logo on a live site (no Claude key: best-ranked image)', () => {
  let server: http.Server, base = '';
  const png = (f: string) => fs.readFileSync(path.join(__dirname, '..', 'fixtures', f));
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html><head><link rel="apple-touch-icon" href="/touch.png"></head><body><img class="logo" src="/logo.png" alt="Acme"><img src="/photo.jpg" alt="Lab"></body></html>'); return; }
      if (req.url === '/logo.png') { res.writeHead(200, { 'content-type': 'image/png' }); res.end(png('logo-main.png')); return; }
      if (req.url === '/touch.png') { res.writeHead(200, { 'content-type': 'image/png' }); res.end(png('logo-touch.png')); return; }
      res.writeHead(404); res.end();
    });
    await new Promise<void>(r => server.listen(0, '127.0.0.1', () => r()));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>(r => server.close(() => r())));

  it('stores the marked logo', async () => {
    const r = await findLogo({ companyId: 'c1', name: 'Acme', website: base, allowPrivate: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.origin).toBe(base + '/logo.png');
    expect(r.method).toBe('ranking');
    expect(r.logo.startsWith('data:image/png;base64,')).toBe(true);
  });
  it('offers the next image after the first is marked wrong, and reports when none are left', async () => {
    const r = await findLogo({ companyId: 'c1', name: 'Acme', website: base, exclude: [base + '/logo.png'], allowPrivate: true });
    expect(r.ok && r.origin).toBe(base + '/touch.png');
    const none = await findLogo({ companyId: 'c1', name: 'Acme', website: base, exclude: [base + '/logo.png', base + '/touch.png', base + '/apple-touch-icon.png', base + '/favicon.ico'], allowPrivate: true });
    expect(none.ok).toBe(false);
  });
  it('explains a missing website without a key', async () => {
    const r = await findLogo({ companyId: 'c1', name: 'Nowhere Bio', website: '' });
    expect(r).toMatchObject({ ok: false, website: null });
  });
});
