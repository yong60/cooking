const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { recipes, ingredients } = require('../../utils/mock')

const PORT = Number(process.env.PORT || 31080)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')
const clients = new Set()

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {}, couples: { default: emptyState() } }, null, 2))
  }
}

function emptyState() {
  return { cart: [], selectedIngredientIds: [], submitLogs: [] }
}

function readDb() {
  ensureDb()
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
}

function writeDb(db) {
  ensureDb()
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

function getCouple(db, userId) {
  const user = userId && db.users[userId]
  const coupleId = (user && user.coupleId) || 'default'
  if (!db.couples[coupleId]) db.couples[coupleId] = emptyState()
  return db.couples[coupleId]
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'content-type'
  })
  res.end(JSON.stringify(data))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > 1024 * 1024) req.destroy()
    })
    req.on('end', () => {
      if (!body) return resolve({})
      try { resolve(JSON.parse(body)) } catch (err) { reject(err) }
    })
    req.on('error', reject)
  })
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (err) { reject(err) }
      })
    }).on('error', reject)
  })
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const target = new URL(url)
    const req = https.request({
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) }
    }, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data || '{}')) } catch (err) { resolve({ raw: data }) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function resolveOpenid(code) {
  const appid = process.env.WECHAT_APPID
  const secret = process.env.WECHAT_SECRET
  if (appid && secret && code) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
    const result = await getJson(url)
    if (result.openid) return result.openid
  }
  return `demo_${crypto.createHash('sha1').update(String(code || Date.now())).digest('hex').slice(0, 16)}`
}

function formatRecipeList(cart) {
  return (cart || []).map(row => {
    const recipe = recipes.find(item => item.id === row.recipeId)
    return recipe ? `- ${recipe.name} x${row.quantity}` : `- ${row.recipeId} x${row.quantity}`
  }).join('\n')
}

function formatIngredientList(ids) {
  return (ids || []).map(id => {
    const item = ingredients.find(i => i.id === id)
    return item ? `- ${item.name}` : `- ${id}`
  }).join('\n')
}

async function pushplus(title, content) {
  const raw = process.env.PUSHPLUS_TOKENS || process.env.PUSHPLUS_TOKEN || ''
  const tokens = raw.split(/[;,\n]/).map(item => item.trim()).filter(Boolean)
  if (!tokens.length) return { skipped: true, reason: 'PUSHPLUS_TOKEN not configured' }
  const results = []
  for (const token of tokens) {
    results.push(await postJson('https://www.pushplus.plus/send', { token, title, content, template: 'txt' }))
  }
  return { count: tokens.length, results }
}
function recommendByIngredients(selectedIngredientIds, dishCount = 1, withSoup = false) {
  const selected = new Set(selectedIngredientIds || [])
  const scoreRecipe = item => ({
    ...item,
    matchedIngredients: (item.ingredients || []).filter(id => selected.has(id)),
    score: (item.ingredients || []).filter(id => selected.has(id)).length
  })
  const mains = recipes
    .filter(item => item.categoryId !== 'soup')
    .map(scoreRecipe)
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.ingredients.length - b.ingredients.length)
    .slice(0, Math.max(1, Math.min(3, Number(dishCount) || 1)))
  const fallbackMains = mains.length ? mains : recipes.filter(item => item.categoryId !== 'soup').slice(0, Math.max(1, Number(dishCount) || 1))
  const result = [...fallbackMains]
  if (withSoup) {
    const soup = recipes
      .filter(item => item.categoryId === 'soup')
      .map(scoreRecipe)
      .sort((a, b) => b.score - a.score)[0]
    if (soup) result.push(soup)
  }
  return result
}

function wsFrame(obj) {
  const payload = Buffer.from(JSON.stringify(obj))
  if (payload.length < 126) return Buffer.concat([Buffer.from([0x81, payload.length]), payload])
  if (payload.length <= 65535) {
    const head = Buffer.alloc(4)
    head[0] = 0x81
    head[1] = 126
    head.writeUInt16BE(payload.length, 2)
    return Buffer.concat([head, payload])
  }
  const head = Buffer.alloc(10)
  head[0] = 0x81
  head[1] = 127
  head.writeBigUInt64BE(BigInt(payload.length), 2)
  return Buffer.concat([head, payload])
}

