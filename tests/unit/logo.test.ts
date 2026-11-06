import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
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
      if (req.url === '/en/home') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html><body><img class="brand-logo" src="/touch.png" alt="Acme"></body></html>'); return; }
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
  it('uses a direct link to the logo image as given', async () => {
    const r = await findLogo({ companyId: 'c1', name: 'Acme', website: base + '/touch.png', allowPrivate: true });
    expect(r).toMatchObject({ ok: true, method: 'given', origin: base + '/touch.png' });
  });
  it('reads the exact page the owner points at', async () => {
    const r = await findLogo({ companyId: 'c1', name: 'Acme', website: base + '/en/home', allowPrivate: true });
    expect(r.ok && r.origin).toBe(base + '/touch.png');
  });
});

describe('with Firecrawl (live web)', () => {
  let server: http.Server, base = '';
  const real = globalThis.fetch;
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/brand.png') { res.writeHead(200, { 'content-type': 'image/png' }); res.end(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'logo-main.png'))); return; }
      res.writeHead(404); res.end();
    });
    await new Promise<void>(r => server.listen(0, '127.0.0.1', () => r()));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.FIRECRAWL_API_KEY = 'fc-test';
    vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (!url.startsWith('https://api.firecrawl.dev/v2/')) return real(input, init);
      const p = url.slice('https://api.firecrawl.dev/v2'.length), body = JSON.parse(String(init?.body || '{}'));
      calls.push({ path: p, body });
      expect((init?.headers as Record<string, string>).authorization).toBe('Bearer fc-test');
      if (p === '/search') return Response.json({ success: true, data: { web: [{ url: 'https://www.linkedin.com/company/acme', title: 'Acme | LinkedIn' }, { url: base + '/about', title: 'Acme Bio' }] } });
      if (p === '/scrape') return Response.json({ success: true, data: { rawHtml: '<html><body>Rendered by script</body></html>', metadata: { url: body.url }, branding: { logo: base + '/brand.png', images: { logo: base + '/brand.png' } } } });
      return new Response('nope', { status: 404 });
    });
  });
  afterEach(() => { calls.length = 0; });
  afterAll(async () => { vi.unstubAllGlobals(); delete process.env.FIRECRAWL_API_KEY; await new Promise<void>(r => server.close(() => r())); });

  it('takes the brand logo Firecrawl sees on the rendered page', async () => {
    const r = await findLogo({ companyId: 'c1', name: 'Acme', website: base, allowPrivate: true });
    expect(r).toMatchObject({ ok: true, origin: base + '/brand.png', via: 'firecrawl' });
    expect(calls[0]).toMatchObject({ path: '/scrape', body: { url: base + '/', formats: ['rawHtml', 'branding'] } });
  });
  it('searches the web for the official site when the profile has none, skipping directories', async () => {
    const r = await findLogo({ companyId: 'c1', name: 'Acme', website: '', city: 'Basel', country: 'Switzerland', allowPrivate: true });
    expect(r).toMatchObject({ ok: true, website: base + '/' });
    expect(calls.map(c => c.path)).toEqual(['/search', '/scrape']);
    expect(String(calls[0].body.query)).toContain('Acme Basel, Switzerland');
  });
});
