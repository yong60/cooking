const app = getApp()
Page({
  setTabBar() { const tabBar = typeof this.getTabBar === 'function' && this.getTabBar(); if (tabBar) tabBar.setData({ selected: 1 }) },
  data: { t: {
    "loginFirst": "\u8bf7\u5148\u6388\u6743\u767b\u5f55",
    "loginPanelTitle": "\u8bf7\u5148\u6388\u6743\u767b\u5f55",
    "loginPanelHint": "\u767b\u5f55\u540e\u5c31\u80fd\u770b\u5230\u5df2\u9009\u98df\u6750\uff0c\u5e76\u751f\u6210\u7ec4\u5408\u63a8\u8350\u3002",
    "goLogin": "\u53bb\u6388\u6743",
    "title": "\u98df\u6750\u7ec4\u5408",
    "subtitle": "\u6839\u636e\u5df2\u9009\u98df\u6750\u63a8\u8350",
    "pick": "\u53bb\u9009\u98df\u6750",
    "emptyTitle": "\u8fd8\u6ca1\u6709\u6311\u9009\u98df\u6750",
    "emptyHint": "\u8bf7\u5148\u53bb\u6311\u9009\u98df\u6750",
    "selected": "\u5df2\u9009\u98df\u6750",
    "kind": "\u79cd",
    "options": "\u7ec4\u5408\u504f\u597d",
    "howMany": "\u60f3\u63a8\u8350\u51e0\u9053\u83dc",
    "one": "\u4e00\u83dc",
    "two": "\u4e24\u83dc",
    "three": "\u4e09\u83dc",
    "withSoup": "\u662f\u5426\u914d\u6c64",
    "soupHint": "\u5f00\u542f\u540e\u9ed8\u8ba4\u989d\u5916\u914d\u4e00\u6c64",
    "generate": "\u751f\u6210\u63a8\u8350",
    "result": "\u63a8\u8350\u7ed3\u679c",
    "add": "\u52a0\u5165",
    "pickFirst": "\u8bf7\u5148\u6311\u9009\u98df\u6750",
    "added": "\u5df2\u52a0\u5165\u70b9\u83dc\u8f66",
    "remove": "\u79fb\u9664"
}, loggedIn: false, selectedIngredients: [], dishCount: 2, withSoup: true, recommendations: [], source: '', loading: false },
  async onShow() { this.setTabBar(); if (!app.isLoggedIn()) { this.setData({ loggedIn: false, selectedIngredients: [], recommendations: [] }); return } this.setData({ loggedIn: true }); await app.loadCatalog(); await app.loadState(); this.refresh() },
  refresh() { this.setData({ selectedIngredients: app.getSelectedIngredients() }) },
  goLogin() { wx.switchTab({ url: '/pages/profile/profile' }) },
  goIngredients() { wx.navigateTo({ url: '/pages/ingredients/ingredients' }) },
  chooseCount(event) { this.setData({ dishCount: Number(event.currentTarget.dataset.count), recommendations: [] }) },
  toggleSoup(event) { this.setData({ withSoup: event.detail.value, recommendations: [] }) },
  async removeIngredient(event) {
    const id = event.currentTarget.dataset.id
    const ids = (app.globalData.state.selectedIngredientIds || []).filter(x => x !== id)
    await app.updateIngredientSelection(ids)
    this.refresh()
  },
  async generate() { if (!this.data.selectedIngredients.length) { wx.showToast({ title: this.data.t.pickFirst, icon: 'none' }); return } this.setData({ loading: true }); try { const result = await app.recommend({ dishCount: this.data.dishCount, withSoup: this.data.withSoup }); this.setData({ recommendations: result.recommendations || [], source: result.source || 'local' }) } finally { this.setData({ loading: false }) } },
  async addToCart(event) { await app.addToCart(event.currentTarget.dataset.id); wx.showToast({ title: this.data.t.added, icon: 'success' }) }
})
