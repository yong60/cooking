#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Couple Cook API MVP, Python stdlib only."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, urlencode
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from pathlib import Path
from datetime import datetime
import hashlib
import json
import os
import threading

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get('DATA_DIR') or (BASE_DIR / 'data'))
DB_FILE = DATA_DIR / 'db.json'
CATALOG_FILE = BASE_DIR / 'catalog.json'
PORT = int(os.environ.get('PORT') or 31080)
LOCK = threading.Lock()

with CATALOG_FILE.open('r', encoding='utf-8') as f:
    CATALOG = json.load(f)
RECIPES = CATALOG.get('recipes', [])
INGREDIENTS = CATALOG.get('ingredients', [])


def save_catalog():
    CATALOG_FILE.write_text(json.dumps({'recipes': RECIPES, 'ingredients': INGREDIENTS}, ensure_ascii=True, indent=2), encoding='utf-8')


def persisted_admin_user_ids(db=None):
    if db is None:
        try:
            db = read_db()
        except Exception:
            db = {}
    values = db.get('adminUserIds') or []
    if isinstance(values, str):
        values = values.replace('\n', ',').replace(';', ',').split(',')
    return {str(item).strip() for item in values if str(item).strip()}


def admin_user_ids(db=None):
    raw = os.environ.get('ADMIN_USER_IDS') or os.environ.get('ADMIN_OPENIDS') or ''
    ids = {item.strip() for item in raw.replace('\n', ',').replace(';', ',').split(',') if item.strip()}
    ids.update(persisted_admin_user_ids(db))
    return ids


def is_admin(user_id, db=None):
    ids = admin_user_ids(db)
    return bool(user_id and (user_id in ids or '*' in ids))


def grant_admin(db, user_id):
    if not user_id:
        return False
    admins = db.setdefault('adminUserIds', [])
    if user_id not in admins:
        admins.append(user_id)
    return True


def require_admin(body=None, query=None):
    user_id = ''
    if body:
        user_id = body.get('userId') or ''
    if not user_id and query:
        user_id = (query.get('userId') or [''])[0]
    if not is_admin(user_id):
        return False, user_id
    return True, user_id


def next_id(prefix, rows):
    used = []
    for item in rows:
        value = str(item.get('id', ''))
        if value.startswith(prefix):
            try:
                used.append(int(value[len(prefix):]))
            except Exception:
                pass
    return f'{prefix}{max(used or [0]) + 1:03d}'


def clean_recipe(item, current_id=None):
    item = item or {}
    rid = current_id or item.get('id') or next_id('r', RECIPES)
    ingredients = item.get('ingredients') or []
    if isinstance(ingredients, str):
        ingredients = [x.strip() for x in ingredients.replace('\uFF0C', ',').split(',') if x.strip()]
    tags = item.get('tags') or []
    if isinstance(tags, str):
        tags = [x.strip() for x in tags.replace('\uFF0C', ',').split(',') if x.strip()]
    return {
        'id': rid,
        'categoryId': item.get('categoryId') or 'home',
        'name': item.get('name') or '\u672a\u547d\u540d',
        'desc': item.get('desc') or '',
        'ingredients': ingredients,
        'tags': tags,
        'cover': item.get('cover') or rid[-2:]
    }


def clean_ingredient(item, current_id=None):
    item = item or {}
    iid = current_id or item.get('id') or next_id('i', INGREDIENTS)
    return {
        'id': iid,
        'categoryId': item.get('categoryId') or 'veg',
        'name': item.get('name') or '\u672a\u547d\u540d',
        'emoji': item.get('emoji') or iid[-2:]
    }


def now_iso():
    return datetime.now().isoformat(timespec='seconds')


def empty_state():
    return {'cart': [], 'selectedIngredientIds': [], 'submitLogs': []}


def single_couple_id(user_id):
    return 'single_' + str(user_id or '')


def pair_couple_id(a, b):
    left, right = sorted([str(a or ''), str(b or '')])
    return 'couple_' + hashlib.sha1((left + ':' + right).encode('utf-8')).hexdigest()[:16]


def is_bound_user(user):
    cid = (user or {}).get('coupleId') or ''
    return bool(cid and not cid.startswith('single_'))


