#!/usr/bin/env bash
# 用 headless Chrome 跑浏览器内冒烟测试
set -e
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
PORT="${PORT:-8791}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "需要 python3 来启动本地服务"; exit 1
fi
if [ ! -x "$CHROME" ]; then
  echo "找不到 Chrome，可用 CHROME=/path/to/chrome ./tests/run.sh 指定"; exit 1
fi

python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/echo-hanzi-test.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
sleep 1

echo "运行 tests/smoke.html ..."
# 输出只取页面里的测试日志，避免误匹配脚本源码中的字符串
OUT=$("$CHROME" --headless=new --disable-gpu --no-sandbox \
  --virtual-time-budget=20000 --dump-dom \
  "http://127.0.0.1:${PORT}/tests/smoke.html" 2>/dev/null)

LOG=$(echo "$OUT" | sed -n '/<pre id="log">/,/<\/pre>/p' | sed 's/<[^>]*>//g')
echo "$LOG"

if echo "$LOG" | grep -q '^FAIL'; then
  echo "❌ 有失败用例"
  exit 1
fi
if ! echo "$LOG" | grep -q '^PASS'; then
  echo "❌ 没拿到测试输出"
  exit 1
fi
echo "✅ 全部通过"
