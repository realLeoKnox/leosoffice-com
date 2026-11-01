#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import base64,hashlib,json,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
BASE='https://www.leosoffice.com/'
locales={'en':'','zh-Hant':'zh-hant/','zh-Hans':'zh-hans/'}
headers=(ROOT/'_headers').read_text()
class Page(HTMLParser):
 def __init__(self,text):super().__init__();self.nodes=[];self.feed(text)
 def handle_starttag(self,tag,attrs):self.nodes.append((tag,dict(attrs)))
refs=0
for lang,prefix in locales.items():
 file=ROOT/prefix/'index.html';source=file.read_text();page=Page(source)
 assert page.nodes[0][1]['lang']==lang
 assert len([1 for tag,attrs in page.nodes if tag=='h1'])==1
 assert re.search(r'<title>[^<]+</title>',source)
 assert any(tag=='meta' and a.get('name')=='description' and a.get('content') for tag,a in page.nodes)
 assert any(tag=='link' and a.get('rel')=='canonical' and a['href']==BASE+prefix for tag,a in page.nodes)
 alternates={a['hreflang']:a['href'] for tag,a in page.nodes if tag=='link' and a.get('rel')=='alternate'}
 assert alternates=={**{l:BASE+p for l,p in locales.items()},'x-default':BASE}
 assert len([1 for tag,a in page.nodes if 'data-office-key' in a])==4
 assert 'mailto:leo@leosoffice.com' in source and 'leo@leoknox.de' not in source
 assert all('https://'+domain+'/' in source for domain in ['leoknox.dev','leoknox.me','aploa.com','agent.leoknox.us'])
 assert 'https://github.com/' not in source
 data=re.search(r'<script type="application/ld\+json">(.*?)</script>',source)[1]
 schema=json.loads(data);assert schema['inLanguage']==lang and schema['url']==BASE+prefix
 assert "'sha256-"+base64.b64encode(hashlib.sha256(data.encode()).digest()).decode()+"'" in headers
 ids={a['id'] for tag,a in page.nodes if 'id' in a}
 for tag,a in page.nodes:
  for attr in ['src','href']:
   if attr not in a:continue
   value=a[attr];u=urlsplit(value)
   if u.scheme in ['mailto','tel']:continue
   if u.netloc and u.netloc!='www.leosoffice.com':continue
   if not u.path and u.fragment:assert u.fragment in ids;continue
   p=(ROOT/unquote(u.path.lstrip('/'))) if u.netloc or u.path.startswith('/') else file.parent/unquote(u.path)
   if p.is_dir():p=p/'index.html'
   assert p.exists(),f'{file}: {value}'
   refs+=1
 assert all((ROOT/'assets'/f'og-{lang}.png').read_bytes()[:8]==b'\x89PNG\r\n\x1a\n' for _ in [1])
 print('PASS',lang,'static content, locale links, metadata, controls, assets and CSP')
sitemap=ET.parse(ROOT/'sitemap.xml');urls={el.text for el in sitemap.findall('.//{*}loc')};assert urls=={BASE+p for p in locales.values()}
source=(ROOT/'404.html').read_text();assert 'content="noindex"' in source and 'leo@leosoffice.com' in source
assert (ROOT/'assets/vendor/LICENSE').is_file()
assert json.loads((ROOT/'assets/vendor/version.json').read_text())['version']=='0.186.1'
assert hashlib.sha256((ROOT/'assets/leo-avatar.jpg').read_bytes()).hexdigest()=='556fe9ed8c86cc3bb46ad8954ec18937a993bfbdb2ab2880ac45d36db2a62c54'
zh=(ROOT/'zh-hans/index.html').read_text();assert '从好奇出发，' in zh and '连接无限可能。' in zh and '保持独立，认真创造，也给未来留一点想象空间。' in zh
assert '当时对方帮忙安装一个宝塔还收了我30哈哈😂' in zh
assert all((ROOT/'dist'/p/'index.html').read_bytes()==(ROOT/p/'index.html').read_bytes() for p in locales.values())
print(f'PASS: {refs} static references, sitemap, 404, original avatar bytes, required copy, pinned Three.js and public dist.')
