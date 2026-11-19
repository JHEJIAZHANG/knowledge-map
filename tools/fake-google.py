#!/usr/bin/env python3
"""本机预览用的「假 Google」：只在 http://localhost:7690 跑，不会连到真的 Google。

网站按「用 Google 账号登录」后会转到这里，你可以选用哪个邮箱登录，
看看「允许的账号」和「不在名单里的账号」各会发生什么事。
由 tools/local-test.sh 启动，不用自己跑。
"""
import base64
import hashlib
import html
import json
import secrets
import time
from urllib.parse import urlencode

from aiohttp import web

codes = {}


def b64(d):
    return base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip('=')


PAGE = """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>假的 Google 登录</title>
<style>
body {{ margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; box-sizing: border-box;
       background: #f2f3f7; font: 16px/1.6 -apple-system, "PingFang SC", system-ui, sans-serif; color: #222; }}
main {{ width: min(440px, 100%); padding: 28px; border-radius: 24px; background: #fff; box-shadow: 0 6px 24px rgba(16,22,48,.08); }}
h1 {{ margin: 0 0 4px; font-size: 22px; }} p {{ margin: 0 0 16px; color: #666; font-size: 14px; }}
.tag {{ display: inline-block; margin-bottom: 12px; padding: 2px 10px; border-radius: 99px; background: #fff3d6; color: #9a6400; font-size: 13px; }}
a, button {{ display: block; width: 100%; box-sizing: border-box; margin-top: 10px; padding: 12px 16px; border: 1px solid #ddd; border-radius: 14px;
            background: #fff; color: inherit; font: inherit; text-align: left; text-decoration: none; cursor: pointer; }}
a:hover, button:hover {{ background: #f5f3ff; }} small {{ color: #888; }}
form {{ display: flex; gap: 8px; margin-top: 10px; }} input {{ flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid #ddd; border-radius: 12px; font: inherit; }}
form button {{ width: auto; margin: 0; }}
</style>
<main>
  <span class="tag">本机预览：这是假的 Google</span>
  <h1>选择要用哪个账号登录</h1>
  <p>真的上线后，这一步会是 Google 的登录页（还会要你输入 Authenticator 的验证码）。</p>
  <a href="{ok}">me@example.com<br><small>在允许名单里 → 应该进得去</small></a>
  <a href="{bad}">stranger@example.com<br><small>不在名单里 → 应该被挡下来</small></a>
  <form action="/choose"><input type="hidden" name="req" value="{req}"><input name="email" placeholder="或输入别的邮箱"><button>登录</button></form>
</main>"""


async def auth(request):
    req = b64(dict(request.query))
    link = lambda email: '/choose?' + urlencode({'req': req, 'email': email})
    return web.Response(text=PAGE.format(ok=html.escape(link('me@example.com')), bad=html.escape(link('stranger@example.com')),
                                         req=html.escape(req)), content_type='text/html')


async def choose(request):
    body = request.query['req']
    q = json.loads(base64.urlsafe_b64decode(body + '=' * (-len(body) % 4)))
    code = secrets.token_urlsafe(12)
    codes[code] = {**q, 'email': request.query.get('email', '').strip().lower()}
    raise web.HTTPFound(f"{q['redirect_uri']}?{urlencode({'code': code, 'state': q['state']})}")


async def token(request):
    f = await request.post()
    c = codes.pop(f.get('code', ''), None)
    if not c or f.get('redirect_uri') != c['redirect_uri']:
        return web.json_response({'error': 'invalid_grant'}, status=400)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(f.get('code_verifier', '').encode()).digest()).decode().rstrip('=')
    if challenge != c.get('code_challenge'):
        return web.json_response({'error': 'invalid_grant', 'error_description': 'PKCE'}, status=400)
    claims = {'iss': 'https://accounts.google.com', 'aud': c['client_id'], 'exp': int(time.time()) + 3600,
              'nonce': c['nonce'], 'email': c['email'], 'email_verified': True}
    return web.json_response({'id_token': f"{b64({'alg': 'none'})}.{b64(claims)}."})


app = web.Application()
app.router.add_get('/auth', auth)
app.router.add_get('/choose', choose)
app.router.add_post('/token', token)
web.run_app(app, host='127.0.0.1', port=7690, print=None, access_log=None)
