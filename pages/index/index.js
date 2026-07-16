const { appInfo } = require('../../utils/mock')
const api = require('../../utils/api')
const app = getApp()

Page({
  data: { appInfo, t: {
    "loginFirst": "\u8bf7\u5148\u6388\u6743\u767b\u5f55",
    "loginSuccess": "\u767b\u5f55\u6210\u529f",
    "submitterDesc": "\u7528\u4e8e\u663e\u793a\u63d0\u4ea4\u4eba",
    "wechatUser": "\u5fae\u4fe1\u7528\u6237",
    "loginRequired": "\u9996\u6b21\u8fdb\u5165\u9700\u8981\u5fae\u4fe1\u6388\u6743",
    "loginHint": "\u6388\u6743\u540e\u53ef\u4ee5\u540c\u6b65\u70b9\u83dc\u548c\u98df\u6750\u9009\u62e9",
    "loginBtn": "\u6388\u6743\u767b\u5f55",
    "backendReady": "\u5df2\u767b\u5f55\uff0c\u53ef\u540c\u6b65\u70b9\u83dc\u548c\u98df\u6750",
    "pickRecipes": "\u4eca\u5929\u70b9\u83dc",
    "pickRecipesDesc": "\u4ece\u4e24\u4e2a\u4eba\u7684\u83dc\u8c31\u91cc\u627e\u7075\u611f",
    "pickIngredients": "\u6311\u9009\u98df\u6750",
    "pickIngredientsDesc": "\u5148\u9009\u60f3\u5403\u7684\u98df\u6750",
    "picked": "\u5df2\u70b9",
    "selected": "\u5df2\u9009",
    "portion": "\u4efd",
    "kind": "\u79cd",
    "current": "\u5f53\u524d\u9009\u62e9",
    "viewCart": "\u67e5\u770b\u70b9\u83dc\u8f66",
    "cart": "\u70b9\u83dc\u8f66",
    "ingredients": "\u5df2\u9009\u98df\u6750",
    "tip": "\u63d0\u4ea4\u65f6\u53ef\u81ea\u884c\u9009\u62e9\u662f\u5426\u901a\u8fc7 pushplus \u901a\u77e5\u5bf9\u65b9\u3002",
    "logoIcon": "\ud83c\udf73",
    "menuIcon": "\ud83d\udcd6",
    "ingredientIcon": "\ud83e\udd66",
    "adminUnlocked": "\u7ba1\u7406\u6743\u9650\u5df2\u5f00\u542f",
    "adminAlready": "\u4f60\u5df2\u7ecf\u662f\u7ba1\u7406\u5458\u5566",
    "unlockLoginFirst": "\u8bf7\u5148\u767b\u5f55\u540e\u518d\u8bd5",
    "unlockFailed": "\u5f00\u542f\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5",
    "adminLocalUnlocked": "\u5df2\u5728\u672c\u673a\u5f00\u542f\u7ba1\u7406\u5165\u53e3"
}, user: null, loggedIn: false, cartCount: 0, selectedCount: 0, loggingIn: false, logoTapCount: 0, lastLogoTap: 0, logoFlipped: false, logoAnimClass: '' },
  async onShow() { this.setTabBar(); await app.loadCatalog(); await app.loadState(); this.refresh() },
  setTabBar() { const tabBar = typeof this.getTabBar === 'function' && this.getTabBar(); if (tabBar) tabBar.setData({ selected: 0 }) },
  refresh() { this.setData({ user: app.globalData.user, loggedIn: app.isLoggedIn(), cartCount: app.getCartCount(), selectedCount: app.getSelectedIngredients().length }) },
  login() {
    if (this.data.loggingIn) return
    this.setData({ loggingIn: true })
    const doLogin = profile => app.loginWithWechat(profile).then(() => app.loadState()).then(() => { this.setData({ loggingIn: false }); this.refresh(); wx.showToast({ title: this.data.t.loginSuccess, icon: 'success' }) })
    if (wx.getUserProfile) { wx.getUserProfile({ desc: this.data.t.submitterDesc, success: res => doLogin(res.userInfo || {}), fail: () => doLogin({}) }) } else doLogin({})
  },
  requireLogin() { if (app.isLoggedIn()) return true; wx.showToast({ title: this.data.t.loginFirst, icon: 'none' }); return false },
  goMenu() { if (this.requireLogin()) wx.navigateTo({ url: '/pages/menu/menu' }) },
  goIngredients() { if (this.requireLogin()) wx.navigateTo({ url: '/pages/ingredients/ingredients' }) },
  goCart() { if (this.requireLogin()) wx.navigateTo({ url: '/pages/cart/cart' }) },
  playLogoAnimation() {
    const next = !this.data.logoFlipped
    if (this.logoAnimTimer) clearTimeout(this.logoAnimTimer)
    this.setData({ logoFlipped: next, logoAnimClass: next ? 'logo-toss-forward' : 'logo-toss-back' })
    this.logoAnimTimer = setTimeout(() => this.setData({ logoAnimClass: '' }), 680)
  },
  async logoTap() {
    this.playLogoAnimation()
    const now = Date.now()
    const count = now - this.data.lastLogoTap < 1800 ? this.data.logoTapCount + 1 : 1
    this.setData({ logoTapCount: count, lastLogoTap: now })
    if (count > 6) {
      this.setData({ logoTapCount: 0 })
      try {
        if (!app.isLoggedIn()) {
          await app.loginWithWechat({})
          await app.loadState()
          this.refresh()
        }
        if (!app.isLoggedIn()) {
          wx.showToast({ title: this.data.t.unlockLoginFirst, icon: 'none' })
          return
        }
        let user = app.globalData.user || {}
        if (!api.hasBackend || !api.hasBackend() || (user.id || '').indexOf('local_') === 0) {
          wx.setStorageSync('adminUnlocked', true)
          wx.setStorageSync('localAdminUnlocked', true)
          wx.showToast({ title: this.data.t.adminLocalUnlocked, icon: 'success' })
          return
        }
        let result
        try {
          result = await api.unlockAdmin({ userId: user.id })
        } catch (err) {
          if (String(err && err.message || '').indexOf('user not found') >= 0) {
            user = await app.loginWithWechat({})
            await app.loadState()
            this.refresh()
            result = await api.unlockAdmin({ userId: user.id })
          } else {
            throw err
          }
        }
        wx.setStorageSync('adminUnlocked', true)
        wx.showToast({ title: result && result.alreadyAdmin ? this.data.t.adminAlready : this.data.t.adminUnlocked, icon: 'success' })
      } catch (err) {
        wx.showToast({ title: this.data.t.unlockFailed, icon: 'none' })
      }
    }
  }
})
