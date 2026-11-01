#!/usr/bin/env python3
"""Render the three static language pages + 404 as Vite entry HTML (stdlib only).

The HTML carries all copy, SEO and links so the site reads fine without JS.
src/main.js enhances it: the 3D office (React + react-three-fiber) mounts into
#office-root and the hero becomes a scroll-driven walk into the room.
Static hosting files (robots, sitemap, _headers, _redirects) go to public/.
Run `npm run build` for the full site (this script, then `vite build`).
"""
from pathlib import Path
import html, json, hashlib, base64, re

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
BASE = 'https://www.leosoffice.com/'
TELEGRAM = 'https://t.me/leospmbot'
LOCALES = {'en': ('', 'en_US'), 'zh-Hant': ('zh-hant/', 'zh_TW'), 'zh-Hans': ('zh-hans/', 'zh_CN')}
# The four desk objects: key, domain, canonical URL, label icon.
SPACES = [('dev', 'leoknox.dev', 'https://www.leoknox.dev/', '▱'),
          ('me', 'leoknox.me', 'https://www.leoknox.me/', '▥'),
          ('aploa', 'aploa.com', 'https://aploa.com/', '⌁'),
          ('agent', 'agent.leoknox.us', 'https://agent.leoknox.us/', '▤')]
BOOKMARKS = ['https://image.nimama.de/', 'https://wp.leoknox.de/', 'https://key.leoknox.de/']
E = html.escape
ICON = '''<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M8 7v26h24" stroke="currentColor" stroke-width="2"/><circle cx="27" cy="14" r="5" fill="#ff9b71"/><ellipse cx="27" cy="14" rx="10" ry="3" transform="rotate(-35 27 14)" stroke="#ff9b71"/></svg>'''


def head(d, lang, prefix, oglocale, ld):
    alternates = ''.join(f'<link rel="alternate" hreflang="{l}" href="{BASE + p}">' for l, (p, _) in LOCALES.items()) + f'<link rel="alternate" hreflang="x-default" href="{BASE}">'
    return (f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<meta name="theme-color" content="#f4f1e8"><title>{E(d["title"])}</title><meta name="description" content="{E(d["description"], quote=True)}">'
            f'<link rel="canonical" href="{BASE + prefix}">{alternates}'
            f'<meta property="og:type" content="website"><meta property="og:site_name" content="Leo’s Office"><meta property="og:title" content="{E(d["title"], quote=True)}">'
            f'<meta property="og:description" content="{E(d["description"], quote=True)}"><meta property="og:url" content="{BASE + prefix}"><meta property="og:locale" content="{oglocale}">'
            f'<meta property="og:image" content="{BASE}assets/og-{lang}.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{E(d["title"], quote=True)}"><meta name="twitter:description" content="{E(d["description"], quote=True)}"><meta name="twitter:image" content="{BASE}assets/og-{lang}.png">'
            f'<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><script type="application/ld+json">{ld}</script>'
            f'<script type="module" src="/src/main.js"></script></head>')


def office_data(d):
    """Copy the 3D layer needs, passed as one JSON data attribute (no inline script)."""
    return {'spaces': [{'key': k, 'domain': dom, 'url': url, 'icon': icon, 'label': d['tabs'][i], 'name': d['cards'][i][0], 'description': d['cards'][i][1]}
                       for i, (k, dom, url, icon) in enumerate(SPACES)],
            'visit': d['visit'], 'back': d['backToRoom'], 'explore': d['exploreHint'], 'reset': d['reset'], 'fallback': d['fallback']}