def merge_states(*states):
    merged = empty_state()
    cart = {}
    selected = []
    logs = []
    for state in states:
        if not state:
            continue
        for row in state.get('cart', []):
            rid = row.get('recipeId')
            qty = int(row.get('quantity') or 0)
            if rid and qty > 0:
                cart[rid] = max(cart.get(rid, 0), qty)
        for iid in state.get('selectedIngredientIds', []):
            if iid not in selected:
                selected.append(iid)
        logs.extend(state.get('submitLogs', [])[:20])
    merged['cart'] = [{'recipeId': rid, 'quantity': qty} for rid, qty in cart.items()]
    merged['selectedIngredientIds'] = selected
    merged['submitLogs'] = logs[:50]
    merged['updatedAt'] = now_iso()
    return merged


def ensure_db():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DB_FILE.exists():
        DB_FILE.write_text(json.dumps({'users': {}, 'couples': {'default': empty_state()}}, ensure_ascii=True, indent=2), encoding='utf-8')


def read_db():
    ensure_db()
    return json.loads(DB_FILE.read_text(encoding='utf-8'))


def write_db(db):
    ensure_db()
    tmp = DB_FILE.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(db, ensure_ascii=True, indent=2), encoding='utf-8')
    tmp.replace(DB_FILE)


def get_couple(db, user_id):
    user = db.get('users', {}).get(user_id or '')
    couple_id = (user or {}).get('coupleId') or single_couple_id(user_id)
    db.setdefault('couples', {})
    db['couples'].setdefault(couple_id, empty_state())
    return db['couples'][couple_id]


def recipe_name(recipe_id):
    for item in RECIPES:
        if item.get('id') == recipe_id:
            return item.get('name', recipe_id)
    return recipe_id


def ingredient_name(ingredient_id):
    for item in INGREDIENTS:
        if item.get('id') == ingredient_id:
            return item.get('name', ingredient_id)
    return ingredient_id


def public_user(user_id, db):
    user = (db.get('users') or {}).get(user_id or '') or {}
    return {
        'id': user_id or '',
        'nickName': user.get('nickName') or "\u5fae\u4fe1\u7528\u6237",
        'avatarUrl': user.get('avatarUrl') or '',
    }


def order_log_id(prefix='order'):
    return f'{prefix}_{datetime.now().strftime("%Y%m%d%H%M%S%f")}'


