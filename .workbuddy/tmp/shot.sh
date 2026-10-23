#!/bin/bash
# 用 Chrome headless 按 375x812 视口截取各页面，用于与高保真稿比对
# 用法: bash .workbuddy/tmp/shot.sh <输出目录> <路由:标题> ...
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
OUT="$1"; shift
mkdir -p "$OUT"
WIN_OUT=$(cygpath -m "$(pwd)/$OUT" 2>/dev/null || echo "$OUT")
for spec in "$@"; do
  route="${spec%%:*}"
  name="${spec##*:}"
  url="http://127.0.0.1:5180/#$route"
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --window-size=375,812 --force-device-scale-factor=2 \
    --virtual-time-budget=8000 \
    --screenshot="$WIN_OUT/$name.png" "$url" > /dev/null 2>&1
  if [ -f "$OUT/$name.png" ]; then
    echo "  OK  $name.png"
  else
    echo "  FAIL $name"
  fi
done
