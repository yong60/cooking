const { recipeCategories } = require('../../utils/mock')
const config = require('../../utils/config')
const app = getApp()
Page({
  data: { t: {
    "loginFirst": "\u8bf7\u5148\u6388\u6743\u767b\u5f55",
    "loginSuccess": "\u767b\u5f55\u6210\u529f",
    "submitterDesc": "\u7528\u4e8e\u663e\u793a\u63d0\u4ea4\u4eba",
    "wechatUser": "\u5fae\u4fe1\u7528\u6237",
    "title": "\u4eca\u5929\u60f3\u5403\u4ec0\u4e48",
    "subtitle": "\u4e24\u4e2a\u4eba\u90fd\u80fd\u770b\u5230\u8fd9\u91cc\u7684\u70b9\u83dc\u8f66",
    "menuIcon": "\ud83d\udcd6",
    "cartIcon": "\ud83d\uded2",
    "kindFood": "\u79cd\u98df\u6750",
    "picked": "\u5df2\u70b9",
    "portion": "\u4efd",
    "notify": "\u7ed3\u7b97\u65f6\u53ef\u9009\u62e9\u662f\u5426\u901a\u77e5",
    "confirm": "\u53bb\u786e\u8ba4",
    "pickFirst": "\u5148\u9009\u4e00\u9053\u83dc\u5427"
}, categories: recipeCategories, activeCategory: 'home', recipes: [], cartCount: 0, pollTimer: null },
  async onShow() { if (!app.isLoggedIn()) { wx.showToast({ title: this.data.t.loginFirst, icon: 'none' }); wx.switchTab({ url: '/pages/index/index' }); return } await app.loadCatalog(); await app.loadState(); this.refresh(); this.startPolling() },
  onHide() { this.stopPolling() }, onUnload() { this.stopPolling() },
  startPolling() { this.stopPolling(); const timer = setInterval(async () => { await app.loadState(); this.refresh() }, config.POLL_INTERVAL || 3000); this.setData({ pollTimer: timer }) },
  stopPolling() { if (this.data.pollTimer) clearInterval(this.data.pollTimer); this.setData({ pollTimer: null }) },
  refresh() { const cart = app.globalData.state.cart || []; const recipes = app.globalData.recipes.map(item => { const row = cart.find(c => c.recipeId === item.id); return { ...item, quantity: row ? row.quantity : 0 } }); this.setData({ recipes, cartCount: app.getCartCount() }) },
  chooseCategory(event) { this.setData({ activeCategory: event.currentTarget.dataset.id }) },
  async add(event) { await app.addToCart(event.currentTarget.dataset.id); this.refresh() },
  async minus(event) { await app.minusFromCart(event.currentTarget.dataset.id); this.refresh() },
  goCart() { if (!this.data.cartCount) { wx.showToast({ title: this.data.t.pickFirst, icon: 'none' }); return } wx.navigateTo({ url: '/pages/cart/cart' }) }
})
