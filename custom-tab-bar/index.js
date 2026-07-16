Component({
  data: {
    selected: 0,
    color: '#9a918b',
    selectedColor: '#ff5a1f',
    list: [
      { pagePath: '/pages/index/index', text: '\u9996\u9875', iconPath: '/assets/tabbar/home.png', selectedIconPath: '/assets/tabbar/home-active.png', fallback: '\u9996' },
      { pagePath: '/pages/combo/combo', text: '\u7ec4\u5408', iconPath: '/assets/tabbar/combo.png', selectedIconPath: '/assets/tabbar/combo-active.png', fallback: '\u7ec4' },
      { pagePath: '/pages/fatloss/fatloss', text: '\u51cf\u8102', iconPath: '/assets/tabbar/fatloss.png', selectedIconPath: '/assets/tabbar/fatloss-active.png', fallback: '\u51cf' },
      { pagePath: '/pages/admin/admin', text: '\u7ba1\u7406', iconPath: '/assets/tabbar/admin.png', selectedIconPath: '/assets/tabbar/admin-active.png', fallback: '\u7ba1' },
      { pagePath: '/pages/profile/profile', text: '\u8bbe\u7f6e', iconPath: '/assets/tabbar/profile.png', selectedIconPath: '/assets/tabbar/profile-active.png', fallback: '\u8bbe' }
    ]
  },
  methods: {
    switchTab(event) {
      const index = Number(event.currentTarget.dataset.index)
      const item = this.data.list[index]
      if (!item) return
      wx.switchTab({ url: item.pagePath })
    },
    iconError(event) {
      const index = Number(event.currentTarget.dataset.index)
      if (Number.isNaN(index)) return
      this.setData({ [`list[${index}].iconBroken`]: true })
    }
  }
})
