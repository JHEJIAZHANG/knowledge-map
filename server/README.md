# 网站服务器和真终端机（服务器这一边）

网站放在 Oracle 服务器上，**整个网站都要先登录**才看得到内容。练习场的真终端机共用同一次登录，每道题开一台 Docker 容器。对外的网址由 Tailscale Funnel 提供：任何浏览器都打得开登录页，但 Oracle 的防火墙不用开任何端口。

```
任何浏览器 ──https──▶ tailscale funnel（https://…ts.net）
                         ▼
                   km-bridge.py（127.0.0.1:7681）
                   ├─ /login、/api/login     登录页、登录
                   ├─ 其他网址               网站文件（~/km-site），没登录就转到登录页
                   └─ /ws                    真终端机
                         ▼
                   km-term 容器（Ubuntu 22.04、zsh、Python 3.10.12）
```

## 文件

| 文件 | 用途 |
| --- | --- |
| `Dockerfile` | 容器镜像：labex 的 UID 是 5000，在 sudo、ssl-cert、public 组里，和 LabEx 一样 |
| `km-bridge.py` | 网站服务器和桥接服务：登录、送出网站文件、开容器、终端机 |
| `login.html` | 登录页 |
| `km-bridge.service` | systemd 设置：开机自动启动，挂掉自己重开 |

## 部署

1. 在 Mac 的项目文件夹，把服务器要用的文件传上去：
   `scp -i ~/.ssh/oci_ubuntu.key server/Dockerfile server/km-bridge.py server/login.html server/km-bridge.service ubuntu@140.245.37.255:~/km-term/`
2. 同步网站文件。以后每次更新网站，也是运行这一行：
   `rsync -av --delete -e "ssh -i ~/.ssh/oci_ubuntu.key" index.html css js content ubuntu@140.245.37.255:~/km-site/`
3. 在服务器上执行下面几步。
   - 建镜像：`cd ~/km-term && docker build -t km-term .`
   - 装 aiohttp：`sudo apt update && sudo apt install -y python3-aiohttp`
   - 设置密码（至少 12 个字）：`python3 ~/km-term/km-bridge.py passwd`
   - 先在前台试跑：`python3 ~/km-term/km-bridge.py serve`，看到「服务启动」后按 Ctrl+C 停掉。
   - 设成开机启动：
     - `sudo cp ~/km-term/km-bridge.service /etc/systemd/system/`
     - `sudo systemctl daemon-reload`
     - `sudo systemctl enable --now km-bridge`
   - 公开到互联网：`sudo tailscale funnel --bg 7681`
4. 用任何浏览器打开 Funnel 印出来的 `https://…ts.net`，会先看到登录页。
5. 把 GitHub 仓库改成 Private。不改的话，别人还是可以直接在 GitHub 上看到全部内容。

## 安全设置

- 服务只听 `127.0.0.1`，外面只能通过 Tailscale Funnel 连进来。
- 没登录时，除了登录页什么都拿不到，包括文章、JS 文件和真终端机。
- 网址不能用 `../` 跑出 `~/km-site`，也不会送出隐藏文件（例如 `.git`）。
- 密码：
  - 用 PBKDF2 存成哈希，放在 `~/.config/km-bridge/config.json`，权限是 600。
  - 连续输错 5 次，所有人都要等 15 分钟。所以别人一直乱试，你也会暂时登录不了。
- 登录状态：
  - 登录后发一个 30 天有效的 Cookie，设成 HttpOnly、Secure、SameSite=Lax。
  - 侧边栏有「退出登录」。
  - 重新运行 `passwd` 会让所有设备都要重新登录。
- 真终端机只接受「同一个网址」发出的连接，别的网站不能借用你的登录。
- 容器的限制：
  - 不能上网；
  - 内存 256 MB，CPU 0.5 核，最多 200 个进程；
  - 最多同时留 8 台；
  - 24 小时没用就自动删掉。

## 常用命令

- 看服务的状态：`systemctl status km-bridge`
- 看服务的日志，包括登录记录：`journalctl -u km-bridge -f`
- 改了 `km-bridge.py` 之后重启：`sudo systemctl restart km-bridge`
- 看 Funnel 的设置：`tailscale funnel status`
- 关掉公开：`sudo tailscale funnel --https=443 off`
- 列出所有练习容器：`docker ps -a --filter label=km=1`
- 删掉所有练习容器：`docker rm -f $(docker ps -aq --filter label=km=1)`
- 逐题检查（在 Mac 上运行）：`KM_PW='密码' node tools/real-check.js wss://…ts.net/ws`
