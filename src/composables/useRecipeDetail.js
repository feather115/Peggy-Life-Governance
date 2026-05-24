import { computed, ref } from 'vue'
import {
  formatDate,
  groupItemsByType,
  groupStepsByType,
  parseIngredients,
  parseNotes,
  parseSteps,
  parseYieldInfo
} from '../utils/recipeData'

export const useRecipeDetail = (recipeRef) => {
  const currentWeight = ref(null)
  const completedItems = ref({})
  let pressTimer = null

  const hasParameters = computed(() => {
    const params = recipeRef.value.parameters
    return params && typeof params === 'object' && Object.keys(params).length > 0
  })

  const parsedYieldInfo = computed(() => parseYieldInfo(recipeRef.value.yield_info))
  const parsedIngredients = computed(() => parseIngredients(recipeRef.value.ingredients))
  const groupedIngredients = computed(() => groupItemsByType(parsedIngredients.value))
  const parsedSteps = computed(() => parseSteps(recipeRef.value.steps))
  const sortedGroupedSteps = computed(() => groupStepsByType(parsedSteps.value))
  const formattedNotes = computed(() => parseNotes(recipeRef.value.notes))
  const baseIng = computed(() => parsedIngredients.value.find(ing => ing.is_base) || parsedIngredients.value[0])

  const scaleRatio = computed(() => {
    if (!currentWeight.value || currentWeight.value <= 0 || !baseIng.value) return 1

    const originalNumber = parseFloat(baseIng.value.amount)
    return originalNumber ? currentWeight.value / originalNumber : 1
  })

  const isScaled = computed(() => currentWeight.value && currentWeight.value > 0)

  const getScaledAmount = (ingredient) => {
    if (baseIng.value && ingredient.name === baseIng.value.name && currentWeight.value) {
      return `${currentWeight.value} g`
    }

    if (scaleRatio.value === 1) return ingredient.amount

    const originalNumber = parseFloat(ingredient.amount)
    if (isNaN(originalNumber)) return ingredient.amount

    return `${(originalNumber * scaleRatio.value).toFixed(1)} ${ingredient.amount.includes('ml') ? 'ml' : 'g'}`
  }

  const startLongPress = (id) => {
    if (pressTimer) clearTimeout(pressTimer)
    pressTimer = setTimeout(() => {
      completedItems.value[id] = !completedItems.value[id]
    }, 700)
  }

  const endLongPress = () => {
    if (pressTimer) clearTimeout(pressTimer)
  }

  return {
    currentWeight,
    completedItems,
    hasParameters,
    parsedYieldInfo,
    groupedIngredients,
    sortedGroupedSteps,
    baseIng,
    scaleRatio,
    isScaled,
    getScaledAmount,
    formattedNotes,
    formatDate,
    startLongPress,
    endLongPress
  }
}