function broadcast(obj) {
  const frame = wsFrame(obj)
  for (const socket of clients) {
    try { socket.write(frame) } catch (err) { clients.delete(socket) }
  }
}

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})

  try {
    if (req.method === 'POST' && url.pathname === '/api/auth/wechat-login') {
      const body = await readBody(req)
      const openid = await resolveOpenid(body.code)
      const db = readDb()
      const profile = body.profile || {}
      db.users[openid] = {
        id: openid,
        nickName: profile.nickName || 'WeChat User',
        avatarUrl: profile.avatarUrl || '',
        coupleId: 'default',
        updatedAt: new Date().toISOString()
      }
      writeDb(db)
      return sendJson(res, 200, { user: db.users[openid] })
    }

    if (req.method === 'GET' && url.pathname === '/api/recipes') return sendJson(res, 200, { recipes })
    if (req.method === 'GET' && url.pathname === '/api/ingredients') return sendJson(res, 200, { ingredients })

    if (req.method === 'GET' && url.pathname === '/api/state') {
      const db = readDb()
      const state = getCouple(db, url.searchParams.get('userId'))
      writeDb(db)
      return sendJson(res, 200, { state })
    }

    if (req.method === 'PUT' && url.pathname === '/api/cart') {
      const body = await readBody(req)
      const db = readDb()
      const state = getCouple(db, body.userId)
      state.cart = Array.isArray(body.cart) ? body.cart.filter(item => item && item.recipeId && Number(item.quantity) > 0).map(item => ({ recipeId: item.recipeId, quantity: Number(item.quantity) })) : []
      state.updatedAt = new Date().toISOString()
      writeDb(db)
      broadcast({ type: 'state', state })
      return sendJson(res, 200, { state })
    }

    if (req.method === 'PUT' && url.pathname === '/api/ingredient-selection') {
      const body = await readBody(req)
      const db = readDb()
      const state = getCouple(db, body.userId)
      state.selectedIngredientIds = Array.from(new Set(Array.isArray(body.selectedIngredientIds) ? body.selectedIngredientIds : []))
      state.updatedAt = new Date().toISOString()
      writeDb(db)
      broadcast({ type: 'state', state })
      return sendJson(res, 200, { state })
    }

    if (req.method === 'POST' && url.pathname === '/api/submit/cart') {
      const body = await readBody(req)
      const db = readDb()
      const state = getCouple(db, body.userId)
      const cart = Array.isArray(body.cart) ? body.cart : state.cart
      const content = `Recipes submitted:\n${formatRecipeList(cart)}\n\nRemark: ${body.remark || 'None'}\nTime: ${new Date().toLocaleString('zh-CN', { hour12: false })}`
      const notify = await pushplus('\u80e1\u95f9\u53a8\u623f\uff1a\u70b9\u83dc\u63d0\u4ea4', content)
      state.submitLogs.unshift({ type: 'cart', cart, remark: body.remark || '', notify, createdAt: new Date().toISOString() })
      writeDb(db)
      return sendJson(res, 200, { ok: true, notify })
    }

    if (req.method === 'POST' && url.pathname === '/api/submit/ingredients') {
      const body = await readBody(req)
      const db = readDb()
      const state = getCouple(db, body.userId)
      const ids = Array.isArray(body.selectedIngredientIds) ? body.selectedIngredientIds : state.selectedIngredientIds
      const content = `Ingredients submitted:\n${formatIngredientList(ids)}\n\nOpen combo page for recommendations.\nTime: ${new Date().toLocaleString('zh-CN', { hour12: false })}`
      const notify = await pushplus('\u80e1\u95f9\u53a8\u623f\uff1a\u98df\u6750\u63d0\u4ea4', content)
      state.submitLogs.unshift({ type: 'ingredients', selectedIngredientIds: ids, notify, createdAt: new Date().toISOString() })
      writeDb(db)
      return sendJson(res, 200, { ok: true, notify })
    }

    if (req.method === 'POST' && url.pathname === '/api/recommend') {
      const body = await readBody(req)
      const recommendations = recommendByIngredients(body.selectedIngredientIds || [], body.dishCount, body.withSoup)
      return sendJson(res, 200, { recommendations, source: 'local-recipe' })
    }

    if (req.method === 'POST' && url.pathname === '/api/notify/test') {
      const notify = await pushplus('\u80e1\u95f9\u53a8\u623f\uff1a\u6d4b\u8bd5\u901a\u77e5', `Test notification.\nTime: ${new Date().toLocaleString('zh-CN', { hour12: false })}`)
      return sendJson(res, 200, { ok: true, notify })
    }

    sendJson(res, 404, { message: 'Not found' })
  } catch (err) {
    console.error(err)
    sendJson(res, 500, { message: err.message || 'Internal Server Error' })
  }
}

const server = http.createServer(router)

server.on('upgrade', (req, socket) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname !== '/ws') return socket.destroy()
  const key = req.headers['sec-websocket-key']
  const accept = crypto.createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64')
  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '',
    ''
  ].join('\r\n'))
  clients.add(socket)
  socket.write(wsFrame({ type: 'hello', message: 'connected' }))
  socket.on('close', () => clients.delete(socket))
  socket.on('error', () => clients.delete(socket))
})

server.listen(PORT, () => {
  ensureDb()
  console.log(`couple-cook-api listening on http://127.0.0.1:${PORT}`)
})
