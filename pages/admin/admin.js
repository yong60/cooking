const api = require('../../utils/api')
const app = getApp()

const RECIPE_CATEGORIES = [
  { id: 'home', name: '\u5bb6\u5e38' },
  { id: 'meat', name: '\u8089\u83dc' },
  { id: 'vegetable', name: '\u7d20\u83dc' },
  { id: 'staple', name: '\u4e3b\u98df' },
  { id: 'soup', name: '\u6c64\u7fb9' }
]
const INGREDIENT_CATEGORIES = [
  { id: 'meat', name: '\u8089\u79bd\u86cb' },
  { id: 'seafood', name: '\u6c34\u4ea7' },
  { id: 'veg', name: '\u852c\u83dc' },
  { id: 'soy', name: '\u8c46\u5236\u54c1' },
  { id: 'staple', name: '\u4e3b\u98df' },
  { id: 'mushroom', name: '\u83cc\u83c7' },
  { id: 'seasoning', name: '\u8c03\u6599' }
]
const COMMON_TAGS = ['\u5feb\u624b', '\u4e0b\u996d', '\u4eba\u6c14', '\u8089\u83dc', '\u7d20\u83dc', '\u4e3b\u98df', '\u6c64', '\u6e05\u6de1', '\u5fae\u8fa3', '\u786c\u83dc']

const text = {
  title: '\u7ba1\u7406\u540e\u53f0',
  subtitle: '\u7b80\u5355\u7ef4\u62a4\u83dc\u5355\u548c\u98df\u6750\uff0c\u9ad8\u7ea7\u8bbe\u7f6e\u53ef\u6309\u9700\u5c55\u5f00',
  loading: '\u52a0\u8f7d\u4e2d...',
  noPermission: '\u60a8\u8fd8\u6ca1\u6709\u8be5\u90e8\u5206\u6743\u9650\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u83b7\u53d6\u76f8\u5173\u6743\u9650\u54e6~',
  recipes: '\u83dc\u5355\u5217\u8868',
  ingredients: '\u98df\u6750\u5217\u8868',
  addRecipe: '\u65b0\u589e\u83dc\u54c1',
  addIngredient: '\u65b0\u589e\u98df\u6750',
  edit: '\u7f16\u8f91',
  del: '\u5220\u9664',
  save: '\u4fdd\u5b58',
  cancel: '\u53d6\u6d88',
  name: '\u540d\u79f0',
  desc: '\u63cf\u8ff0',
  image: '\u83dc\u54c1\u56fe\u7247\uff08\u53ef\u586b\u56fe\u7247\u94fe\u63a5\u6216 emoji\uff09',
  ingredientIcon: '\u98df\u6750\u56fe\u6807\uff08\u586b emoji \u5c31\u884c\uff09',
  tags: '\u6807\u7b7e',
  customTags: '\u81ea\u5b9a\u4e49\u6807\u7b7e\uff0c\u7528\u9017\u53f7\u9694\u5f00',
  selectedIngredients: '\u8fd9\u9053\u83dc\u4f1a\u7528\u5230\u7684\u98df\u6750',
  optionalMore: '\u66f4\u591a\u8bbe\u7f6e\uff08\u53ef\u9009\uff09',
  hideOptions: '\u6536\u8d77\u66f4\u591a\u8bbe\u7f6e',
  category: '\u5206\u7c7b',
  recipeId: '\u83dc\u54c1ID\uff08\u53ef\u9009\uff0c\u7559\u7a7a\u81ea\u52a8\u751f\u6210\uff09',
  ingredientId: '\u98df\u6750ID\uff08\u53ef\u9009\uff0c\u7559\u7a7a\u81ea\u52a8\u751f\u6210\uff09',
  imageHint: '\u63d0\u793a\uff1a\u4e0d\u586b\u56fe\u7247\u65f6\u4f1a\u663e\u793a\u9ed8\u8ba4\u56fe\u6807\uff0c\u4e0d\u518d\u663e\u793a\u7f16\u53f7\u3002',
  ingredientHint: '\u4e0d\u60f3\u9009\u98df\u6750\u65f6\u53ef\u4ee5\u5148\u7559\u7a7a\uff0c\u4ee5\u540e\u518d\u8865\u3002',
  confirmDelete: '\u786e\u8ba4\u5220\u9664\uff1f',
  saved: '\u5df2\u4fdd\u5b58',
  deleted: '\u5df2\u5220\u9664',
  failed: '\u64cd\u4f5c\u5931\u8d25'
}

