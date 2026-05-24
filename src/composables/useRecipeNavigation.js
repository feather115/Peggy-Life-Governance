import { onBeforeUnmount, onMounted, ref } from 'vue'

export const useRecipeNavigation = (recipes) => {
  const currentView = ref('home')
  const selectedRecipe = ref(null)
  const hasInAppDetailHistory = ref(false)

  const getRecipeIdFromUrl = () => {
    const url = new URL(window.location.href)
    return url.searchParams.get('recipe')
  }

  const getRecipeDetailUrl = (recipe) => {
    const url = new URL(window.location.href)
    url.searchParams.set('recipe', recipe.id)
    return url.toString()
  }

  const clearRecipeDetailUrl = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('recipe')
    return url.toString()
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const showRecipeDetail = (recipe) => {
    selectedRecipe.value = recipe
    currentView.value = 'detail'
    scrollToTop()
  }

  const openRecipeDetail = (recipe) => {
    showRecipeDetail(recipe)
    hasInAppDetailHistory.value = true
    window.history.pushState({ view: 'detail', recipeId: recipe.id }, '', getRecipeDetailUrl(recipe))
  }

  const showRecipeWall = () => {
    currentView.value = 'home'
    selectedRecipe.value = null
    hasInAppDetailHistory.value = false
  }

  const replaceWithRecipeWallUrl = () => {
    window.history.replaceState({ view: 'home' }, '', clearRecipeDetailUrl())
    showRecipeWall()
  }

  const syncViewWithUrl = () => {
    const recipeId = getRecipeIdFromUrl()

    if (!recipeId) {
      showRecipeWall()
      return
    }

    const recipe = recipes.value.find(item => String(item.id) === String(recipeId))

    if (recipe) {
      selectedRecipe.value = recipe
      currentView.value = 'detail'
      hasInAppDetailHistory.value = window.history.state?.view === 'detail'
      scrollToTop()
      return
    }

    if (recipes.value.length > 0) {
      replaceWithRecipeWallUrl()
    }
  }

  onMounted(() => {
    window.addEventListener('popstate', syncViewWithUrl)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('popstate', syncViewWithUrl)
  })

  return {
    currentView,
    selectedRecipe,
    openRecipeDetail,
    syncViewWithUrl
  }
}
