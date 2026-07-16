Page({
  data: { t: {
    "title": "\u6b64\u9875\u9762\u5df2\u66ff\u6362",
    "hint": "\u8bf7\u8fd4\u56de\u9996\u9875\u6216\u8fdb\u5165\u70b9\u83dc\u9875",
    "home": "\u56de\u5230\u9996\u9875",
    "menu": "\u53bb\u70b9\u83dc"
} },
  goHome() { wx.switchTab({ url: '/pages/index/index' }) },
  goMenu() { wx.navigateTo({ url: '/pages/menu/menu' }) }
})
