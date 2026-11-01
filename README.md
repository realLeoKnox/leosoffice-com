# Leo’s Office — 滚动走进一间小办公室

www.leosoffice.com。第一屏是标题和一整间低多边形小办公室；向下滚动，镜头推进房间、画面占满屏幕；进入后电脑、书本、台灯、主机常驻标签，点标签或物件就走近看，并弹出说明卡片和入口。

- 电脑 → www.leoknox.dev　书本 → www.leoknox.me　台灯 → aploa.com　主机 → agent.leoknox.us
- 联系：leo@leosoffice.com，Telegram @leospmbot，NodeSeek。保留原站买 VPS 的往事、指定文案与旧书签（图床、博客、Vaultwarden）。

## 技术

| 层 | 做什么 |
| --- | --- |
| `scripts/build.py`（Python 标准库） | 从 `content/*.json` 渲染三语言静态 HTML + 404（SEO、无 JS 也能读、四张入口卡片），作为 Vite 的多页面入口；生成 `public/` 下的 robots、sitemap、`_headers`（CSP 哈希）、`_redirects` |
| Vite 8 + React 19 + @react-three/fiber 9 + three 0.186.1 | `src/main.js` 处理菜单、语言建议、复制邮箱、时钟；检测到 WebGL 后**懒加载** `src/office/` 的 3D 层 |
| `src/office/room.js` | `buildRoom()`：房间造型（原生几何体 + 本地 CanvasTexture，无外部模型/贴图） |
| `src/office/framing.js` | 取景：把一组 3D 点按相机姿态投影，算出让它落在屏幕指定区域的正交视锥 |
| `src/office/Office.jsx` | 滚动进度 → 镜头（全景 → 室内 → 聚焦），阻尼插值；HTML 标签每帧贴在物件上；拖动环顾；卡片；Esc 关闭 |

渲染按需进行（`frameloop="demand"`）：只在滚动、拖动、悬停或镜头尚未停稳时绘制，静止时不占 GPU。

**体积**：首屏 JS 约 6 KB（gzip 2 KB）；3D 层单独一个块，约 1.15 MB / gzip 316 KB（three + React + R3F），在首屏 HTML/CSS 之后加载。

**降级**：无 WebGL → 保留静态插画和四张入口卡片；WebGL 上下文丢失 / 渲染出错 → 回到静态模式；`prefers-reduced-motion` → 镜头直接到位、无提示动画；无 JS → 普通页面。

**CSP**：`script-src 'self'` + JSON-LD 哈希，`style-src 'self'`（无 `unsafe-inline`；React/R3F 通过 CSSOM 设置样式不受限）。已在 wrangler 本地模拟的生产响应头下实测无违规。

## 本地开发

```sh
npm install
npm run dev        # 渲染页面 + Vite 开发服务器（热更新）：http://127.0.0.1:5682/zh-hans/
npm run build      # 渲染页面 + 生产构建到 dist/
npm run preview    # 预览 dist/
npm test           # 检查 dist/（先 build）
npx wrangler dev   # 用 Cloudflare 的方式本地运行 dist/（_headers、_redirects、真实 404）
```

或双击 `preview.command`（首次自动 `npm install`，然后 `npm run dev` 并打开浏览器）。

文案在 `content/*.json`；页面骨架在 `scripts/build.py`；样式在 `src/style.css`（全站）与 `src/office.css`（舞台、标签、卡片、入口卡片）。不要直接改生成的 `index.html`、`zh-hans/`、`zh-hant/`、`404.html`、`public/_headers` 等。

## 部署

- `wrangler.jsonc`（Worker `leosoffice-com`）：`npm ci && npm run build`，只发布 `dist/`；`not_found_handling: "404-page"`。
- 缓存：Vite 产物在 `/static/`（文件名带哈希，1 年 immutable）；`/assets/`（头像、图标、分享图）1 天 + stale-while-revalidate。
- `_redirects`：旧站 `/cn/`、`/cn/index.html` → `/zh-hans/`，`/en/`、`/en/index.html` → `/`，`/favicon.ico` → svg。
- Cloudflare 后台：用本仓库建 Worker → 把 `www.leosoffice.com` 自定义域名移过来 → 按 `cloudflare-redirect-rule.json` 加裸域 → www 的 301，并开 Always Use HTTPS。

## 多语言与 SEO

`/` 英文，`/zh-hant/` 繁體，`/zh-hans/` 简体；各自 canonical、互相对应的 hreflang 与 x-default、Open Graph / Twitter、1200×630 分享图、ProfilePage / Person JSON-LD（含 `sameAs`）；robots、sitemap、noindex 404。浏览器语言只显示切换建议，不强制跳转。
