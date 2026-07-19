const config = require('./config')

function baseUrl() {
  return (config.BASE_URL || '').replace(/\/$/, '')
}

function request(path, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    const host = baseUrl()
    if (!host) {
      reject(new Error('BASE_URL is not configured'))
      return
    }
    wx.request({
      url: `${host}${path}`,
      method,
      data,
      header: { 'content-type': 'application/json' },
      success: res => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data)
        else reject(new Error((res.data && res.data.message) || `HTTP ${res.statusCode}`))
      },
      fail: reject
    })
  })
}

function pushplusTokens() {
  const raw = config.PUSHPLUS_TOKENS || config.PUSHPLUS_TOKEN || ''
  if (Array.isArray(raw)) return raw.map(item => String(item).trim()).filter(Boolean)
  return String(raw).replace(/\n/g, ',').replace(/;/g, ',').split(',').map(item => item.trim()).filter(Boolean)
}

function sendPushplus(title, content) {
  const tokens = pushplusTokens()
  if (!tokens.length) return Promise.reject(new Error('PUSHPLUS_TOKEN is not configured'))
  return Promise.all(tokens.map(token => new Promise(resolve => {
    wx.request({
      url: 'https://www.pushplus.plus/send',
      method: 'POST',
      data: { token, title, content, template: 'txt' },
      header: { 'content-type': 'application/json' },
      success: res => resolve(res.data || { statusCode: res.statusCode }),
      fail: err => resolve({ error: String(err && err.errMsg || err) })
    })
  }))).then(results => ({ count: tokens.length, results }))
}

module.exports = {
  hasBackend: () => Boolean(baseUrl()),
  hasLocalPushplus: () => pushplusTokens().length > 0,
  sendPushplus,
  login: data => request('/api/auth/wechat-login', 'POST', data),
  updateProfile: data => request('/api/user/profile', 'POST', data),
  bindPartner: data => request('/api/user/bind-partner', 'POST', data),
  unbindPartner: data => request('/api/user/unbind', 'POST', data),
  getRecipes: () => request('/api/recipes'),
  getIngredients: () => request('/api/ingredients'),
  getState: userId => request(`/api/state?userId=${encodeURIComponent(userId || '')}`),
  getOrders: userId => request(`/api/orders?userId=${encodeURIComponent(userId || '')}`),
  updateCart: data => request('/api/cart', 'PUT', data),
  updateIngredientSelection: data => request('/api/ingredient-selection', 'PUT', data),
  submitCart: data => request('/api/submit/cart', 'POST', data),
  submitIngredients: data => request('/api/submit/ingredients', 'POST', data),
  recommend: data => request('/api/recommend', 'POST', data),
  fatLossPlan: data => request('/api/fatloss/plan', 'POST', data),
  testNotify: data => request('/api/notify/test', 'POST', data),
  unlockAdmin: data => request('/api/admin/unlock', 'POST', data),
  adminStatus: userId => request(`/api/admin/status?userId=${encodeURIComponent(userId || '')}`),
  adminCatalog: userId => request(`/api/admin/catalog?userId=${encodeURIComponent(userId || '')}`),
  createRecipe: data => request('/api/admin/recipes', 'POST', data),
  updateRecipe: data => request('/api/admin/recipes', 'PUT', data),
  deleteRecipe: data => request('/api/admin/recipes', 'DELETE', data),
  createIngredient: data => request('/api/admin/ingredients', 'POST', data),
  updateIngredient: data => request('/api/admin/ingredients', 'PUT', data),
  deleteIngredient: data => request('/api/admin/ingredients', 'DELETE', data)
}

