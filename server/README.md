# 网站服务器和真终端机（服务器这一边）

网站放在 Oracle 服务器上，**整个网站都要先用 Google 账号登录**，而且只放行指定的 Gmail。Authenticator（两步验证）由 Google 负责。练习场的真终端机共用同一次登录，每道题开一台 Docker 容器。对外的网址由 Tailscale Funnel 提供，Oracle 的防火墙不用开任何端口。

```
任何浏览器 ──https──▶ tailscale funnel（https://…ts.net）
                         ▼
                   km-bridge.py（127.0.0.1:7681）
                   ├─ /login               登录页（「用 Google 账号登录」按钮）
                   ├─ /auth/google         转去 Google 登录
                   ├─ /auth/callback       Google 转回来：检查邮箱，对了才发登录 Cookie
                   ├─ 其他网址             网站文件（~/km-site），没登录就转到登录页
                   └─ /ws                  真终端机
                         ▼
                   km-term 容器（Ubuntu 22.04、zsh、Python 3.10.12）
```

## 文件

| 文件 | 用途 |
| --- | --- |
| `Dockerfile` | 容器镜像：labex 的 UID 是 5000，在 sudo、ssl-cert、public 组里，和 LabEx 一样 |
| `km-bridge.py` | 网站服务器和桥接服务：Google 登录、送出网站文件、开容器、终端机 |
| `login.html` | 登录页 |
| `km-bridge.service` | systemd 设置：开机自动启动，挂掉自己重开 |

## 先在本机预览（不用服务器，也不用设置 Google）

1. 打开 OrbStack（Mac 上的 Docker）。
2. 第一次要先建 Python 环境：`python3 -m venv ~/km-venv && ~/km-venv/bin/pip install aiohttp`
3. 在项目文件夹运行 `tools/local-test.sh`，再用浏览器打开 `http://localhost:7681`。
   - Google 登录用的是假的（`tools/fake-google.py`）。允许的账号是 `me@example.com`，也可以选一个不在名单里的账号试试。
   - 按 Ctrl+C 结束，临时的设置会自动删掉。
4. 想在本机试**真的** Google：
   - 在 Google Cloud 的「已获授权的重定向 URI」另外加上 `http://localhost:7681/auth/callback`；
   - 运行 `KM_CONFIG=~/.config/km-bridge/local.json ~/km-venv/bin/python server/km-bridge.py setup`，网址填 `http://localhost:7681`；
   - 再运行 `tools/local-test.sh real`。

## 部署

### 1. 传文件（在 Mac 的项目文件夹）

- 服务器要用的文件：
  `scp -i ~/.ssh/oci_ubuntu.key server/Dockerfile server/km-bridge.py server/login.html server/km-bridge.service ubuntu@140.245.37.255:~/km-term/`
- 网站文件。以后每次更新网站，也是运行这一行：
  `rsync -av --delete -e "ssh -i ~/.ssh/oci_ubuntu.key" index.html css js content ubuntu@140.245.37.255:~/km-site/`

### 2. 服务器上的准备

- 建镜像：`cd ~/km-term && docker build -t km-term .`
- 装 aiohttp：`sudo apt update && sudo apt install -y python3-aiohttp`
- 公开到互联网：`sudo tailscale funnel --bg 7681`，记下印出来的 `https://…ts.net` 网址。

### 3. 在 Google Cloud 建「登录用的钥匙」（在浏览器操作）

1. 打开 console.cloud.google.com，新建一个项目，例如 `knowledge-map`。
2. 左边菜单进入 **Google Auth Platform**（或「API 和服务 → OAuth 同意屏幕」），按「开始」：
   - 应用名称填「知识地图」，支持邮箱选你的 Gmail；
   - 受众（Audience）选 **External（外部）**；
   - 发布状态保持 **Testing（测试）**，在「测试用户」加上你的 Gmail。
3. 进入 **Clients（客户端）→ 建立客户端**：
   - 类型选 **Web 应用**；
   - 「已获授权的重定向 URI」填 `https://…ts.net/auth/callback`（换成你的网址）。
4. 建好后会显示 **Client ID** 和 **Client secret**。Client secret 只给服务器用，不要贴到网页或聊天里。

### 4. 设置并启动

- 设置：`python3 ~/km-term/km-bridge.py setup`，依序填网址、Client ID、Client secret（输入时不会显示）、你的 Gmail。
- 先在前台试跑：`python3 ~/km-term/km-bridge.py serve`，用浏览器打开网址登录一次，成功后按 Ctrl+C 停掉。
- 设成开机启动：
  - `sudo cp ~/km-term/km-bridge.service /etc/systemd/system/`
  - `sudo systemctl daemon-reload`
  - `sudo systemctl enable --now km-bridge`

### 5. 打开两步验证（Authenticator）

到 myaccount.google.com → 安全性 → **两步验证**，打开它，再加上「Authenticator 应用」。以后在新设备登录网站时，Google 会要求输入 Authenticator 的验证码。

### 6. 把 GitHub 仓库改成 Private

不改的话，别人还是可以直接在 GitHub 上看到全部内容。

## 安全设置

- 服务只听 `127.0.0.1`，外面只能通过 Tailscale Funnel 连进来。
- 没登录时，除了登录页什么都拿不到，包括文章、JS 文件和真终端机。
- Google 登录的检查：
  - 用授权码流程加 PKCE；
  - 用 state 防止别人伪造登录回调；
  - 用 nonce 防止拿旧的登录结果重复使用；
  - ID token 的发行者、对象、有效时间都要对，邮箱要已验证，而且在允许名单里。
- 登录状态：
  - 用服务器的密钥签名的 Cookie，30 天有效，设成 HttpOnly、Secure、SameSite=Lax，网页里的 JavaScript 读不到。
  - 侧边栏有「退出登录」。
  - `km-bridge.py logout-all` 会让所有设备都要重新登录。
- 网址不能用 `../` 跑出 `~/km-site`，也不会送出隐藏文件（例如 `.git`）。
- 真终端机只接受「同一个网址」发出的连接，别的网站不能借用你的登录。
- 容器的限制：
  - 不能上网；
  - 内存 256 MB，CPU 0.5 核，最多 200 个进程；
  - 最多同时留 8 台；
  - 24 小时没用就自动删掉。
- 设置文件 `~/.config/km-bridge/config.json` 的权限是 600，里面有 Client secret 和签名密钥。

## 常用命令

- 看服务的状态：`systemctl status km-bridge`
- 看服务的日志，包括谁登录成功、谁被拒绝：`journalctl -u km-bridge -f`
- 改了 `km-bridge.py` 或设置之后重启：`sudo systemctl restart km-bridge`
- 看 Funnel 的设置：`tailscale funnel status`
- 关掉公开：`sudo tailscale funnel --https=443 off`
- 删掉所有练习容器：`docker rm -f $(docker ps -aq --filter label=km=1)`
- 逐题检查：
  1. 在服务器上运行 `python3 ~/km-term/km-bridge.py token`，印出一个 token；
  2. 在 Mac 上运行 `KM_TOKEN=token node tools/real-check.js wss://…ts.net/ws`。
