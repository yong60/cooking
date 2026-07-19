const api = require('./utils/api')
const mock = require('./utils/mock')

function unique(arr) {
  return Array.from(new Set(arr || []))
}

function notifyFailed(notify) {
  if (!notify) return false
  if (notify.skipped) return true
  const results = notify.results || []
  return results.some(item => item && item.error)
}

App({
  globalData: {
    user: null,
    recipes: mock.recipes,
    ingredients: mock.ingredients,
    state: { cart: [], selectedIngredientIds: [] }
  },

  onLaunch() {
    this.globalData.user = wx.getStorageSync('user') || null
    this.globalData.state = wx.getStorageSync('sharedState') || { cart: [], selectedIngredientIds: [] }
  },

  isLoggedIn() {
    return Boolean(this.globalData.user && this.globalData.user.id)
  },

  loginWithWechat(profile = {}) {
    return new Promise(resolve => {
      wx.login({
        success: async loginRes => {
          const fallbackUser = {
            id: `local_${Date.now()}`,
            nickName: profile.nickName || "\u5fae\u4fe1\u7528\u6237",
            avatarUrl: profile.avatarUrl || ''
          }
          try {
            const result = await api.login({ code: loginRes.code, profile })
            this.globalData.user = result.user || fallbackUser
          } catch (err) {
            this.globalData.user = wx.getStorageSync('user') || fallbackUser
          }
          wx.setStorageSync('user', this.globalData.user)
          resolve(this.globalData.user)
        },
        fail: () => {
          const user = wx.getStorageSync('user') || { id: `local_${Date.now()}`, nickName: "\u5fae\u4fe1\u7528\u6237", avatarUrl: '' }
          this.globalData.user = user
          wx.setStorageSync('user', user)
          resolve(user)
        }
      })
    })
  },

  setUser(user) {
    this.globalData.user = user
    wx.setStorageSync('user', user)
    return user
  },

  async updateUserProfile(profile = {}) {
    const current = this.globalData.user || wx.getStorageSync('user') || {}
    const next = { ...current, ...profile }
    this.setUser(next)
    try {
      const result = await api.updateProfile({
        userId: next.id,
        nickName: next.nickName,
        avatarUrl: next.avatarUrl
      })
      if (result.user) this.setUser(result.user)
    } catch (err) {}
    return this.globalData.user
  },

  async bindPartner(partnerId) {
    const userId = this.globalData.user && this.globalData.user.id
    const result = await api.bindPartner({ userId, partnerId })
    if (result.user) this.setUser(result.user)
    await this.loadState()
    return this.globalData.user
  },

  async unbindPartner() {
    const userId = this.globalData.user && this.globalData.user.id
    const result = await api.unbindPartner({ userId })
    if (result.user) this.setUser(result.user)
    await this.loadState()
    return this.globalData.user
  },

  async loadCatalog() {
    try {
      const [recipeRes, ingredientRes] = await Promise.all([api.getRecipes(), api.getIngredients()])
      this.globalData.recipes = recipeRes.recipes || mock.recipes
      this.globalData.ingredients = ingredientRes.ingredients || mock.ingredients
    } catch (err) {
      const localCatalog = wx.getStorageSync('localCatalog') || {}
      this.globalData.recipes = localCatalog.recipes || mock.recipes
      this.globalData.ingredients = localCatalog.ingredients || mock.ingredients
    }
    return { recipes: this.globalData.recipes, ingredients: this.globalData.ingredients }
  },

  async loadState() {
    if (!this.isLoggedIn()) return this.globalData.state
    try {
      const result = await api.getState(this.globalData.user.id)
      this.globalData.state = result.state || this.globalData.state
    } catch (err) {
      this.globalData.state = wx.getStorageSync('sharedState') || this.globalData.state
    }
    wx.setStorageSync('sharedState', this.globalData.state)
    return this.globalData.state
  },

  saveLocalState() {
    wx.setStorageSync('sharedState', this.globalData.state)
  },

  getRecipeById(id) {
    return this.globalData.recipes.find(item => item.id === id)
  },

  getIngredientById(id) {
    return this.globalData.ingredients.find(item => item.id === id)
  },

  getCartItems() {
    const cart = this.globalData.state.cart || []
    return cart.map(row => {
      const recipe = this.getRecipeById(row.recipeId)
      if (!recipe) return null
      return { ...recipe, quantity: row.quantity }
    }).filter(Boolean)
  },

  getCartCount() {
    return this.getCartItems().reduce((sum, item) => sum + item.quantity, 0)
  },

  async setCartItem(recipeId, quantity) {
    const cart = [...(this.globalData.state.cart || [])]
    const index = cart.findIndex(item => item.recipeId === recipeId)
    if (quantity <= 0) {
      if (index >= 0) cart.splice(index, 1)
    } else if (index >= 0) {
      cart[index].quantity = quantity
    } else {
      cart.push({ recipeId, quantity })
    }
    this.globalData.state = { ...this.globalData.state, cart }
    this.saveLocalState()
    try {
      const result = await api.updateCart({ userId: this.globalData.user && this.globalData.user.id, cart })
      if (result.state) this.globalData.state = result.state
    } catch (err) {}
    this.saveLocalState()
    return this.globalData.state
  },

  addToCart(recipeId) {
    const row = (this.globalData.state.cart || []).find(item => item.recipeId === recipeId)
    return this.setCartItem(recipeId, (row ? row.quantity : 0) + 1)
  },

  addCustomRecipeToCart(recipe) {
    const item = {
      id: recipe.id || `custom_${Date.now()}`,
      categoryId: recipe.categoryId || 'custom',
      name: recipe.name || "\u81ea\u9009\u5957\u9910",
      desc: recipe.desc || '',
      ingredients: recipe.ingredients || [],
      tags: recipe.tags || ["\u81ea\u9009"],
      cover: recipe.cover || "\uD83E\uDD57"
    }
    const exists = this.globalData.recipes.find(row => row.id === item.id)
    if (!exists) {
      this.globalData.recipes = [item, ...(this.globalData.recipes || [])]
      const localCatalog = wx.getStorageSync('localCatalog') || {}
      const recipes = localCatalog.recipes || this.globalData.recipes
      wx.setStorageSync('localCatalog', {
        ...localCatalog,
        recipes: exists ? recipes : [item, ...recipes.filter(row => row.id !== item.id)],
        ingredients: localCatalog.ingredients || this.globalData.ingredients || []
      })
    }
    return this.addToCart(item.id)
  },

  minusFromCart(recipeId) {
    const row = (this.globalData.state.cart || []).find(item => item.recipeId === recipeId)
    return this.setCartItem(recipeId, Math.max(0, (row ? row.quantity : 0) - 1))
  },

  async clearCart() {
    this.globalData.state = { ...this.globalData.state, cart: [] }
    this.saveLocalState()
    try {
      const result = await api.updateCart({ userId: this.globalData.user && this.globalData.user.id, cart: [] })
      if (result.state) this.globalData.state = result.state
    } catch (err) {}
    this.saveLocalState()
  },

  getSelectedIngredients() {
    return (this.globalData.state.selectedIngredientIds || []).map(id => this.getIngredientById(id)).filter(Boolean)
  },

  async updateIngredientSelection(ids) {
    const selectedIngredientIds = unique(ids)
    this.globalData.state = { ...this.globalData.state, selectedIngredientIds }
    this.saveLocalState()
    try {
      const result = await api.updateIngredientSelection({ userId: this.globalData.user && this.globalData.user.id, selectedIngredientIds })
      if (result.state) this.globalData.state = result.state
    } catch (err) {}
    this.saveLocalState()
    return this.globalData.state
  },

  async submitCart(extra = {}) {
    const cart = this.globalData.state.cart || []
    const payload = {
      userId: this.globalData.user && this.globalData.user.id,
      cart,
      ...extra
    }
    const log = this.makeSubmitLog('cart', payload)
    try {
      const result = await api.submitCart(payload)
      if (payload.notifyEnabled !== false && notifyFailed(result.notify) && api.hasLocalPushplus && api.hasLocalPushplus()) {
        result.notify = await api.sendPushplus("\u80e1\u95f9\u53a8\u623f\uff1a\u70b9\u83dc\u63d0\u4ea4", this.cartNotifyContent(payload))
      }
      this.saveSubmitLog({ ...log, notify: result.notify, local: false })
      return result
    } catch (err) {
      if (payload.notifyEnabled !== false && api.hasLocalPushplus && api.hasLocalPushplus()) {
        try {
          const notify = await api.sendPushplus("\u80e1\u95f9\u53a8\u623f\uff1a\u70b9\u83dc\u63d0\u4ea4", this.cartNotifyContent(payload))
          this.saveSubmitLog({ ...log, notify, local: true })
          return { ok: true, local: true, notify }
        } catch (notifyErr) {}
      }
      this.saveSubmitLog({ ...log, local: true, error: String(err && err.message || err) })
      return { ok: true, local: true }
    }
  },

  async submitIngredients(extra = {}) {
    const selectedIngredientIds = this.globalData.state.selectedIngredientIds || []
    const payload = {
      userId: this.globalData.user && this.globalData.user.id,
      selectedIngredientIds,
      ...extra
    }
    const log = this.makeSubmitLog('ingredients', payload)
    try {
      const result = await api.submitIngredients(payload)
      if (payload.notifyEnabled !== false && notifyFailed(result.notify) && api.hasLocalPushplus && api.hasLocalPushplus()) {
        result.notify = await api.sendPushplus("\u80e1\u95f9\u53a8\u623f\uff1a\u98df\u6750\u63d0\u4ea4", this.ingredientsNotifyContent(payload))
      }
      this.saveSubmitLog({ ...log, notify: result.notify, local: false })
      return result
    } catch (err) {
      if (payload.notifyEnabled !== false && api.hasLocalPushplus && api.hasLocalPushplus()) {
        try {
          const notify = await api.sendPushplus("\u80e1\u95f9\u53a8\u623f\uff1a\u98df\u6750\u63d0\u4ea4", this.ingredientsNotifyContent(payload))
          this.saveSubmitLog({ ...log, notify, local: true })
          return { ok: true, local: true, notify }
        } catch (notifyErr) {}
      }
      this.saveSubmitLog({ ...log, local: true, error: String(err && err.message || err) })
      return { ok: true, local: true }
    }
  },

  cartNotifyContent(payload = {}) {
    const lines = (payload.cart || []).map(row => {
      const recipe = this.getRecipeById(row.recipeId) || {}
      return `- ${recipe.name || row.recipeId} x${row.quantity || 1}`
    }).join('\n') || '- 暂无'
    return `今晚想吃：\n${lines}\n\n备注：${payload.remark || '无'}`
  },

  ingredientsNotifyContent(payload = {}) {
    const lines = (payload.selectedIngredientIds || []).map(id => {
      const item = this.getIngredientById(id) || {}
      return `- ${item.name || id}`
    }).join('\n') || '- 暂无'
    return `今天想用这些食材做饭：\n${lines}`
  },

  makeSubmitLog(type, payload = {}) {
    const createdAt = Date.now()
    if (type === 'cart') {
      const items = (payload.cart || []).map(row => {
        const recipe = this.getRecipeById(row.recipeId) || {}
        return { id: row.recipeId, name: recipe.name || row.recipeId, quantity: row.quantity || 1 }
      })
      return { id: `log_${createdAt}`, type, items, remark: payload.remark || '', notifyEnabled: payload.notifyEnabled !== false, submitter: this.publicCurrentUser(), createdAt }
    }
    const ingredients = (payload.selectedIngredientIds || []).map(id => {
      const item = this.getIngredientById(id) || {}
      return { id, name: item.name || id }
    })
    return { id: `log_${createdAt}`, type, ingredients, notifyEnabled: payload.notifyEnabled !== false, submitter: this.publicCurrentUser(), createdAt }
  },

  publicCurrentUser() {
    const user = this.globalData.user || {}
    return { id: user.id || '', nickName: user.nickName || "\u5fae\u4fe1\u7528\u6237", avatarUrl: user.avatarUrl || '' }
  },

  saveSubmitLog(log) {
    const logs = wx.getStorageSync('localSubmitLogs') || []
    const next = [log, ...logs.filter(item => item.id !== log.id)].slice(0, 100)
    wx.setStorageSync('localSubmitLogs', next)
    this.globalData.state = { ...this.globalData.state, submitLogs: next }
    this.saveLocalState()
  },

  getSubmitLogs() {
    const remote = (this.globalData.state && this.globalData.state.submitLogs) || []
    const local = wx.getStorageSync('localSubmitLogs') || []
    const normalizedRemote = remote.map((item, index) => ({
      id: item.id || `remote_${item.createdAt || index}`,
      type: item.type,
      items: (item.cart || []).map(row => {
        const recipe = this.getRecipeById(row.recipeId) || {}
        return { id: row.recipeId, name: recipe.name || row.recipeId, quantity: row.quantity || 1 }
      }),
      ingredients: (item.selectedIngredientIds || []).map(id => {
        const ingredient = this.getIngredientById(id) || {}
        return { id, name: ingredient.name || id }
      }),
      remark: item.remark || '',
      notify: item.notify,
      notifyEnabled: item.notifyEnabled !== false,
      submitter: item.submitter || {},
      local: false,
      createdAt: item.createdAt || ''
    }))
    const all = [...local, ...normalizedRemote]
    const seen = new Set()
    return all.filter(item => {
      const key = item.id || JSON.stringify(item)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 100)
  },

  async loadSubmitLogs() {
    const userId = this.globalData.user && this.globalData.user.id
    try {
      const result = await api.getOrders(userId)
      this.globalData.state = { ...this.globalData.state, submitLogs: result.logs || [] }
      this.saveLocalState()
    } catch (err) {}
    return this.getSubmitLogs()
  },

  async deleteSubmitLogs(ids = [], clearAll = false) {
    const idSet = new Set(ids || [])
    const local = wx.getStorageSync('localSubmitLogs') || []
    wx.setStorageSync('localSubmitLogs', clearAll ? [] : local.filter(item => !idSet.has(item.id)))
    const remote = (this.globalData.state && this.globalData.state.submitLogs) || []
    this.globalData.state = { ...this.globalData.state, submitLogs: clearAll ? [] : remote.filter(item => !idSet.has(item.id)) }
    this.saveLocalState()
    try {
      await api.deleteOrders({ userId: this.globalData.user && this.globalData.user.id, ids, clearAll })
      await this.loadSubmitLogs()
    } catch (err) {}
    return this.getSubmitLogs()
  },

  async recommend(options = {}) {
    const selectedIngredientIds = this.globalData.state.selectedIngredientIds || []
    try {
      return await api.recommend({ selectedIngredientIds, ...options })
    } catch (err) {
      const selected = new Set(selectedIngredientIds)
      const scored = this.globalData.recipes
        .filter(item => item.categoryId !== 'soup')
        .map(item => ({
          ...item,
          score: (item.ingredients || []).filter(id => selected.has(id)).length
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, options.dishCount || 1)
      const soup = options.withSoup ? this.globalData.recipes.find(item => item.categoryId === 'soup' && (item.ingredients || []).some(id => selected.has(id))) : null
      return { recommendations: soup ? [...scored, soup] : scored, source: 'local' }
    }
  }
})
