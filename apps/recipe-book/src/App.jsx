// App 外殼：依目前 view 顯示食譜清單或單一食譜詳情。
import React from 'react';
import RecipeCatalog from './components/RecipeCatalog.jsx';
import RecipeDetail from './components/RecipeDetail.jsx';

export default function App({ recipes }) {
  return (
    <div className="mobile-cooking-app-container">
      {recipes.currentView === 'home' && (
        <RecipeCatalog
          recipes={recipes.recipes}
          searchQuery={recipes.searchQuery}
          onSearchQueryChange={recipes.setSearchQuery}
          selectedCategory={recipes.selectedCategory}
          onSelectedCategoryChange={recipes.setSelectedCategory}
          availableCategories={recipes.availableCategories}
          filteredRecipes={recipes.filteredRecipes}
          onOpenDetail={recipes.openRecipeDetail}
        />
      )}

      {recipes.currentView === 'detail' && recipes.selectedRecipe && (
        <RecipeDetail recipe={recipes.selectedRecipe} />
      )}
    </div>
  );
}
