# Leo’s Office — 一个可以探索的小办公室

leosoffice.com 新版。浅纸色背景、低多边形房间、木桌、蓝椅和个人头像贴纸；通过 Three.js 的正交摄像机探索内容。仓库 `realLeoKnox/leosoffice-com`，Cloudflare Workers 静态资源（Worker `leosoffice-com`）部署，见「部署（2026-11-01）」。

## 本地运行

双击 `preview.command`。它会生成发布目录，然后在 `http://127.0.0.1:5682/zh-hans/` 打开简体预览。退出时在终端按 Ctrl+C。

也可在此目录执行：

```sh
python3 scripts/build.py
python3 -m http.server 5682 --bind 127.0.0.1 --directory dist
```

使用本地 HTTP 服务访问，不能双击 index.html 代替 HTTP；ES modules 需要正常的模块加载环境。

## 内容与交互

- 电脑 → www.leoknox.dev，书本 → www.leoknox.me，台灯 → aploa.com，主机 → agent.leoknox.us。
- 鼠标悬停抬起物件，点击后镜头平滑靠近；显示对应名称、介绍和入口链接。点击外链前不会自动离开页面。
- 鼠标拖动改变有限角度的视角。左右视角、回到全景和暂停按钮也可用键盘操作。触屏纵向保持页面滚动，横向拖动可环顾，也可通过物件点击或按钮探索。
- 房间静止后停止渲染；不使用持续的环境动画。画面离屏、标签隐藏、手动暂停时停止更新。减少动态效果偏好下，镜头直接到位。
- WebGL 初始化失败或上下文丢失时显示本地 SVG 插画；四个常规站点链接始终保留。没有 JS 时正文、旧书签和链接仍可访问。
- 保留个人头像原文件、原站买 VPS 的经历、两句指定文案，以及旧图床、博客、Vaultwarden 入口。统一联系邮箱 `leo@leosoffice.com`，不自动发送邮件。
- 站点是入口汇总，没有添加具体项目仓库外链。链接来源于用户已提供的信息和当前旧站，外部服务可用性未逐一验收。

## 技术

Three.js **0.186.1 / r186** 来自 npm 官方包，MIT 许可证随 `assets/vendor/LICENSE` 提供。所有运行资源本地保存，不依赖 CDN、远程字体、贴图或模型。房间由原生几何、材质、灯光和本地产生的 CanvasTexture 构建。

使用 OrthographicCamera、Raycaster、MeshStandardMaterial、PCFShadowMap 和按需 requestAnimationFrame。设备像素比上限 1.6；没有后处理、视频背景或第三方模型加载。Three.js 官方构建约 2MB 未压缩，生产静态托管应启用平台自带的 gzip/Brotli；本次未进行生产网络性能测量。

网页运行无需框架、Node 包安装或服务端。生成器只需 Python 标准库。`scripts/create_social_images.py` 是可选的分享图生成源，需要 Pillow 和 macOS 字体；已附生成后的 PNG，正常构建无需运行它。

## 多语言与 SEO

- `/` 默认英文。
- `/zh-hant/` 繁體中文。
- `/zh-hans/` 简体中文。

顶部语言切换保留页面锚点。浏览器语言仅显示切换建议，不强制跳转；显式选择保存在本地。正文和交互文字按语言生成静态 HTML。

每版包含 title、description、lang、独立 canonical、互相对应的 hreflang 与 x-default、Open Graph、Twitter Card、1200×630 PNG 分享图、ProfilePage / Person JSON-LD。另有 robots、sitemap 和 noindex 404。

主地址沿用 **https://www.leosoffice.com/**。`_redirects` 仅准备 `/cn/` 到 `/zh-hans/`、`/en/` 到 `/` 及 index.html 规范化规则。`cloudflare-redirect-rule.json` 是日后手动配置 apex / HTTP 跳转的参考，文件本身不执行任何云端修改。Python 本地服务不会应用 Cloudflare `_headers` 或 `_redirects`。

## 修改与检查

文案在 `content/*.json`；布局生成器在 `scripts/build.py`；样式在 `assets/style.css`；房间、摄像机与交互在 `assets/scene.js`，普通 UI 在 `assets/main.js`。

```sh
python3 scripts/build.py
python3 tests/check_site.py
node --input-type=module --check < assets/main.js
node --input-type=module --check < assets/scene.js
```

生成器会重新写入三语言页面、JSON-LD / CSP hash 与 `dist/`。未来静态托管只上传 **dist/** 内容；源码字典、测试、文档和 preview.command 不必公开。真实上线后另行检查托管安全头、域名跳转、HTTPS、真机表现和搜索引擎收录。

## 部署（2026-11-01）

- `wrangler.jsonc`（Worker `leosoffice-com`）：`wrangler deploy` 先运行 `python3 scripts/build.py --bundle`，只发布 `dist/`。
- `--bundle`：用 esbuild 0.28.2（`npx`）把 `scene.js` 与 Three.js 打包压缩为一个模块，dist 中删除未打包的 vendor 文件（保留 LICENSE 与 version.json）。首页加载约 2.25 MB → 0.6 MB；gzip 后 Three 部分约 423 KB → 149 KB。不带 `--bundle` 时仍是纯 Python 标准库构建，适合本地预览。
- CSP 去掉 `style-src 'unsafe-inline'`（页面无内联样式，Three.js 通过 CSSOM 改样式，不受影响；已在严格 CSP 下浏览器实测），增加 `X-Frame-Options: DENY`；`/assets/*` 缓存 1 天 + stale-while-revalidate 7 天。
- `_redirects`：旧站 `/cn/index.html` → `/zh-hans/`、`/en/index.html` → `/`（旧首页 JS 跳转的目标，旧书签与外链不会 404）；`/favicon.ico` → svg。
- `not_found_handling: "404-page"`；404 页改用根路径绝对引用，任意深度都有样式。
- 兄弟站点链接直接指向 `https://www.leoknox.dev/`、`https://www.leoknox.me/`（物件按钮的 `data-url`）；Telegram 统一为 `@leospmbot`；JSON-LD Person 增加 `sameAs`。

- 视图：相机按房间包围盒自动取景；舞台高度随视口（中/英分别计算），首屏可见物件按钮；控制条在画面下方；小屏收起装饰；画布边缘渐隐。

### Cloudflare 后台

1. 用本仓库新建 Worker（名称 `leosoffice-com`，部署命令 `npx wrangler deploy`）。
2. 把自定义域名 `www.leosoffice.com` 从旧项目移到新 Worker。
3. leosoffice.com 当前裸域返回 502：按 `cloudflare-redirect-rule.json` 建 301（根域名 → `https://www.leosoffice.com` 同路径），并确认 Always Use HTTPS 已开。