def json_get(url, timeout=8):
    with urlopen(url, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


def json_post(url, payload, timeout=10):
    body = json.dumps(payload, ensure_ascii=True).encode('utf-8')
    req = Request(url, data=body, headers={'content-type': 'application/json'}, method='POST')
    with urlopen(req, timeout=timeout) as resp:
        raw = resp.read().decode('utf-8')
        try:
            return json.loads(raw or '{}')
        except json.JSONDecodeError:
            return {'raw': raw}


def resolve_openid(code):
    appid = os.environ.get('WECHAT_APPID')
    secret = os.environ.get('WECHAT_SECRET')
    if appid and secret and code:
        query = urlencode({'appid': appid, 'secret': secret, 'js_code': code, 'grant_type': 'authorization_code'})
        try:
            result = json_get(f'https://api.weixin.qq.com/sns/jscode2session?{query}')
            if result.get('openid'):
                return result['openid']
        except Exception as exc:
            print('wechat login fallback:', exc, flush=True)
    return 'demo_' + hashlib.sha1(str(code or datetime.now().timestamp()).encode('utf-8')).hexdigest()[:16]


def pushplus(title, content):
    raw = os.environ.get('PUSHPLUS_TOKENS') or os.environ.get('PUSHPLUS_TOKEN') or ''
    tokens = [item.strip() for item in raw.replace('\n', ',').replace(';', ',').split(',') if item.strip()]
    if not tokens:
        return {'skipped': True, 'reason': 'PUSHPLUS_TOKEN not configured'}
    results = []
    for token in tokens:
        try:
            results.append(json_post('https://www.pushplus.plus/send', {
                'token': token,
                'title': title,
                'content': content,
                'template': 'txt',
            }))
        except Exception as exc:
            results.append({'error': str(exc)})
    return {'count': len(tokens), 'results': results}


def recommend_by_ingredients(selected_ids, dish_count=1, with_soup=False):
    selected = set(selected_ids or [])

    def score(item):
        matched = [x for x in item.get('ingredients', []) if x in selected]
        row = dict(item)
        row['matchedIngredients'] = matched
        row['score'] = len(matched)
        return row

    try:
        count = max(1, min(3, int(dish_count or 1)))
    except Exception:
        count = 1

    mains = [score(x) for x in RECIPES if x.get('categoryId') != 'soup']
    mains = [x for x in mains if x.get('score', 0) > 0]
    mains.sort(key=lambda x: (-x.get('score', 0), len(x.get('ingredients', []))))
    result = mains[:count] or [dict(x) for x in RECIPES if x.get('categoryId') != 'soup'][:count]
    if with_soup:
        soups = [score(x) for x in RECIPES if x.get('categoryId') == 'soup']
        soups.sort(key=lambda x: -x.get('score', 0))
        if soups:
            result.append(soups[0])
    return result


class Handler(BaseHTTPRequestHandler):
    server_version = 'CoupleCookAPI/0.1'

    def log_message(self, fmt, *args):
        print('%s - %s' % (self.address_string(), fmt % args), flush=True)

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=True).encode('utf-8')
        self.send_response(status)
        self.send_header('content-type', 'application/json; charset=utf-8')
        self.send_header('access-control-allow-origin', '*')
        self.send_header('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS')
        self.send_header('access-control-allow-headers', 'content-type')
        self.send_header('content-length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get('content-length') or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode('utf-8')
        return json.loads(raw or '{}')

    def do_OPTIONS(self):
        self.send_json(204, {})

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        try:
            if parsed.path == '/health':
                return self.send_json(200, {'ok': True, 'time': now_iso()})
            if parsed.path == '/api/recipes':
                return self.send_json(200, {'recipes': RECIPES})
            if parsed.path == '/api/ingredients':
                return self.send_json(200, {'ingredients': INGREDIENTS})
            if parsed.path == '/api/admin/status':
                ok, user_id = require_admin(query=query)
                return self.send_json(200, {'isAdmin': ok})
            if parsed.path == '/api/admin/catalog':
                ok, user_id = require_admin(query=query)
                if not ok:
                    return self.send_json(403, {'message': 'permission denied'})
                return self.send_json(200, {'recipes': RECIPES, 'ingredients': INGREDIENTS})
            if parsed.path == '/api/state':
                user_id = (query.get('userId') or [''])[0]
                with LOCK:
                    db = read_db()
                    state = get_couple(db, user_id)
                    write_db(db)
                return self.send_json(200, {'state': state})
            if parsed.path == '/api/orders':
                user_id = (query.get('userId') or [''])[0]
                with LOCK:
                    db = read_db()
                    state = get_couple(db, user_id)
                    logs = state.get('submitLogs', [])[:100]
                return self.send_json(200, {'logs': logs})
            return self.send_json(404, {'message': 'Not found'})
        except Exception as exc:
            return self.send_json(500, {'message': str(exc)})

    def do_POST(self):
        parsed = urlparse(self.path)
        try:
            body = self.read_body()
            if parsed.path == '/api/auth/wechat-login':
                openid = resolve_openid(body.get('code'))
                profile = body.get('profile') or {}
                with LOCK:
                    db = read_db()
                    old = db.setdefault('users', {}).get(openid, {})
                    user = {
                        'id': openid,
                        'nickName': profile.get('nickName') or old.get('nickName') or "\u5fae\u4fe1\u7528\u6237",
                        'avatarUrl': profile.get('avatarUrl') or old.get('avatarUrl') or '',
                        'coupleId': old.get('coupleId') or single_couple_id(openid),
                        'updatedAt': now_iso(),
                    }
                    user['isBound'] = is_bound_user(user)
                    db.setdefault('users', {})[openid] = user
                    db.setdefault('couples', {}).setdefault(user['coupleId'], empty_state())
                    write_db(db)
                return self.send_json(200, {'user': user})

            if parsed.path == '/api/user/profile':
                user_id = body.get('userId') or ''
                with LOCK:
                    db = read_db()
                    user = db.setdefault('users', {}).get(user_id)
                    if not user:
                        return self.send_json(404, {'message': 'user not found'})
                    if 'nickName' in body:
                        user['nickName'] = str(body.get('nickName') or "\u5fae\u4fe1\u7528\u6237")[:40]
                    if 'avatarUrl' in body:
                        user['avatarUrl'] = str(body.get('avatarUrl') or '')
                    user['updatedAt'] = now_iso()
                    user['isBound'] = is_bound_user(user)
                    db['users'][user_id] = user
                    write_db(db)
                return self.send_json(200, {'user': user})

            if parsed.path == '/api/user/bind-partner':
                user_id = body.get('userId') or ''
                partner_id = body.get('partnerId') or ''
                if not user_id or not partner_id or user_id == partner_id:
                    return self.send_json(400, {'message': 'invalid partner id'})
                with LOCK:
                    db = read_db()
                    users = db.setdefault('users', {})
                    user = users.get(user_id)
                    partner = users.get(partner_id)
                    if not user or not partner:
                        return self.send_json(404, {'message': 'partner not found'})
                    old_a = user.get('coupleId') or single_couple_id(user_id)
                    old_b = partner.get('coupleId') or single_couple_id(partner_id)
                    new_cid = pair_couple_id(user_id, partner_id)
                    db.setdefault('couples', {})
                    db['couples'][new_cid] = merge_states(db['couples'].get(old_a), db['couples'].get(old_b))
                    user['coupleId'] = new_cid
                    partner['coupleId'] = new_cid
                    user['partnerId'] = partner_id
                    partner['partnerId'] = user_id
                    user['isBound'] = True
                    partner['isBound'] = True
                    user['updatedAt'] = now_iso()
                    partner['updatedAt'] = now_iso()
                    write_db(db)
                return self.send_json(200, {'user': user})

            if parsed.path == '/api/user/unbind':
                user_id = body.get('userId') or ''
                with LOCK:
                    db = read_db()
                    user = db.setdefault('users', {}).get(user_id)
                    if not user:
                        return self.send_json(404, {'message': 'user not found'})
                    old = user.get('coupleId') or single_couple_id(user_id)
                    new_cid = single_couple_id(user_id)
                    db.setdefault('couples', {})[new_cid] = merge_states(db.setdefault('couples', {}).get(old))
                    user['coupleId'] = new_cid
                    user.pop('partnerId', None)
                    user['isBound'] = False
                    user['updatedAt'] = now_iso()
                    write_db(db)
                return self.send_json(200, {'user': user})

            if parsed.path == '/api/admin/unlock':
                user_id = body.get('userId') or ''
                if not user_id:
                    return self.send_json(400, {'message': 'missing userId'})
                with LOCK:
                    db = read_db()
                    db.setdefault('users', {}).setdefault(user_id, {
                        'id': user_id,
                        'nickName': "\u5fae\u4fe1\u7528\u6237",
                        'avatarUrl': '',
                        'coupleId': single_couple_id(user_id),
                        'updatedAt': now_iso(),
                    })
                    db.setdefault('couples', {}).setdefault(db['users'][user_id].get('coupleId') or single_couple_id(user_id), empty_state())
                    already_admin = is_admin(user_id, db)
                    grant_admin(db, user_id)
                    write_db(db)
                return self.send_json(200, {'ok': True, 'isAdmin': True, 'alreadyAdmin': already_admin})

            if parsed.path == '/api/admin/recipes':
                ok, user_id = require_admin(body=body)
                if not ok:
                    return self.send_json(403, {'message': 'permission denied'})
                item = clean_recipe(body.get('item') or body)
                with LOCK:
                    RECIPES.append(item)
                    save_catalog()
                return self.send_json(200, {'ok': True, 'item': item})

            if parsed.path == '/api/admin/ingredients':
                ok, user_id = require_admin(body=body)
                if not ok:
                    return self.send_json(403, {'message': 'permission denied'})
                item = clean_ingredient(body.get('item') or body)
                with LOCK:
                    INGREDIENTS.append(item)
                    save_catalog()
                return self.send_json(200, {'ok': True, 'item': item})

            if parsed.path == '/api/submit/cart':
                with LOCK:
                    db = read_db()
                    user_id = body.get('userId')
                    state = get_couple(db, user_id)
                    cart = body.get('cart') if isinstance(body.get('cart'), list) else state.get('cart', [])
                    lines = '\n'.join([f"- {recipe_name(x.get('recipeId'))} x{x.get('quantity')}" for x in cart]) or '- ?'
                    content = f"\u4eca\u665a\u60f3\u5403\uff1a\n{lines}\n\n\u5907\u6ce8\uff1a" + str(body.get('remark') or "\u65e0") + "\n\u65f6\u95f4\uff1a" + now_iso()
                    notify = pushplus("\u80e1\u95f9\u53a8\u623f\uff1a\u70b9\u83dc\u63d0\u4ea4", content) if body.get('notifyEnabled', True) else {'skipped': True, 'reason': 'user disabled'}
                    state.setdefault('submitLogs', []).insert(0, {
                        'id': order_log_id('cart'),
                        'type': 'cart',
                        'cart': cart,
                        'remark': body.get('remark') or '',
                        'notifyEnabled': body.get('notifyEnabled', True),
                        'notify': notify,
                        'submitter': public_user(user_id, db),
                        'createdAt': now_iso()
                    })
                    write_db(db)
                return self.send_json(200, {'ok': True, 'notify': notify})

            if parsed.path == '/api/submit/ingredients':
                with LOCK:
                    db = read_db()
                    user_id = body.get('userId')
                    state = get_couple(db, user_id)
                    ids = body.get('selectedIngredientIds') if isinstance(body.get('selectedIngredientIds'), list) else state.get('selectedIngredientIds', [])
                    lines = '\n'.join([f'- {ingredient_name(x)}' for x in ids]) or '- ?'
                    content = f"\u4eca\u5929\u60f3\u7528\u8fd9\u4e9b\u98df\u6750\u505a\u996d\uff1a\n{lines}\n\n\u53ef\u4ee5\u53bb\u98df\u6750\u7ec4\u5408\u9875\u770b\u770b\u63a8\u8350\u83dc\u5355\u3002\n\u65f6\u95f4\uff1a" + now_iso()
                    notify = pushplus("\u80e1\u95f9\u53a8\u623f\uff1a\u98df\u6750\u63d0\u4ea4", content) if body.get('notifyEnabled', True) else {'skipped': True, 'reason': 'user disabled'}
                    state.setdefault('submitLogs', []).insert(0, {
                        'id': order_log_id('ingredients'),
                        'type': 'ingredients',
                        'selectedIngredientIds': ids,
                        'notifyEnabled': body.get('notifyEnabled', True),
                        'notify': notify,
                        'submitter': public_user(user_id, db),
                        'createdAt': now_iso()
                    })
                    write_db(db)
                return self.send_json(200, {'ok': True, 'notify': notify})

            if parsed.path == '/api/recommend':
                return self.send_json(200, {
                    'recommendations': recommend_by_ingredients(body.get('selectedIngredientIds') or [], body.get('dishCount') or 1, bool(body.get('withSoup'))),
                    'source': 'local-recipe',
                })

            if parsed.path == '/api/notify/test':
                notify = pushplus("\u80e1\u95f9\u53a8\u623f\uff1a\u6d4b\u8bd5\u901a\u77e5", "\u8fd9\u662f\u4e00\u6761\u6d4b\u8bd5\u901a\u77e5\u3002\n\u65f6\u95f4\uff1a" + now_iso())
                return self.send_json(200, {'ok': True, 'notify': notify})

            return self.send_json(404, {'message': 'Not found'})
        except Exception as exc:
            return self.send_json(500, {'message': str(exc)})

    def do_PUT(self):
        parsed = urlparse(self.path)
        try:
            body = self.read_body()
            if parsed.path == '/api/admin/recipes':
                ok, user_id = require_admin(body=body)
                if not ok:
                    return self.send_json(403, {'message': 'permission denied'})
                incoming = body.get('item') or body
                rid = incoming.get('id') or body.get('id')
                with LOCK:
                    for idx, item in enumerate(RECIPES):
                        if item.get('id') == rid:
                            RECIPES[idx] = clean_recipe(incoming, rid)
                            save_catalog()
                            return self.send_json(200, {'ok': True, 'item': RECIPES[idx]})
                return self.send_json(404, {'message': 'recipe not found'})

            if parsed.path == '/api/admin/ingredients':
                ok, user_id = require_admin(body=body)
                if not ok:
                    return self.send_json(403, {'message': 'permission denied'})
                incoming = body.get('item') or body
                iid = incoming.get('id') or body.get('id')
                with LOCK:
                    for idx, item in enumerate(INGREDIENTS):
                        if item.get('id') == iid:
                            INGREDIENTS[idx] = clean_ingredient(incoming, iid)
                            save_catalog()
                            return self.send_json(200, {'ok': True, 'item': INGREDIENTS[idx]})
                return self.send_json(404, {'message': 'ingredient not found'})

            if parsed.path == '/api/cart':
                incoming = body.get('cart') if isinstance(body.get('cart'), list) else []
                cart = []
                for item in incoming:
                    if item and item.get('recipeId') and int(item.get('quantity') or 0) > 0:
                        cart.append({'recipeId': item.get('recipeId'), 'quantity': int(item.get('quantity'))})
                with LOCK:
                    db = read_db()
                    state = get_couple(db, body.get('userId'))
                    state['cart'] = cart
                    state['updatedAt'] = now_iso()
                    write_db(db)
                return self.send_json(200, {'state': state})

            if parsed.path == '/api/ingredient-selection':
                ids = body.get('selectedIngredientIds') if isinstance(body.get('selectedIngredientIds'), list) else []
                ids = list(dict.fromkeys(ids))
                with LOCK:
                    db = read_db()
                    state = get_couple(db, body.get('userId'))
                    state['selectedIngredientIds'] = ids
                    state['updatedAt'] = now_iso()
                    write_db(db)
                return self.send_json(200, {'state': state})

            return self.send_json(404, {'message': 'Not found'})
        except Exception as exc:
            return self.send_json(500, {'message': str(exc)})


    def do_DELETE(self):
        parsed = urlparse(self.path)
        try:
            body = self.read_body()
            if parsed.path == '/api/orders':
                user_id = body.get('userId') or ''
                ids = body.get('ids') if isinstance(body.get('ids'), list) else []
                clear_all = bool(body.get('clearAll'))
                with LOCK:
                    db = read_db()
                    state = get_couple(db, user_id)
                    logs = state.setdefault('submitLogs', [])
                    before = len(logs)
                    if clear_all:
                        state['submitLogs'] = []
                    else:
                        ids_set = {str(x) for x in ids if str(x)}
                        def keep_order(item):
                            item_id = str(item.get('id') or '')
                            legacy_id = 'remote_' + str(item.get('createdAt') or '')
                            return item_id not in ids_set and legacy_id not in ids_set
                        state['submitLogs'] = [item for item in logs if keep_order(item)]
                    state['updatedAt'] = now_iso()
                    write_db(db)
                return self.send_json(200, {'ok': True, 'deleted': before - len(state.get('submitLogs', [])), 'logs': state.get('submitLogs', [])})

            if parsed.path == '/api/admin/recipes':
                ok, user_id = require_admin(body=body)
                if not ok:
                    return self.send_json(403, {'message': 'permission denied'})
                rid = body.get('id')
                with LOCK:
                    before = len(RECIPES)
                    RECIPES[:] = [item for item in RECIPES if item.get('id') != rid]
                    if len(RECIPES) == before:
                        return self.send_json(404, {'message': 'recipe not found'})
                    save_catalog()
                return self.send_json(200, {'ok': True})

            if parsed.path == '/api/admin/ingredients':
                ok, user_id = require_admin(body=body)
                if not ok:
                    return self.send_json(403, {'message': 'permission denied'})
                iid = body.get('id')
                with LOCK:
                    before = len(INGREDIENTS)
                    INGREDIENTS[:] = [item for item in INGREDIENTS if item.get('id') != iid]
                    if len(INGREDIENTS) == before:
                        return self.send_json(404, {'message': 'ingredient not found'})
                    save_catalog()
                return self.send_json(200, {'ok': True})

            return self.send_json(404, {'message': 'Not found'})
        except Exception as exc:
            return self.send_json(500, {'message': str(exc)})

def main():
    ensure_db()
    server = ThreadingHTTPServer(('0.0.0.0', PORT), Handler)
    print(f'couple-cook-api listening on http://0.0.0.0:{PORT}', flush=True)
    server.serve_forever()


if __name__ == '__main__':
    main()
