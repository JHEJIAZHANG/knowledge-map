#!/bin/bash
# 在本机预览「服务器版」的网站：要登录才看得到内容、真终端机，Google 登录用假的（tools/fake-google.py）
#
# 第一次要先准备：
#   1. 打开 OrbStack（Mac 上的 Docker）
#   2. python3 -m venv ~/km-venv && ~/km-venv/bin/pip install aiohttp
# 然后在项目文件夹运行：tools/local-test.sh，用浏览器打开 http://localhost:7681，按 Ctrl+C 结束。
#
# 想在本机试真的 Google：先 KM_CONFIG=~/.config/km-bridge/local.json ~/km-venv/bin/python server/km-bridge.py setup
# （网址填 http://localhost:7681，Google Cloud 的重定向 URI 加上 http://localhost:7681/auth/callback），
# 再运行 tools/local-test.sh real。
set -e
cd "$(dirname "$0")/.."
PY="${KM_PY:-$HOME/km-venv/bin/python}"

if [ ! -x "$PY" ] || ! "$PY" -c 'import aiohttp' 2>/dev/null; then
  echo '还没准备 Python 环境，先运行：python3 -m venv ~/km-venv && ~/km-venv/bin/pip install aiohttp'
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo 'Docker 没开：先打开 OrbStack，等它启动好再运行一次。'
  exit 1
fi
if ! docker image inspect km-term >/dev/null 2>&1; then
  echo '第一次运行：建 km-term 镜像（要几分钟）……'
  docker build -t km-term server
fi

if [ "$1" = real ]; then
  # 真的 Google：用 setup 存好的本机设置
  export KM_CONFIG="$HOME/.config/km-bridge/local.json"
  [ -f "$KM_CONFIG" ] || { echo "还没设置：先运行 KM_CONFIG=$KM_CONFIG $PY server/km-bridge.py setup"; exit 1; }
else
  # 假的 Google：临时的设置，结束就删掉；允许的邮箱是 me@example.com
  TMP="$(mktemp -d)"
  export KM_CONFIG="$TMP/config.json"
  "$PY" -c 'import json, secrets, sys; json.dump({"public_url": "http://localhost:7681", "client_id": "fake-client", "client_secret": "fake-secret", "allowed": ["me@example.com"], "secret": secrets.token_hex(32)}, open(sys.argv[1], "w"))' "$KM_CONFIG"
  "$PY" tools/fake-google.py &
  FAKE=$!
  trap 'kill $FAKE 2>/dev/null; rm -rf "$TMP"' EXIT
  export KM_GOOGLE_AUTH=http://localhost:7690/auth KM_GOOGLE_TOKEN=http://localhost:7690/token
fi

export KM_SITE="$PWD"
echo '用浏览器打开 http://localhost:7681 （要用 localhost，不要用 127.0.0.1）；按 Ctrl+C 结束。'
"$PY" server/km-bridge.py serve
