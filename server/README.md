# 真终端机（服务器这一边）

练习场可以改用服务器上真的 Linux 作答。网页通过 Tailscale 连到这台服务器，桥接服务替每道题开一台 Docker 容器。

```
浏览器（练习场）──wss──▶ tailscale serve（只有你的设备连得到）
                          ▼
                    km-bridge.py（127.0.0.1:7681，要登录）
                          ▼
                    km-term 容器（Ubuntu 22.04、zsh、Python 3.10.12）
```

## 文件

| 文件 | 用途 |
| --- | --- |
| `Dockerfile` | 容器镜像：labex 的 UID 是 5000，在 sudo、ssl-cert、public 组里，和 LabEx 一样 |
| `km-bridge.py` | 桥接服务：登录、开容器、终端机、在容器里跑命令 |
| `km-bridge.service` | systemd 设置：开机自动启动，挂掉自己重开 |

## 部署

1. 在 Mac 的项目文件夹，把三个文件传上去：
   `scp -i ~/.ssh/oci_ubuntu.key server/Dockerfile server/km-bridge.py server/km-bridge.service ubuntu@140.245.37.255:~/km-term/`
2. 在服务器上执行下面几步。
   - 建镜像：`cd ~/km-term && docker build -t km-term .`
   - 装 websockets：`sudo apt update && sudo apt install -y python3-websockets`
   - 设置密码：`python3 ~/km-term/km-bridge.py passwd`
   - 先在前台试跑：`python3 ~/km-term/km-bridge.py serve`，看到「桥接服务启动」后按 Ctrl+C 停掉。
   - 设成开机启动：
     - `sudo cp ~/km-term/km-bridge.service /etc/systemd/system/`
     - `sudo systemctl daemon-reload`
     - `sudo systemctl enable --now km-bridge`
   - 对 Tailscale 开放：`sudo tailscale serve --bg 7681`
3. 网页上，到练习场点「接上真终端机」，填 `tailscale serve` 印出来的 `https://…ts.net` 网址。

## 安全设置

- 服务只听 `127.0.0.1`，外面只能通过 Tailscale 连进来。Oracle 的防火墙不用开任何端口。
- 一定要先登录。
  - 密码用 PBKDF2 存成哈希，放在 `~/.config/km-bridge/config.json`，权限是 600。
  - 连续输错 5 次，会锁 15 分钟。
  - 登录后发一个 30 天有效的 token。重新运行 `passwd` 会让所有设备都要重新登录。
- 容器的限制：
  - 不能上网；
  - 内存 256 MB，CPU 0.5 核，最多 200 个进程；
  - 最多同时留 8 台；
  - 24 小时没用就自动删掉。

## 常用命令

- 看服务的状态：`systemctl status km-bridge`
- 看服务的日志：`journalctl -u km-bridge -f`
- 列出所有练习容器：`docker ps -a --filter label=km=1`
- 删掉所有练习容器：`docker rm -f $(docker ps -aq --filter label=km=1)`
- 逐题检查（在 Mac 上运行）：`KM_PW='密码' node tools/real-check.js wss://…ts.net`
