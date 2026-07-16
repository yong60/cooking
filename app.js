const api = require('./utils/api')
const mock = require('./utils/mock')

function unique(arr) {
  return Array.from(new Set(arr || []))
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
    const payload = {
      userId: this.globalData.user && this.globalData.user.id,
      cart: this.globalData.state.cart || [],
      ...extra
    }
    try {
      return await api.submitCart(payload)
    } catch (err) {
      const logs = wx.getStorageSync('localSubmitLogs') || []
      logs.unshift({ type: 'cart', payload, createdAt: Date.now(), local: true })
      wx.setStorageSync('localSubmitLogs', logs)
      return { ok: true, local: true }
    }
  },

  async submitIngredients(extra = {}) {
    const payload = {
      userId: this.globalData.user && this.globalData.user.id,
      selectedIngredientIds: this.globalData.state.selectedIngredientIds || [],
      ...extra
    }
    try {
      return await api.submitIngredients(payload)
    } catch (err) {
      const logs = wx.getStorageSync('localSubmitLogs') || []
      logs.unshift({ type: 'ingredients', payload, createdAt: Date.now(), local: true })
      wx.setStorageSync('localSubmitLogs', logs)
      return { ok: true, local: true }
    }
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