function parseList(value) {
  return (value || '').replace(/\uFF0C/g, ',').split(',').map(x => x.trim()).filter(Boolean)
}
function listText(list) {
  return (list || []).join(',')
}
function isImageCover(value) {
  const cover = String(value || '').trim()
  return /^https?:\/\//i.test(cover) || cover.indexOf('cloud://') === 0 || cover.indexOf('/') === 0
}
function coverText(value) {
  const cover = String(value || '').trim()
  if (!cover || /^\d+$/.test(cover) || isImageCover(cover)) return '\uD83D\uDCF7'
  return cover
}
function emptyRecipe() {
  return { id: '', name: '', desc: '', categoryId: 'home', tagsText: '', ingredientsText: '', cover: '' }
}
function emptyIngredient() {
  return { id: '', name: '', categoryId: 'veg', emoji: '' }
}
function recipeToForm(item) {
  return {
    id: item.id || '',
    name: item.name || '',
    desc: item.desc || '',
    categoryId: item.categoryId || 'home',
    tagsText: listText(item.tags),
    ingredientsText: listText(item.ingredients),
    cover: /^\d+$/.test(String(item.cover || '')) ? '' : (item.cover || '')
  }
}
function formToRecipe(form) {
  return {
    id: (form.id || '').trim(),
    name: (form.name || '').trim(),
    desc: (form.desc || '').trim(),
    categoryId: form.categoryId || 'home',
    tags: parseList(form.tagsText),
    ingredients: parseList(form.ingredientsText),
    cover: (form.cover || '').trim()
  }
}
function formToIngredient(form) {
  return {
    id: (form.id || '').trim(),
    name: (form.name || '').trim(),
    categoryId: form.categoryId || 'veg',
    emoji: (form.emoji || '').trim()
  }
}

