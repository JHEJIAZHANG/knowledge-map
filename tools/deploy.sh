#!/bin/bash
# 把网站更新到服务器：rsync 只传有改动的文件，几秒钟就好
#
# 用法（在项目文件夹）：
#   tools/deploy.sh          更新网页：文章、练习场、样式（最常用）
#   tools/deploy.sh server   连服务器程序（km-bridge.py、登录页）一起更新，并重启服务
#
# 改了 server/Dockerfile 的话，还要登录服务器重建镜像：cd ~/km-term && docker build -t km-term .
set -e
cd "$(dirname "$0")/.."
HOST="${KM_HOST:-ubuntu@140.245.37.255}"
KEY="${KM_KEY:-$HOME/.ssh/oci_ubuntu.key}"

echo "== 更新网页 =="
rsync -av --delete -e "ssh -i $KEY" index.html css js content "$HOST:~/km-site/"

if [ "$1" = server ]; then
  echo "== 更新服务器程序 =="
  rsync -av -e "ssh -i $KEY" server/Dockerfile server/km-bridge.py server/login.html server/km-bridge.service "$HOST:~/km-term/"
  ssh -i "$KEY" "$HOST" 'sudo systemctl restart km-bridge && echo "服务状态：$(systemctl is-active km-bridge)"'
fi
echo "完成。重新整理网页就会看到新的内容。"
