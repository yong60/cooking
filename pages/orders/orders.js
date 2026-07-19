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
      title: '\u5386\u53f2\u8ba2\u5355',
      hint: '\u70b9\u51fb\u8bb0\u5f55\u53ef\u67e5\u770b\u8be6\u60c5\uff0c\u4e5f\u53ef\u4ee5\u6279\u91cf\u6574\u7406\u5386\u53f2\u8bb0\u5f55',
      empty: '\u8fd8\u6ca1\u6709\u63d0\u4ea4\u8bb0\u5f55',
      cart: '\u70b9\u83dc\u8bb0\u5f55',
      ingredients: '\u98df\u6750\u8bb0\u5f55',
      notified: '\u5df2\u901a\u77e5',
      notNotified: '\u672a\u901a\u77e5',
      local: '\u672c\u5730\u8bb0\u5f55',
      remark: '\u5907\u6ce8',
      menu: '\u53bb\u70b9\u83dc',
      ingredientsBtn: '\u6311\u98df\u6750',
      select: '\u9009\u62e9',
      done: '\u5b8c\u6210',
      delete: '\u5220\u9664',
      clear: '\u6e05\u7a7a',
      deleteSelected: '\u5220\u9664\u9009\u4e2d',
      selected: '\u5df2\u9009',
      submitter: '\u63d0\u4ea4\u4eba',
      userId: '\u7528\u6237ID',
      detail: '\u8be6\u60c5',
      orderContent: '\u63d0\u4ea4\u5185\u5bb9',
      notifyStatus: '\u901a\u77e5\u72b6\u6001',
      confirmDelete: '\u5220\u9664\u8fd9\u6761\u8bb0\u5f55\uff1f',
      confirmBatch: '\u5220\u9664\u9009\u4e2d\u7684\u5386\u53f2\u8ba2\u5355\uff1f',
      confirmClear: '\u6e05\u7a7a\u5168\u90e8\u5386\u53f2\u8ba2\u5355\uff1f',
      noSelection: '\u8bf7\u5148\u9009\u62e9\u8bb0\u5f55',
      deleted: '\u5df2\u5220\u9664',
      unknownUser: '\u5fae\u4fe1\u7528\u6237'
    },
    logs: [],
    selectMode: false,
    selectedIds: [],
    expandedId: '',
    loading: false
  },
  async onShow() { await this.reload() },
  async reload() {
    this.setData({ loading: true })
    if (app.isLoggedIn()) await app.loadSubmitLogs()
    const selected = new Set(this.data.selectedIds)
    const logs = app.getSubmitLogs().map(item => this.decorateLog(item, selected))
    this.setData({ logs, loading: false })
  },
  decorateLog(item, selected) {
    const notifyEnabled = item.notifyEnabled !== false
    const notifySkipped = item.notify && item.notify.skipped
    const isIngredients = item.type === 'ingredients'
    const submitter = item.submitter || {}
    const contentRows = isIngredients
      ? (item.ingredients || []).map(x => ({ name: x.name, desc: '' }))
      : (item.items || []).map(x => ({ name: x.name, desc: `x${x.quantity || 1}` }))
    return {
      ...item,
      checked: selected.has(item.id),
      expanded: this.data.expandedId === item.id,
      timeText: timeText(item.createdAt),
      title: isIngredients ? this.data.t.ingredients : this.data.t.cart,
      notifyText: notifyEnabled && !notifySkipped ? this.data.t.notified : this.data.t.notNotified,
      submitterName: submitter.nickName || this.data.t.unknownUser,
      submitterId: submitter.id || '',
      submitterAvatar: submitter.avatarUrl || '',
      itemText: contentRows.map(x => x.desc ? `${x.name} ${x.desc}` : x.name).join('\u3001'),
      contentRows
    }
  },
  toggleSelectMode() {
    this.setData({ selectMode: !this.data.selectMode, selectedIds: [], expandedId: '' }, () => this.reload())
  },
  toggleDetail(event) {
    if (this.data.selectMode) return
    const id = event.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? '' : id }, () => this.reload())
  },
  toggleSelect(event) {
    const id = event.currentTarget.dataset.id
    const set = new Set(this.data.selectedIds)
    set.has(id) ? set.delete(id) : set.add(id)
    this.setData({ selectedIds: Array.from(set) }, () => this.reload())
  },
  deleteOne(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({ title: this.data.t.confirmDelete, success: async res => {
      if (!res.confirm) return
      await app.deleteSubmitLogs([id], false)
      wx.showToast({ title: this.data.t.deleted, icon: 'success' })
      this.setData({ expandedId: '', selectedIds: [] })
      await this.reload()
    }})
  },
  deleteSelected() {
    if (!this.data.selectedIds.length) { wx.showToast({ title: this.data.t.noSelection, icon: 'none' }); return }
    wx.showModal({ title: this.data.t.confirmBatch, success: async res => {
      if (!res.confirm) return
      await app.deleteSubmitLogs(this.data.selectedIds, false)
      wx.showToast({ title: this.data.t.deleted, icon: 'success' })
      this.setData({ selectedIds: [], selectMode: false })
      await this.reload()
    }})
  },
  clearAll() {
    if (!this.data.logs.length) return
    wx.showModal({ title: this.data.t.confirmClear, success: async res => {
      if (!res.confirm) return
      await app.deleteSubmitLogs([], true)
      wx.showToast({ title: this.data.t.deleted, icon: 'success' })
      this.setData({ selectedIds: [], selectMode: false, expandedId: '' })
      await this.reload()
    }})
  },
  goMenu() { wx.navigateTo({ url: '/pages/menu/menu' }) },
  goIngredients() { wx.navigateTo({ url: '/pages/ingredients/ingredients' }) }
})
