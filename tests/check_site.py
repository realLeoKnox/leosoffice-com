#!/usr/bin/env python3
"""Checks the built site in dist/ (run `npm run build` first)."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import base64, hashlib, html, json, re, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
BASE = 'https://www.leosoffice.com/'
LOCALES = {'en': '', 'zh-Hant': 'zh-hant/', 'zh-Hans': 'zh-hans/'}
SPACE_URLS = ['https://www.leoknox.dev/', 'https://www.leoknox.me/', 'https://aploa.com/', 'https://agent.leoknox.us/']
headers = (DIST / '_headers').read_text()


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.nodes = []; self.feed(text)

    def handle_starttag(self, tag, attrs):
        self.nodes.append((tag, dict(attrs)))


def check_refs(file, page):
    ids = {a['id'] for _, a in page.nodes if 'id' in a}
    n = 0
    for _, a in page.nodes:
        for attr in ('src', 'href'):
            if attr not in a: continue
            u = urlsplit(a[attr])
            if u.scheme in ('mailto', 'tel') or (u.netloc and u.netloc != 'www.leosoffice.com'): continue
            if not u.path and u.fragment: assert u.fragment in ids, (file, a[attr]); continue
            target = DIST / unquote(u.path).lstrip('/') if u.path.startswith('/') or u.netloc else file.parent / unquote(u.path)
            if target.is_dir(): target = target / 'index.html'
            assert target.exists(), f'{file}: {a[attr]}'
            n += 1
    return n


refs = 0
for lang, prefix in LOCALES.items():
    file = DIST / prefix / 'index.html'; source = file.read_text(); page = Page(source)
    assert page.nodes[0][1]['lang'] == lang
    assert len([1 for t, _ in page.nodes if t == 'h1']) == 1
    assert any(t == 'link' and a.get('rel') == 'canonical' and a['href'] == BASE + prefix for t, a in page.nodes)
    alternates = {a['hreflang']: a['href'] for t, a in page.nodes if t == 'link' and a.get('rel') == 'alternate'}
    assert alternates == {**{l: BASE + p for l, p in LOCALES.items()}, 'x-default': BASE}
    # The 3D layer's data: four spaces with canonical URLs.
    root = next(a for t, a in page.nodes if a.get('id') == 'office-root')
    data = json.loads(html.unescape(root['data-office']))
    assert [s['url'] for s in data['spaces']] == SPACE_URLS and all(s['label'] and s['name'] and s['description'] for s in data['spaces'])
    # The same four doors as static cards (no-JS path).
    assert [a['href'] for t, a in page.nodes if t == 'a' and 'space-card' in a.get('class', '')] == SPACE_URLS
    assert 'https://t.me/leospmbot' in source and 'realLeoKnox' not in source
    assert 'href="https://leoknox.dev/"' not in source and 'href="https://leoknox.me/"' not in source
    assert 'mailto:leo@leosoffice.com' in source and 'https://github.com/' not in source
    ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', source)[1]
    schema = json.loads(ld); assert schema['inLanguage'] == lang and schema['url'] == BASE + prefix
    assert "'sha256-" + base64.b64encode(hashlib.sha256(ld.encode()).digest()).decode() + "'" in headers
    assert not re.search(r'<script(?![^>]*(?:src=|type="application/ld\+json"))[^>]*>', source), 'no inline executable scripts (CSP)'
    assert not re.search(r'\sstyle="', source), 'no inline style attributes (CSP)'
    refs += check_refs(file, page)
    print('PASS', lang, 'metadata, hreflang, office data, space cards, links, CSP-safe markup, references')

notfound = (DIST / '404.html').read_text()
assert 'content="noindex"' in notfound and 'leo@leosoffice.com' in notfound
assert not re.search(r'(href|src)="\./', notfound), '404 must use root-absolute refs'
refs += check_refs(DIST / '404.html', Page(notfound))
assert "'unsafe-inline'" not in headers and 'X-Frame-Options: DENY' in headers
assert '/static/*\n  Cache-Control: public, max-age=31536000, immutable' in headers
redirects = (DIST / '_redirects').read_text()
for rule in ['/cn/index.html /zh-hans/ 301', '/en/index.html / 301', '/cn/ /zh-hans/ 301', '/favicon.ico /assets/favicon.svg 301']:
    assert rule in redirects, rule
urls = {el.text for el in ET.parse(DIST / 'sitemap.xml').findall('.//{*}loc')}
assert urls == {BASE + p for p in LOCALES.values()}
assert hashlib.sha256((DIST / 'assets/leo-avatar.jpg').read_bytes()).hexdigest() == '556fe9ed8c86cc3bb46ad8954ec18937a993bfbdb2ab2880ac45d36db2a62c54'
zh = (DIST / 'zh-hans/index.html').read_text()
assert '从好奇出发，' in zh and '连接无限可能。' in zh and '保持独立，认真创造，也给未来留一点想象空间。' in zh
assert '当时对方帮忙安装一个宝塔还收了我30哈哈😂' in zh
for leaked in ['README.md', 'VALIDATION.md', 'content', 'scripts', 'tests', 'src', 'node_modules', 'package.json', 'wrangler.jsonc', 'preview.command']:
    assert not (DIST / leaked).exists(), ('not public', leaked)
print(f'PASS: {refs} references, 404, CSP + caching headers, legacy redirects, sitemap, avatar bytes, required copy, nothing private in dist/.')
