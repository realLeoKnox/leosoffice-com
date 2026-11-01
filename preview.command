#!/bin/zsh
# Leo's Office local preview: install deps once, then start the Vite dev server (hot reload).
cd "$(dirname "$0")" || exit 1
[ -d node_modules ] || npm install --no-audit --no-fund || exit 1
printf '本地预览：http://127.0.0.1:5682/zh-hans/\n停止：按 Ctrl+C\n'
(sleep 2; open "http://127.0.0.1:5682/zh-hans/") &
npm run dev
