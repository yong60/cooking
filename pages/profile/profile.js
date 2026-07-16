const api = require('../../utils/api')
const app = getApp()
Page({
  setTabBar() { const tabBar = typeof this.getTabBar === 'function' && this.getTabBar(); if (tabBar) tabBar.setData({ selected: 4 }) },
  data: { t: {
    "submitterDesc": "\u7528\u4e8e\u663e\u793a\u63d0\u4ea4\u4eba",
    "clearCart": "\u6e05\u7a7a\u70b9\u83dc\u8f66",
    "clearCartContent": "\u4f1a\u6e05\u7a7a\u4e24\u4e2a\u4eba\u5f53\u524d\u70b9\u7684\u83dc",
    "clearIngredients": "\u6e05\u7a7a\u98df\u6750",
    "clearIngredientsContent": "\u4f1a\u6e05\u7a7a\u4e24\u4e2a\u4eba\u5f53\u524d\u6311\u9009\u7684\u98df\u6750",
    "testSent": "\u6d4b\u8bd5\u901a\u77e5\u5df2\u53d1\u9001",
    "configPush": "\u8bf7\u5148\u914d\u7f6e pushplus",
    "wechatUser": "\u5fae\u4fe1\u7528\u6237",
    "notLogin": "\u672a\u767b\u5f55",
    "joined": "\u5df2\u8fdb\u5165\u80e1\u95f9\u53a8\u623f",
    "loginFirst": "\u8bf7\u5148\u6388\u6743\u767b\u5f55",
    "login": "\u6388\u6743\u767b\u5f55",
    "recipes": "\u5df2\u70b9\u83dc",
    "ingredients": "\u5df2\u9009\u98df\u6750",
    "actions": "\u5e38\u7528\u64cd\u4f5c",
    "testPush": "\ud83d\udce3 \u6d4b\u8bd5\u63a8\u9001\u901a\u77e5",
    "clearCartIcon": "\ud83d\uded2 \u6e05\u7a7a\u70b9\u83dc\u8f66",
    "clearIngredientsIcon": "\ud83e\udd66 \u6e05\u7a7a\u98df\u6750",
    "subtitle": "\u4e24\u4e2a\u4eba\u7684\u70b9\u83dc\u548c\u98df\u6750\u5c0f\u7a7a\u95f4",
    "profileTitle": "\ud83d\udc64 \u4e2a\u4eba\u8d44\u6599",
    "nickPlaceholder": "\u8f93\u5165\u4f60\u7684\u6635\u79f0",
    "chooseAvatar": "\u66f4\u6362\u5934\u50cf",
    "saveProfile": "\u4fdd\u5b58\u8d44\u6599",
    "saved": "\u5df2\u4fdd\u5b58",
    "bindTitle": "\ud83d\udc9e \u53cc\u4eba\u5171\u7528",
    "singleMode": "\u5f53\u524d\u662f\u5355\u4eba\u6a21\u5f0f",
    "coupleMode": "\u5df2\u7ed1\u5b9a\uff0c\u6b63\u5728\u53cc\u4eba\u5171\u7528",
    "myCode": "\u6211\u7684ID",
    "copyId": "\u70b9\u51fb\u590d\u5236ID",
    "copied": "\u5df2\u590d\u5236",
    "shareInvite": "\u5206\u4eab\u7ed9\u5bf9\u65b9",
    "shareTitle": "\u9080\u8bf7\u4f60\u52a0\u5165\u80e1\u95f9\u53a8\u623f",
    "joinInvite": "\u6536\u5230\u4e00\u4e2a\u5171\u7528\u9080\u8bf7",
    "joinHint": "\u70b9\u51fb\u8fd9\u5f20\u5361\u7247\u5373\u53ef\u548c\u5bf9\u65b9\u5171\u7528\u70b9\u83dc\u8f66\u548c\u98df\u6750\u3002",
    "join": "\u70b9\u51fb\u52a0\u5165",
    "partnerPlaceholder": "\u8f93\u5165\u5bf9\u65b9ID",
    "bind": "\u7ed1\u5b9a\u5bf9\u65b9",
    "unbind": "\u6062\u590d\u5355\u4eba\u6a21\u5f0f",
    "bindOk": "\u7ed1\u5b9a\u6210\u529f",
    "unbindOk": "\u5df2\u6062\u590d\u5355\u4eba\u6a21\u5f0f",
    "bindFail": "\u7ed1\u5b9a\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u5bf9\u65b9\u5df2\u767b\u5f55"
}, user: null, loggedIn: false, cartCount: 0, selectedCount: 0, profileForm: { nickName: '', avatarUrl: '' }, partnerId: '', sharedPartnerId: '' },
  onLoad(options = {}) {
    const partnerId = decodeURIComponent(options.partnerId || '')
    if (partnerId) this.setData({ partnerId, sharedPartnerId: partnerId })
  },
  async onShow() { this.setTabBar(); await app.loadState(); this.refresh() },
  refresh() {
    const user = app.globalData.user || {}
    this.setData({
      user,
      loggedIn: app.isLoggedIn(),
      cartCount: app.getCartCount(),
      selectedCount: app.getSelectedIngredients().length,
      profileForm: { nickName: user.nickName || '', avatarUrl: user.avatarUrl || '' }
    })
  },
  login() { if (wx.getUserProfile) { wx.getUserProfile({ desc: this.data.t.submitterDesc, success: async res => { await app.loginWithWechat(res.userInfo || {}); await app.loadState(); this.refresh() }, fail: async () => { await app.loginWithWechat({}); await app.loadState(); this.refresh() } }) } },
  clearCart() { wx.showModal({ title: this.data.t.clearCart, content: this.data.t.clearCartContent, success: async res => { if (res.confirm) { await app.clearCart(); this.refresh() } } }) },
  clearIngredients() { wx.showModal({ title: this.data.t.clearIngredients, content: this.data.t.clearIngredientsContent, success: async res => { if (res.confirm) { await app.updateIngredientSelection([]); this.refresh() } } }) },
  onNickInput(event) { this.setData({ 'profileForm.nickName': event.detail.value }) },
  onPartnerInput(event) { this.setData({ partnerId: event.detail.value }) },
  onChooseAvatar(event) { this.setData({ 'profileForm.avatarUrl': event.detail.avatarUrl }) },
  copyUserId() {
    if (!this.data.user || !this.data.user.id) return
    wx.setClipboardData({ data: this.data.user.id, success: () => wx.showToast({ title: this.data.t.copied, icon: 'success' }) })
  },
  async saveProfile() { await app.updateUserProfile(this.data.profileForm); this.refresh(); wx.showToast({ title: this.data.t.saved, icon: 'success' }) },
  async bindPartner() {
    try {
      await app.bindPartner((this.data.partnerId || '').trim())
      this.refresh()
      wx.showToast({ title: this.data.t.bindOk, icon: 'success' })
    } catch (err) { wx.showToast({ title: this.data.t.bindFail, icon: 'none' }) }
  },
  async unbindPartner() {
    await app.unbindPartner()
    this.refresh()
    wx.showToast({ title: this.data.t.unbindOk, icon: 'success' })
  },
  async joinSharedPartner() {
    if (this.data.sharedPartnerId) this.setData({ partnerId: this.data.sharedPartnerId })
    await this.bindPartner()
  },
  onShareAppMessage() {
    const user = this.data.user || {}
    return {
      title: this.data.t.shareTitle,
      path: `/pages/profile/profile?partnerId=${encodeURIComponent(user.id || '')}`
    }
  },
  async testNotify() { try { await api.testNotify({ userId: app.globalData.user && app.globalData.user.id }); wx.showToast({ title: this.data.t.testSent, icon: 'success' }) } catch (err) { wx.showToast({ title: this.data.t.configPush, icon: 'none' }) } }
})
