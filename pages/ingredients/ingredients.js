const { ingredientCategories } = require('../../utils/mock')
const config = require('../../utils/config')
const app = getApp()
Page({
  data: { t: {
    "loginFirst": "\u8bf7\u5148\u6388\u6743\u767b\u5f55",
    "loginSuccess": "\u767b\u5f55\u6210\u529f",
    "submitterDesc": "\u7528\u4e8e\u663e\u793a\u63d0\u4ea4\u4eba",
    "wechatUser": "\u5fae\u4fe1\u7528\u6237",
    "title": "\u6311\u9009\u60f3\u5403\u7684\u98df\u6750",
    "subtitle": "\u9009\u4e2d\u540e\u4f1a\u81ea\u52a8\u540c\u6b65",
    "kind": "\u79cd",
    "search": "\u641c\u7d22\u98df\u6750\uff0c\u4f8b\u5982\u9e21\u86cb\u3001\u756a\u8304",
    "noMatch": "\u6682\u65e0\u5339\u914d\u98df\u6750",
    "clear": "\u6e05\u7a7a",
    "selected": "\u5df2\u9009",
    "comboTip": "\u53ef\u53bb\u98df\u6750\u7ec4\u5408\u9875\u63a8\u8350\u83dc\u54c1",
    "submit": "\u63d0\u4ea4\u98df\u6750",
    "clearTitle": "\u6e05\u7a7a\u98df\u6750",
    "clearContent": "\u4f1a\u6e05\u7a7a\u4e24\u4e2a\u4eba\u5f53\u524d\u6311\u9009\u7684\u98df\u6750",
    "pickFirst": "\u5148\u6311\u9009\u98df\u6750",
    "submitTitle": "\u786e\u8ba4\u63d0\u4ea4\u98df\u6750",
    "submitNotify": "\u662f\u5426\u901a\u8fc7 pushplus \u901a\u77e5\u5bf9\u65b9\uff1f",
    "sendNotify": "\u53d1\u9001\u901a\u77e5",
    "noNotify": "\u4ec5\u4fdd\u5b58",
    "confirmAgain": "\u518d\u6b21\u786e\u8ba4",
    "continueSubmit": "\u662f\u5426\u7ee7\u7eed\u63d0\u4ea4",
    "localOk": "\u672c\u5730\u63d0\u4ea4\u6210\u529f",
    "ok": "\u63d0\u4ea4\u6210\u529f",
    "fail": "\u63d0\u4ea4\u5931\u8d25"
}, categories: ingredientCategories, activeCategory: 'meat', search: '', ingredients: [], visibleIngredients: [], selectedIds: [], selectedCount: 0, submitting: false },
  async onShow() { if (!app.isLoggedIn()) { wx.showToast({ title: this.data.t.loginFirst, icon: 'none' }); wx.switchTab({ url: '/pages/index/index' }); return } await app.loadCatalog(); await app.loadState(); this.refresh(); this.startPolling() },
  onHide() { this.stopPolling() }, onUnload() { this.stopPolling() },
  startPolling() { this.stopPolling(); this.pollTimer = setInterval(async () => { await app.loadState(); this.refresh() }, config.POLL_INTERVAL || 3000) },
  stopPolling() { if (this.pollTimer) clearInterval(this.pollTimer); this.pollTimer = null },
  refresh() { const selectedIds = app.globalData.state.selectedIngredientIds || []; this.setData({ ingredients: app.globalData.ingredients, selectedIds, selectedCount: selectedIds.length }); this.computeVisible() },
  computeVisible() { const keyword = (this.data.search || '').trim(); const selected = new Set(this.data.selectedIds); const visibleIngredients = this.data.ingredients.filter(item => item.categoryId === this.data.activeCategory && (!keyword || item.name.indexOf(keyword) >= 0)).map(item => ({ ...item, selected: selected.has(item.id) })); this.setData({ visibleIngredients }) },
  chooseCategory(event) { this.setData({ activeCategory: event.currentTarget.dataset.id }, () => this.computeVisible()) }, onSearch(event) { this.setData({ search: event.detail.value }, () => this.computeVisible()) },
  async toggle(event) { const id = event.currentTarget.dataset.id; const set = new Set(this.data.selectedIds); set.has(id) ? set.delete(id) : set.add(id); await app.updateIngredientSelection(Array.from(set)); this.refresh() },
  clearSelected() { wx.showModal({ title: this.data.t.clearTitle, content: this.data.t.clearContent, success: async res => { if (res.confirm) { await app.updateIngredientSelection([]); this.refresh() } } }) },
  submitIngredients() {
    if (!this.data.selectedCount) { wx.showToast({ title: this.data.t.pickFirst, icon: 'none' }); return }
    wx.showModal({ title: this.data.t.submitTitle, content: this.data.t.submitNotify, confirmText: this.data.t.sendNotify, cancelText: this.data.t.noNotify, success: first => {
      const notifyEnabled = Boolean(first.confirm)
      wx.showModal({ title: this.data.t.confirmAgain, content: this.data.t.continueSubmit, success: second => { if (second.confirm) this.doSubmit(notifyEnabled) } })
    } })
  },
  async doSubmit(notifyEnabled) { if (this.data.submitting) return; this.setData({ submitting: true }); try { const result = await app.submitIngredients({ notifyEnabled }); wx.showToast({ title: result.local ? this.data.t.localOk : this.data.t.ok, icon: 'success' }); setTimeout(() => wx.switchTab({ url: '/pages/combo/combo' }), 700) } catch (err) { wx.showToast({ title: this.data.t.fail, icon: 'none' }) } finally { this.setData({ submitting: false }) } }
})
