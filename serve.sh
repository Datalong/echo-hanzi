#!/usr/bin/env bash
# 一键启动本地站点（零依赖，只需要 python3）
set -e
PORT="${1:-8765}"
cd "$(dirname "$0")"
echo "Echo Hanzi -> http://127.0.0.1:${PORT}/"
python3 -m http.server "$PORT"
