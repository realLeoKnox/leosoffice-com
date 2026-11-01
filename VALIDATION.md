# 本地验证记录 — 2026-10-30

目标：`leosoffice.com` 的新版个人总站，输出 `outputs/leosoffice-com`。线上旧站未修改，未上传 Sites / GitHub，未更改域名、DNS 或托管。

## 已完成

- 从 npm 官方注册表读取并保存 Three.js 0.186.1 / r186，包含两个官方运行模块与 MIT 许可证。页面本地加载，不请求 CDN。
- 立体办公室在浏览器实际渲染；DOM 记录 WebGL 初始化成功，使用 OrthographicCamera。最终版本控制台未见 error。
- 实际使用鼠标拖动环顾：镜头 yaw / pitch 从初始 0.780 / 0.610 变化至 0.175 / 0.682；全景按钮返回初始视角。
- 点击 3D 物件可选择对应入口；按钮选中书本时显示 leoknox.me，选中台灯时显示 aploa.com，镜头平滑靠近并出现直达入口。
- 暂停后渲染帧数在两次独立读取中保持 7，不继续绘制。静态视角也按需停止更新。
- 英文、繁中、简中都实际打开检查。移动菜单展开、选择章节后关闭；英文 #story 切到繁中后仍保留 #story。
- 繁中邮箱复制实际返回「信箱已複製，郵件裡見。」；邮件地址为 leo@leosoffice.com。
- 1280×960 桌面、390×844 浏览器视口检查无横向溢出，均保存截图。手机标题按两行排布，完整房间和选择按钮可见。查看了桌面整页截图，检查往事、便笺、指定文案和联系区域。
- 三语言静态 SEO 与资源检查通过：唯一 H1、description、各自 canonical、互相对应的 hreflang / x-default、JSON-LD / CSP hash、45 个本地及 SEO 引用、3 个 sitemap 规范网址、404 noindex、完整 dist。
- 原头像 SHA-256 与原交付文件一致；买 VPS 的原话与指定两句文案保留。未加入具体项目仓库链接。
- 两个业务 JS 模块通过 Node 语法检查。

## 验证边界

这是浏览器模拟尺寸，未测试手机真机、所有 GPU 或浏览器，也未实际模拟 WebGL 上下文丢失、禁用 JavaScript 或系统减少动态效果。源码包含对应的 SVG / 普通链接回退和低动态分支，但不把代码检查写成设备实测。

触屏横向环顾和纵向滚动的处理已实现；本次没有真实触屏输入设备验收。外部站点、Telegram、NodeSeek 的可用性没有逐个测试。

Python 本地服务器不应用 Cloudflare `_headers` / `_redirects`，本次检查的是配置文件及 CSP hash，未验证生产 HTTP 安全头、apex / www 跳转、真实 404 状态、缓存压缩、线上性能或搜索引擎收录。

## 再次检查

```sh
python3 scripts/build.py
python3 tests/check_site.py
node --input-type=module --check < assets/main.js
node --input-type=module --check < assets/scene.js
```

## 2026-11-01 迁入仓库与上线优化

- `python3 tests/check_site.py` 通过（新增：www 兄弟站链接、Telegram @leospmbot、404 绝对路径、CSP 无 unsafe-inline、旧 /cn/index.html 与 /en/index.html 跳转、dist 不含私有文件）。
- `wrangler deploy --dry-run` 与本地 wrangler 模拟：dist 24 个文件；/cn/、/cn/index.html → /zh-hans/，/en/index.html → /；深层未知路径、README、scripts、未打包 vendor 均返回 404；favicon.ico 301；CSP 与 X-Frame-Options 响应头存在。
- 浏览器（SwiftShader WebGL）在严格 CSP 下加载打包版：简中桌面 1440、英文手机 390 均渲染 3D 房间，无控制台错误、无横向溢出；点击「书本」后详情与房间链接均为 https://www.leoknox.me/。首页传输约 0.6 MB（原 2.25 MB）。
- 外部书签可用性（2026-11-01 从云端检查）：image.nimama.de 返回 525，wp.leoknox.de 与 key.leoknox.de 连接失败；未修改链接。

## 2026-11-01 首屏视图优化

- 相机改为按房间包围盒自动取景（采样默认视角附近的偏航/俯仰），任意宽高比下房间完整，不再被画布切掉墙顶与地板角；拖到最大角度（yaw 0.16 / pitch 0.9）仍完整。
- 舞台高度随视口：中文 `100svh - 300px`、英文 `100svh - 405px`（矮屏另有收紧）。1920×1080、1440×900、1280×720、1024×768、768×1024、390×844、360×740 下物件按钮都在首屏内（英/繁/简实测）。
- 控制按钮、提示、选中入口移到画面下方的独立操作条，不再压在 3D 地板上；≤1000px 隐藏手写便签和英文标签，头像贴纸缩小放到角落；手机隐藏「拖动环顾」提示。
- 画布四边 CSS 遮罩渐隐，镜头拉近时不再是硬直线裁切。

## 2026-11-01 v2：React + Vite + react-three-fiber，滚动走进房间

- 架构：`build.py` 渲染三语言静态 HTML 作为 Vite 入口；3D 层（React 19 + R3F 9 + three 0.186.1）懒加载；房间造型抽成 `buildRoom()`，与 v1 一致。
- `npm test`：三语言 metadata / hreflang / 3D 数据 / 四张入口卡片 / 链接 / 无内联脚本与内联样式 / 50 个引用、404、CSP 与缓存头、旧 URL 跳转、sitemap、头像字节、指定文案、dist 无私有文件 —— 通过。
- `wrangler deploy --dry-run`、本地 wrangler 模拟：/cn/index.html、/en/index.html 301；README、src、package.json 404；/static/ immutable、/assets/ 1 天。
- 浏览器（SwiftShader WebGL，生产 CSP 头下）：1440×900 简、1280×720 英、768×1024 繁、390×844 英/繁、360×740 简——第一屏全景完整、滚动中标题淡出镜头推进、进入后四个标签贴在物件上、点标签聚焦并打开卡片（焦点移到「进去看看」）、Esc 关闭、从全景直接点物件会自动滚入并聚焦。无 CSP 违规；唯一控制台警告来自 R3F 内部（THREE.Clock 弃用提示）。
- 降级：禁用 WebGL 时显示静态插画和入口卡片；减少动态效果偏好下镜头直接到位；键盘可聚焦标签并用 Enter 打开。
- 未测：真机触屏手势与真实 GPU 帧率（SwiftShader 为软件渲染）。
