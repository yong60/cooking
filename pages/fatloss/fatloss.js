const api = require('../../utils/api')
const app = getApp()

const groups = [
  {
    id: 'carb',
    name: '\u78b3\u6c34',
    limit: 1,
    items: [
      { id: 'brown_rice', name: '\u7cd9\u7c73\u996d', amount: '\u534a\u7897' },
      { id: 'corn', name: '\u7389\u7c73', amount: '\u534a\u6839' },
      { id: 'sweet_potato', name: '\u7ea2\u85af', amount: '\u4e00\u5c0f\u4e2a' },
      { id: 'oats', name: '\u71d5\u9ea6', amount: '\u4e00\u5c0f\u7897' }
    ]
  },
  {
    id: 'protein',
    name: '\u86cb\u767d\u8d28',
    limit: 2,
    items: [
      { id: 'chicken', name: '\u9e21\u80f8\u8089', amount: '\u4e00\u638c\u5fc3' },
      { id: 'egg', name: '\u9e21\u86cb', amount: '\u4e00\u5230\u4e24\u4e2a' },
      { id: 'shrimp', name: '\u867e\u4ec1', amount: '\u4e00\u5c0f\u76d8' },
      { id: 'tofu', name: '\u8c46\u8150', amount: '\u4e00\u5c0f\u5757' },
      { id: 'beef', name: '\u725b\u8089', amount: '\u4e00\u638c\u5fc3' }
    ]
  },
  {
    id: 'veg',
    name: '\u852c\u83dc',
    limit: 3,
    items: [
      { id: 'broccoli', name: '\u897f\u5170\u82b1', amount: '\u4e00\u5927\u7897' },
      { id: 'lettuce', name: '\u751f\u83dc', amount: '\u4e00\u5927\u7897' },
      { id: 'tomato', name: '\u756a\u8304', amount: '\u4e00\u4e2a' },
      { id: 'cucumber', name: '\u9ec4\u74dc', amount: '\u4e00\u6839' },
      { id: 'mushroom', name: '\u83cc\u83c7', amount: '\u4e00\u5c0f\u76d8' }
    ]
  },
  {
    id: 'extra',
    name: '\u642d\u914d',
    limit: 2,
    items: [
      { id: 'olive_oil', name: '\u6a44\u6984\u6cb9', amount: '\u5c11\u91cf' },
      { id: 'nuts', name: '\u575a\u679c', amount: '\u4e00\u5c0f\u628a' },
      { id: 'yogurt', name: '\u65e0\u7cd6\u9178\u5976', amount: '\u4e00\u676f' },
      { id: 'black_pepper', name: '\u9ed1\u80e1\u6912', amount: '\u5c11\u91cf' }
    ]
  }
]

Page({
  data: {
    t: {
      title: '\u51cf\u8102\u9910\u642d\u914d',
      subtitle: '\u9009\u51e0\u6837\u98df\u6750\uff0c\u62fc\u4e00\u4efd\u6e05\u723d\u9971\u8179\u7684\u4e00\u9910',
      selected: '\u5df2\u9009',
      clear: '\u6e05\u7a7a',
      make: '\u751f\u6210\u642d\u914d',
      addToCart: '\u52a0\u5165\u70b9\u83dc\u8f66',
      added: '\u5df2\u52a0\u5165\u70b9\u83dc\u8f66',
      result: '\u4eca\u5929\u53ef\u4ee5\u8fd9\u6837\u5403',
      empty: '\u5148\u9009\u4e00\u4e9b\u98df\u6750\u5427',
      tip: '\u5efa\u8bae\u70f9\u996a\u5c11\u6cb9\u5c11\u7cd6\uff0c\u53e3\u5473\u6e05\u723d\u4e00\u70b9\u3002'
    },
    groups: groups.map(group => ({ ...group, items: group.items.map(item => ({ ...item, selected: false })) })),
    selectedCount: 0,
    plan: []
  },
  onShow() { this.setTabBar(); this.loadGroups() },
  setTabBar() { const tabBar = typeof this.getTabBar === 'function' && this.getTabBar(); if (tabBar) tabBar.setData({ selected: 2 }) },
  loadGroups() {
    const saved = wx.getStorageSync('fatLossGroups')
    if (saved && saved.length) {
      this.setData({ groups: saved.map(group => ({ ...group, items: (group.items || []).map(item => ({ ...item, selected: false })) })), selectedCount: 0, plan: [] })
    }
  },
  toggleItem(event) {
    const groupId = event.currentTarget.dataset.group
    const id = event.currentTarget.dataset.id
    const groups = this.data.groups.map(group => {
      if (group.id !== groupId) return group
      const selectedCount = group.items.filter(item => item.selected).length
      const items = group.items.map(item => {
        if (item.id !== id) return item
        if (!item.selected && selectedCount >= group.limit) return item
        return { ...item, selected: !item.selected }
      })
      return { ...group, items }
    })
    this.setData({ groups, selectedCount: this.countSelected(groups), plan: [] })
  },
  countSelected(groups) {
    return groups.reduce((sum, group) => sum + group.items.filter(item => item.selected).length, 0)
  },
  clear() {
    const groups = this.data.groups.map(group => ({ ...group, items: group.items.map(item => ({ ...item, selected: false })) }))
    this.setData({ groups, selectedCount: 0, plan: [] })
  },
  selectedByGroup() {
    const result = {}
    this.data.groups.forEach(group => {
      result[group.id] = group.items.filter(item => item.selected)
    })
    return result
  },
  async makePlan() {
    if (!this.data.selectedCount) {
      wx.showToast({ title: this.data.t.empty, icon: 'none' })
      return
    }
    const selected = this.selectedByGroup()
    try {
      if (api.fatLossPlan && api.hasBackend && api.hasBackend()) {
        const remote = await api.fatLossPlan({ selected })
        if (remote && remote.plan && remote.plan.length) {
          this.setData({ plan: remote.plan })
          return
        }
      }
    } catch (err) {}
    const plan = []
    ;['carb', 'protein', 'veg', 'extra'].forEach(key => {
      ;(selected[key] || []).forEach(item => plan.push(`${item.name}：${item.amount}`))
    })
    this.setData({ plan })
  },
  async addPlanToCart() {
    if (!this.data.plan.length) return
    const name = '\u81ea\u9009\u51cf\u8102\u9910\u5957\u9910'
    const desc = this.data.plan.join('\uff1b')
    const selected = this.selectedByGroup()
    const ingredients = []
    ;['carb', 'protein', 'veg', 'extra'].forEach(key => {
      ;(selected[key] || []).forEach(item => ingredients.push(item.id))
    })
    await app.addCustomRecipeToCart({
      id: `fatloss_${Date.now()}`,
      name,
      desc,
      ingredients,
      tags: ['\u51cf\u8102', '\u81ea\u9009'],
      cover: '\uD83E\uDD57'
    })
    wx.showToast({ title: this.data.t.added, icon: 'success' })
  }
})
