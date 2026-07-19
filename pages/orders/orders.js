const app = getApp()

function timeText(value) {
  if (!value) return ''
  const date = typeof value === 'number' ? new Date(value) : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

Page({
  data: {
    t: {
      title: '历史订单',
      hint: '这里会保留点菜和食材提交记录',
      empty: '还没有提交记录',
      cart: '点菜',
      ingredients: '食材',
      notified: '已通知',
      notNotified: '未通知',
      local: '本地记录',
      remark: '备注',
      menu: '去点菜',
      ingredientsBtn: '挑食材'
    },
    logs: []
  },
  async onShow() {
    if (app.isLoggedIn()) await app.loadState()
    this.refresh()
  },
  refresh() {
    const logs = app.getSubmitLogs().map(item => {
      const notifyEnabled = item.notifyEnabled !== false
      const notifySkipped = item.notify && item.notify.skipped
      return {
        ...item,
        timeText: timeText(item.createdAt),
        title: item.type === 'ingredients' ? this.data.t.ingredients : this.data.t.cart,
        notifyText: notifyEnabled && !notifySkipped ? this.data.t.notified : this.data.t.notNotified,
        itemText: item.type === 'ingredients'
          ? (item.ingredients || []).map(x => x.name).join('、')
          : (item.items || []).map(x => `${x.name} x${x.quantity || 1}`).join('、')
      }
    })
    this.setData({ logs })
  },
  goMenu() { wx.navigateTo({ url: '/pages/menu/menu' }) },
  goIngredients() { wx.navigateTo({ url: '/pages/ingredients/ingredients' }) }
})
