#!/bin/zsh
cd -- "$(dirname -- "$0")"
python3 scripts/build.py
open http://127.0.0.1:5682/zh-hans/
python3 -m http.server 5682 --bind 127.0.0.1 --directory dist
