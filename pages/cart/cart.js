const config = require('../../utils/config')
const app = getApp()
Page({
  data: { t: {
    "loginFirst": "\u8bf7\u5148\u6388\u6743\u767b\u5f55",
    "loginSuccess": "\u767b\u5f55\u6210\u529f",
    "submitterDesc": "\u7528\u4e8e\u663e\u793a\u63d0\u4ea4\u4eba",
    "wechatUser": "\u5fae\u4fe1\u7528\u6237",
    "empty": "\u70b9\u83dc\u8f66\u8fd8\u662f\u7a7a\u7684",
    "submitConfirm": "\u786e\u8ba4\u63d0\u4ea4\u70b9\u83dc",
    "submitNotify": "\u662f\u5426\u901a\u8fc7 pushplus \u901a\u77e5\u5bf9\u65b9\uff1f",
    "sendNotify": "\u53d1\u9001\u901a\u77e5",
    "noNotify": "\u4ec5\u4fdd\u5b58",
    "confirmAgain": "\u518d\u6b21\u786e\u8ba4",
    "continueSubmit": "\u662f\u5426\u7ee7\u7eed\u63d0\u4ea4",
    "localOk": "\u672c\u5730\u63d0\u4ea4\u6210\u529f",
    "ok": "\u63d0\u4ea4\u6210\u529f",
    "fail": "\u63d0\u4ea4\u5931\u8d25",
    "title": "\u786e\u8ba4\u4eca\u665a\u60f3\u5403\u7684\u83dc",
    "subtitle": "\u8fd9\u662f\u4e24\u4e2a\u4eba\u5171\u4eab\u7684\u70b9\u83dc\u8f66",
    "portion": "\u4efd",
    "pickedRecipes": "\u5df2\u70b9\u83dc\u54c1",
    "emptyHint": "\u70b9\u83dc\u8f66\u8fd8\u662f\u7a7a\u7684\uff0c\u5148\u53bb\u6311\u51e0\u9053\u83dc\u5427\u3002",
    "remark": "\u5907\u6ce8",
    "placeholder": "\u4f8b\u5982\uff1a\u5c11\u8fa3\u3001\u4e0d\u8981\u592a\u6cb9",
    "items": "\u4efd\u83dc",
    "doubleConfirm": "\u63d0\u4ea4\u524d\u53ef\u9009\u62e9\u662f\u5426\u901a\u77e5",
    "submit": "\u63d0\u4ea4\u70b9\u83dc"
}, items: [], cartCount: 0, remark: '', submitting: false, pollTimer: null },
  async onShow() { if (!app.isLoggedIn()) { wx.showToast({ title: this.data.t.loginFirst, icon: 'none' }); wx.switchTab({ url: '/pages/index/index' }); return } await app.loadCatalog(); await app.loadState(); this.refresh(); this.startPolling() },
  onHide() { this.stopPolling() }, onUnload() { this.stopPolling() },
  startPolling() { this.stopPolling(); const timer = setInterval(async () => { await app.loadState(); this.refresh() }, config.POLL_INTERVAL || 3000); this.setData({ pollTimer: timer }) },
  stopPolling() { if (this.data.pollTimer) clearInterval(this.data.pollTimer); this.setData({ pollTimer: null }) },
  refresh() { this.setData({ items: app.getCartItems(), cartCount: app.getCartCount() }) },
  async add(event) { await app.addToCart(event.currentTarget.dataset.id); this.refresh() },
  async minus(event) { await app.minusFromCart(event.currentTarget.dataset.id); this.refresh() },
  onRemark(event) { this.setData({ remark: event.detail.value }) },
  submitOrder() {
    if (!this.data.items.length) { wx.showToast({ title: this.data.t.empty, icon: 'none' }); return }
    wx.showModal({ title: this.data.t.submitConfirm, content: this.data.t.submitNotify, confirmText: this.data.t.sendNotify, cancelText: this.data.t.noNotify, success: first => {
      const notifyEnabled = Boolean(first.confirm)
      wx.showModal({ title: this.data.t.confirmAgain, content: this.data.t.continueSubmit, success: second => { if (second.confirm) this.doSubmit(notifyEnabled) } })
    } })
  },
  async doSubmit(notifyEnabled) { if (this.data.submitting) return; this.setData({ submitting: true }); try { const result = await app.submitCart({ remark: this.data.remark, notifyEnabled }); await app.clearCart(); this.refresh(); wx.showToast({ title: result.local ? this.data.t.localOk : this.data.t.ok, icon: 'success' }); setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 700) } catch (err) { wx.showToast({ title: this.data.t.fail, icon: 'none' }) } finally { this.setData({ submitting: false }) } }
})
