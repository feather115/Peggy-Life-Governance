export const normalizeRecipe = (recipe) => ({
  ...recipe,
  category: Array.isArray(recipe.category) ? recipe.category : [],
  yield_info: recipe.yield_info || [],
  parameters: recipe.parameters || {}
})

export const getAvailableCategories = (recipes) => {
  const allTags = recipes.flatMap(recipe => Array.isArray(recipe.category) ? recipe.category : [])
  const cleanTags = allTags.map(tag => tag ? tag.trim() : '').filter(Boolean)
  return [...new Set(cleanTags)]
}

export const filterRecipes = (recipes, selectedCategory, searchQuery) => {
  const query = searchQuery.trim().toLowerCase()

  return recipes.filter(recipe => {
    const matchCategory = selectedCategory === '全部' || recipe.category.includes(selectedCategory)
    const matchSearch = !query ||
      recipe.title.toLowerCase().includes(query) ||
      recipe.category.some(tag => tag.toLowerCase().includes(query))

    return matchCategory && matchSearch
  })
}

export const parseYieldInfo = (yieldInfo) => {
  if (!yieldInfo) return []
  return Array.isArray(yieldInfo) ? yieldInfo : []
}

export const parseIngredients = (ingredients) => {
  if (!ingredients) return []
  if (Array.isArray(ingredients)) return ingredients

  return Object.entries(ingredients).map(([name, amount], index) => ({
    name,
    amount,
    is_base: index === 0,
    brand: '',
    type: ''
  }))
}

export const groupItemsByType = (items) => {
  if (items.length === 0) return []

  const hasTypeInfo = items.some(item => item.type && item.type.trim() !== '')
  if (!hasTypeInfo) return [{ typeName: 'DEFAULT', items }]

  const groupsMap = {}
  items.forEach(item => {
    const currentType = item.type && item.type.trim() ? item.type.trim() : '其他'
    if (!groupsMap[currentType]) groupsMap[currentType] = []
    groupsMap[currentType].push(item)
  })

  return Object.entries(groupsMap).map(([typeName, groupedItems]) => ({
    typeName,
    items: groupedItems
  }))
}

export const parseSteps = (steps) => {
  if (!steps) return []

  if (Array.isArray(steps) && typeof steps[0] === 'object') {
    return steps.map(step => ({
      text: step.text || '',
      type: step.type || '',
      sort: Number(step.sort) || 1
    }))
  }

  if (Array.isArray(steps) && typeof steps[0] === 'string') {
    return steps.map(step => ({ text: step, type: '', sort: 1 }))
  }

  if (typeof steps === 'string') {
    return steps
      .split('\n')
      .filter(step => step.trim())
      .map(step => ({ text: step, type: '', sort: 1 }))
  }

  return []
}

export const groupStepsByType = (steps) => {
  if (steps.length === 0) return []

  const hasTypeInfo = steps.some(step => step.type && step.type.trim() !== '')
  if (!hasTypeInfo) return [{ typeName: 'DEFAULT', items: steps }]

  const groupsMap = {}
  steps.forEach(step => {
    const currentType = step.type && step.type.trim() ? step.type.trim() : '其他'
    if (!groupsMap[currentType]) groupsMap[currentType] = []
    groupsMap[currentType].push(step)
  })

  return Object.entries(groupsMap)
    .map(([typeName, items]) => ({
      typeName,
      items,
      order: items[0]?.sort || 1
    }))
    .sort((a, b) => a.order - b.order)
}

export const parseNotes = (notes) => {
  if (!notes) return []
  if (Array.isArray(notes)) return notes.filter(note => note.trim())
  return typeof notes === 'string' ? [notes] : []
}

export const formatDate = (dateStr) => {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
