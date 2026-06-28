// App shell: manages the 520px centered container, fetches recipes using useRecipes hook, and routes to catalog or details.
import React, { useState } from 'react';
import { useRecipes } from './useRecipes.js';
import CookCalendar from './components/CookCalendar.jsx';
import RecipeCatalog from './components/RecipeCatalog.jsx';
import RecipeDetail from './components/RecipeDetail.jsx';
import TabBar from './components/TabBar.jsx';

function Centered({ children, color = '#6E8B7C' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color, fontWeight: 700 }}>
      {children}
    </div>
  );
}

export default function App({ session, onSignOut }) {
  const recipes = useRecipes(session.user.id);
  const [tab, setTab] = useState('recipes');

  if (!recipes.loaded) return <Centered>載入中…</Centered>;
  if (recipes.loadError) return <Centered color="#B91C1C">載入失敗：{recipes.loadError}</Centered>;

  // Robust back navigation that handles direct URL visits gracefully
  const handleBack = () => {
    if (window.history.state && window.history.state.view === 'detail') {
      window.history.back();
    } else {
      // Fallback if detail page was opened directly via URL
      window.history.pushState({ view: 'home' }, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const changeTab = (nextTab) => {
    setTab(nextTab);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: 520,
      height: '100vh',
      maxHeight: '100dvh',
      margin: '0 auto',
      background: '#FFF5EE',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 60px -20px rgba(0,0,0,.12)',
      overflow: 'hidden',
    }}>
      <div className="ps" style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
        {tab === 'recipes' && recipes.currentView === 'home' && (
          <RecipeCatalog
            recipes={recipes.recipes}
            searchQuery={recipes.searchQuery}
            onSearchQueryChange={recipes.setSearchQuery}
            selectedCategory={recipes.selectedCategory}
            onSelectedCategoryChange={recipes.setSelectedCategory}
            availableCategories={recipes.availableCategories}
            filteredRecipes={recipes.filteredRecipes}
            onOpenDetail={recipes.openRecipeDetail}
            onSignOut={onSignOut}
          />
        )}

        {tab === 'recipes' && recipes.currentView === 'detail' && recipes.selectedRecipe && (
          <RecipeDetail
            recipe={recipes.selectedRecipe}
            onBack={handleBack}
          />
        )}

        {tab === 'calendar' && (
          <CookCalendar
            recipes={recipes.recipes}
            cookRecords={recipes.cookRecords}
            cookRecordError={recipes.cookRecordError}
            onAddRecord={recipes.addCookRecord}
            onRemoveRecord={recipes.removeCookRecord}
          />
        )}
      </div>

      <TabBar tab={tab} onTab={changeTab} />
    </div>
  );
}