Page({
  setTabBar() { const tabBar = typeof this.getTabBar === 'function' && this.getTabBar(); if (tabBar) tabBar.setData({ selected: 3 }) },
  data: {
    t: text,
    loading: true,
    unlocked: false,
    isAdmin: false,
    activeTab: 'recipes',
    recipes: [],
    ingredients: [],
    recipeCategories: RECIPE_CATEGORIES,
    ingredientCategories: INGREDIENT_CATEGORIES,
    commonRecipeTags: COMMON_TAGS.map(name => ({ name, selected: false })),
    ingredientChoices: [],
    editingType: '',
    recipeAdvanced: false,
    ingredientAdvanced: false,
    recipeForm: emptyRecipe(),
    ingredientForm: emptyIngredient()
  },

  async onShow() {
    this.setTabBar()
    const unlocked = Boolean(wx.getStorageSync('adminUnlocked'))
    this.setData({ unlocked })
    if (!unlocked) {
      this.setData({ loading: false, isAdmin: false })
      return
    }
    await this.ensureLogin()
    await this.checkPermission()
  },

  async ensureLogin() {
    if (!app.isLoggedIn()) await app.loginWithWechat({})
  },

  decorateRecipe(item) {
    return { ...item, coverIsImage: isImageCover(item.cover), coverText: coverText(item.cover), tags: item.tags || [], ingredients: item.ingredients || [] }
  },
  decorateIngredient(item) {
    const category = INGREDIENT_CATEGORIES.find(row => row.id === item.categoryId)
    return { ...item, emoji: item.emoji || '\uD83E\uDD66', categoryName: category ? category.name : (item.categoryId || '') }
  },
  buildCommonTags(form) {
    const selected = new Set(parseList(form.tagsText))
    return COMMON_TAGS.map(name => ({ name, selected: selected.has(name) }))
  },
  buildIngredientChoices(form) {
    const selected = new Set(parseList(form.ingredientsText))
    return (this.data.ingredients || []).map(item => ({ ...item, selected: selected.has(item.id) }))
  },
  setRecipeForm(form) {
    this.setData({ recipeForm: form, commonRecipeTags: this.buildCommonTags(form), ingredientChoices: this.buildIngredientChoices(form) })
  },

  loadLocalCatalog() {
    const local = wx.getStorageSync('localCatalog') || {}
    const recipes = (local.recipes || app.globalData.recipes || []).map(item => this.decorateRecipe(item))
    const ingredients = (local.ingredients || app.globalData.ingredients || []).map(item => this.decorateIngredient(item))
    app.globalData.recipes = recipes
    app.globalData.ingredients = ingredients
    this.setData({ isAdmin: true, recipes, ingredients, loading: false })
    this.setRecipeForm(this.data.recipeForm)
  },
  saveLocalCatalog(recipes = this.data.recipes, ingredients = this.data.ingredients) {
    const cleanRecipes = (recipes || []).map(item => ({
      id: item.id,
      categoryId: item.categoryId || 'home',
      name: item.name || '',
      desc: item.desc || '',
      ingredients: item.ingredients || [],
      tags: item.tags || [],
      cover: item.cover || ''
    }))
    const cleanIngredients = (ingredients || []).map(item => ({
      id: item.id,
      categoryId: item.categoryId || 'veg',
      name: item.name || '',
      emoji: item.emoji || ''
    }))
    wx.setStorageSync('localCatalog', { recipes: cleanRecipes, ingredients: cleanIngredients })
    app.globalData.recipes = cleanRecipes
    app.globalData.ingredients = cleanIngredients
  },
  nextLocalId(prefix, list) {
    const nums = (list || []).map(item => String(item.id || '').replace(prefix, '')).map(x => Number(x)).filter(x => !Number.isNaN(x))
    const next = (nums.length ? Math.max(...nums) : 0) + 1
    return prefix + String(next).padStart(3, '0')
  },

  async checkPermission() {
    this.setData({ loading: true })
    if (!api.hasBackend || !api.hasBackend() || wx.getStorageSync('localAdminUnlocked')) {
      this.loadLocalCatalog()
      return
    }
    try {
      const userId = app.globalData.user && app.globalData.user.id
      const status = await api.adminStatus(userId)
      if (!status.isAdmin) {
        this.setData({ isAdmin: false, loading: false })
        return
      }
      const catalog = await api.adminCatalog(userId)
      const ingredients = (catalog.ingredients || []).map(item => this.decorateIngredient(item))
      const recipes = (catalog.recipes || []).map(item => this.decorateRecipe(item))
      this.setData({ isAdmin: true, recipes, ingredients, loading: false })
      this.setRecipeForm(this.data.recipeForm)
    } catch (err) {
      this.loadLocalCatalog()
    }
  },

  switchTab(event) { this.setData({ activeTab: event.currentTarget.dataset.tab, editingType: '' }) },
  startAddRecipe() { this.setData({ editingType: 'recipe', recipeAdvanced: false }); this.setRecipeForm(emptyRecipe()) },
  startAddIngredient() { this.setData({ editingType: 'ingredient', ingredientAdvanced: false, ingredientForm: emptyIngredient() }) },
  editRecipe(event) {
    const item = this.data.recipes.find(x => x.id === event.currentTarget.dataset.id)
    if (item) { this.setData({ editingType: 'recipe', recipeAdvanced: false }); this.setRecipeForm(recipeToForm(item)) }
  },
  editIngredient(event) {
    const item = this.data.ingredients.find(x => x.id === event.currentTarget.dataset.id)
    if (item) this.setData({ editingType: 'ingredient', ingredientAdvanced: false, ingredientForm: { id: item.id || '', name: item.name || '', categoryId: item.categoryId || 'veg', emoji: item.emoji || '' } })
  },
  cancelEdit() { this.setData({ editingType: '', recipeAdvanced: false, ingredientAdvanced: false, recipeForm: emptyRecipe(), ingredientForm: emptyIngredient() }) },
  toggleRecipeAdvanced() { this.setData({ recipeAdvanced: !this.data.recipeAdvanced }) },
  toggleIngredientAdvanced() { this.setData({ ingredientAdvanced: !this.data.ingredientAdvanced }) },
  onRecipeInput(event) {
    const field = event.currentTarget.dataset.field
    const form = { ...this.data.recipeForm, [field]: event.detail.value }
    this.setRecipeForm(form)
  },
  onIngredientInput(event) { this.setData({ [`ingredientForm.${event.currentTarget.dataset.field}`]: event.detail.value }) },
  toggleTag(event) {
    const name = event.currentTarget.dataset.name
    const tags = parseList(this.data.recipeForm.tagsText)
    const next = tags.includes(name) ? tags.filter(x => x !== name) : [...tags, name]
    this.setRecipeForm({ ...this.data.recipeForm, tagsText: listText(next) })
  },
  chooseRecipeCategory(event) { this.setRecipeForm({ ...this.data.recipeForm, categoryId: event.currentTarget.dataset.id }) },
  chooseIngredientCategory(event) { this.setData({ 'ingredientForm.categoryId': event.currentTarget.dataset.id }) },
  toggleRecipeIngredient(event) {
    const id = event.currentTarget.dataset.id
    const ids = parseList(this.data.recipeForm.ingredientsText)
    const next = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    this.setRecipeForm({ ...this.data.recipeForm, ingredientsText: listText(next) })
  },

  async saveRecipe() {
    try {
      const userId = app.globalData.user && app.globalData.user.id
      const item = formToRecipe(this.data.recipeForm)
      if (!api.hasBackend || !api.hasBackend() || wx.getStorageSync('localAdminUnlocked')) {
        const recipes = [...this.data.recipes]
        if (!item.id) item.id = this.nextLocalId('r', recipes)
        const index = recipes.findIndex(x => x.id === item.id)
        if (index >= 0) recipes[index] = this.decorateRecipe(item)
        else recipes.unshift(this.decorateRecipe(item))
        this.saveLocalCatalog(recipes, this.data.ingredients)
        this.setData({ recipes })
      } else if (item.id) await api.updateRecipe({ userId, item })
      else await api.createRecipe({ userId, item })
      wx.showToast({ title: this.data.t.saved, icon: 'success' })
      this.cancelEdit()
      await this.checkPermission()
      await app.loadCatalog()
    } catch (err) { wx.showToast({ title: this.data.t.failed, icon: 'none' }) }
  },

  async saveIngredient() {
    try {
      const userId = app.globalData.user && app.globalData.user.id
      const item = formToIngredient(this.data.ingredientForm)
      if (!api.hasBackend || !api.hasBackend() || wx.getStorageSync('localAdminUnlocked')) {
        const ingredients = [...this.data.ingredients]
        if (!item.id) item.id = this.nextLocalId('i', ingredients)
        const index = ingredients.findIndex(x => x.id === item.id)
        if (index >= 0) ingredients[index] = this.decorateIngredient(item)
        else ingredients.unshift(this.decorateIngredient(item))
        this.saveLocalCatalog(this.data.recipes, ingredients)
        this.setData({ ingredients })
      } else if (item.id) await api.updateIngredient({ userId, item })
      else await api.createIngredient({ userId, item })
      wx.showToast({ title: this.data.t.saved, icon: 'success' })
      this.cancelEdit()
      await this.checkPermission()
      await app.loadCatalog()
    } catch (err) { wx.showToast({ title: this.data.t.failed, icon: 'none' }) }
  },

  deleteRecipe(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({ title: this.data.t.confirmDelete, success: async res => {
      if (!res.confirm) return
      try {
        if (!api.hasBackend || !api.hasBackend() || wx.getStorageSync('localAdminUnlocked')) {
          const recipes = this.data.recipes.filter(item => item.id !== id)
          this.saveLocalCatalog(recipes, this.data.ingredients)
          this.setData({ recipes })
        } else {
          await api.deleteRecipe({ userId: app.globalData.user && app.globalData.user.id, id })
        }
        wx.showToast({ title: this.data.t.deleted, icon: 'success' })
        await this.checkPermission(); await app.loadCatalog()
      } catch (err) { wx.showToast({ title: this.data.t.failed, icon: 'none' }) }
    }})
  },

  deleteIngredient(event) {
    const id = event.currentTarget.dataset.id
    wx.showModal({ title: this.data.t.confirmDelete, success: async res => {
      if (!res.confirm) return
      try {
        if (!api.hasBackend || !api.hasBackend() || wx.getStorageSync('localAdminUnlocked')) {
          const ingredients = this.data.ingredients.filter(item => item.id !== id)
          this.saveLocalCatalog(this.data.recipes, ingredients)
          this.setData({ ingredients })
        } else {
          await api.deleteIngredient({ userId: app.globalData.user && app.globalData.user.id, id })
        }
        wx.showToast({ title: this.data.t.deleted, icon: 'success' })
        await this.checkPermission(); await app.loadCatalog()
      } catch (err) { wx.showToast({ title: this.data.t.failed, icon: 'none' }) }
    }})
  }
})