def page(d, lang, prefix):
    up = '/' + prefix
    languages = ''.join(f'<a data-language="{l}" lang="{l}" hreflang="{l}" href="/{p}"' + (' aria-current="page"' if l == lang else '') + '>' + {'en': 'EN', 'zh-Hant': '繁', 'zh-Hans': '简'}[l] + '</a>' for l, (p, _) in LOCALES.items())
    nav = ''.join(f'<a href="#{t}">{E(text)}</a>' for t, text in zip(['spaces', 'story', 'contact'], d['nav']))
    cards = ''.join(f'<a class="space-card" href="{url}" data-space="{k}"><span class="space-icon" aria-hidden="true">{icon}</span><span class="space-domain">{dom}</span><strong>{E(d["cards"][i][0])}</strong><span class="space-desc">{E(d["cards"][i][1])}</span><span class="space-go">{E(d["visit"])} ↗</span></a>'
                    for i, (k, dom, url, icon) in enumerate(SPACES))
    bookmarks = ''.join(f'<a href="{url}">{E(label)} ↗</a>' for url, label in zip(BOOKMARKS, d['bookmarkNames']))
    story = ''.join(f'<p data-chapter="{E(d["chapters"][i], quote=True)}">{E(text)}</p>' for i, text in enumerate(d['story']))
    data = E(json.dumps(office_data(d), ensure_ascii=False, separators=(',', ':')), quote=True)
    return f'''<body><a class="skip" href="#main">{d['skip']}</a><div class="wrap header-wrap"><header class="site-header"><a class="wordmark" href="{up}" aria-label="Leo’s Office">{ICON}<span>Leo’s <i>Office.</i></span></a><div class="header-right"><nav class="nav" id="nav" aria-label="{d['menu']}">{nav}</nav><div class="languages" aria-label="{d['language']}">{languages}</div><button class="menu-button" aria-expanded="false" aria-controls="nav" aria-label="{d['menu']}">☰</button></div></header></div><div class="language-notice" hidden><a id="language-suggestion" href="/"></a><button data-dismiss-language aria-label="{d['dismiss']}">×</button></div><main id="main"><section class="office" id="office" aria-labelledby="hero-title"><div class="hero office-stage"><div class="office-canvas" id="office-root" data-office="{data}" role="img" aria-label="{d['sceneDesc']}"><img class="room-fallback" src="/assets/office-fallback.svg" alt="" width="1000" height="650"></div><div class="hero-heading wrap"><p class="hello">{d['hello']}</p><h1 id="hero-title">{d['heroTitle']}</h1><p class="hero-intro">{d['heroSubtitle']}</p></div><div class="avatar-sticker"><img src="/assets/leo-avatar.jpg" alt="{d['avatarAlt']}" width="79" height="79"><small>Leo was here.</small></div><p class="scroll-hint" aria-hidden="true">{d['scrollHint']} <span>↓</span></p></div></section><section class="spaces wrap" id="spaces" aria-labelledby="spaces-title"><p class="section-label">{d['spacesLabel']}</p><h2 id="spaces-title">{d['spacesHeading']}</h2><div class="space-grid">{cards}</div><details class="bookmarks"><summary>{d['bookmarks']}</summary><div class="bookmark-links">{bookmarks}</div></details></section><div class="wrap"><section class="story" id="story" aria-labelledby="story-title"><div class="story-intro"><div><p class="section-label">{d['storyLabel']}</p><h2 id="story-title">{d['storyHeading']}</h2></div><aside class="sticky-note"><p>{d['sticky']}</p><div class="signature">— Leo</div></aside></div><div class="story-text">{story}</div></section><div class="quote-strip"><span class="little-star" aria-hidden="true">✳</span><span>{d['intro'].replace('<br>', ' ')}<br>{d['note'].replace('<br>', ' ')}</span><span class="little-star" aria-hidden="true">✳</span></div><section class="contact" id="contact" aria-labelledby="contact-title"><div><p class="section-label">{d['contactLabel']}</p><h2 id="contact-title">{d['contactHeading']}</h2><p>{d['contactNote']}</p></div><div><a class="email" href="mailto:leo@leosoffice.com">leo@leosoffice.com <span aria-hidden="true">↗</span></a><div class="contact-links"><div><a href="{TELEGRAM}">Telegram @leospmbot ↗</a> &nbsp; / &nbsp; <a href="https://www.nodeseek.com/notification#/message?mode=talk&amp;to=26676">NodeSeek ↗</a></div><button class="copy-email" data-copy data-success="{d['copySuccess']}" data-failure="{d['copyFailure']}">{d['copy']}</button></div><div class="copy-status" role="status" aria-live="polite"></div></div></section></div></main><footer class="wrap"><div class="site-footer"><p class="footer-note">© 2026 LEO KNOX<br>{d['footer']}</p><div class="footer-right"><time class="local-time" data-time>UTC+8</time><a href="#main">{d['back']}</a></div></div></footer></body></html>'''


hashes = []
for lang, (prefix, oglocale) in LOCALES.items():
    d = json.loads((ROOT / 'content' / f'{lang}.json').read_text())
    schema = {'@context': 'https://schema.org', '@type': 'ProfilePage', 'url': BASE + prefix, 'name': d['title'], 'description': d['description'], 'inLanguage': lang,
              'mainEntity': {'@type': 'Person', 'name': 'Leo Knox', 'url': BASE, 'image': BASE + 'assets/leo-avatar.jpg', 'email': 'leo@leosoffice.com',
                             'sameAs': [TELEGRAM, 'https://www.leoknox.dev/', 'https://www.leoknox.me/']}}
    ld = json.dumps(schema, ensure_ascii=False, separators=(',', ':'))
    hashes.append("'sha256-" + base64.b64encode(hashlib.sha256(ld.encode()).digest()).decode() + "'")
    h = head(d, lang, prefix, oglocale, ld)
    dest = ROOT / prefix / 'index.html'; dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(h + page(d, lang, prefix))
    if lang == 'en':
        error = re.sub(r'<link rel="alternate"[^>]+>', '', h).replace(f'<link rel="canonical" href="{BASE}">', '<meta name="robots" content="noindex">')
        error = error.replace('<title>' + E(d['title']) + '</title>', '<title>404 — Leo’s Office</title>').replace(f'<script type="application/ld+json">{ld}</script>', '')
        (ROOT / '404.html').write_text(error + f'<body><main class="wrap error-page"><a class="wordmark" href="/">{ICON}Leo’s Office.</a><h1>404</h1><h2>{d["errorHeading"]}</h2><p>{d["errorText"]}</p><a class="back-link" href="/">{d["errorBack"]} ↗</a><p><a href="mailto:leo@leosoffice.com">leo@leosoffice.com</a></p></main></body></html>')

PUBLIC.mkdir(exist_ok=True)
(PUBLIC / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {BASE}sitemap.xml\n')
(PUBLIC / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(f'<url><loc>{BASE + p}</loc></url>' for p, _ in LOCALES.values()) + '</urlset>\n')
(PUBLIC / '_redirects').write_text('/favicon.ico /assets/favicon.svg 301\n/cn/index.html /zh-hans/ 301\n/en/index.html / 301\n/cn /zh-hans/ 301\n/cn/ /zh-hans/ 301\n/en / 301\n/en/ / 301\n/index.html / 301\n/zh-hant/index.html /zh-hant/ 301\n/zh-hans/index.html /zh-hans/ 301\n')
(PUBLIC / '_headers').write_text('''/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' ''' + ' '.join(hashes) + '''; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none';
/static/*
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
''')
print('Rendered 3 language pages + 404 (Vite entries) and public/ hosting files.')
