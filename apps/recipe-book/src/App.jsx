// App shell: manages the 520px centered container, fetches recipes using useRecipes hook, and routes to catalog or details.
import React, { useState } from 'react';
import { useRecipes } from './useRecipes.js';
import CookCalendar from './components/CookCalendar.jsx';
import RecipeCatalog from './components/RecipeCatalog.jsx';
import RecipeDetail from './components/RecipeDetail.jsx';
import RecipeForm from './components/RecipeForm.jsx';
import SettingsTab from './components/SettingsTab.jsx';
import TabBar from './components/TabBar.jsx';

function Centered({ children, color = '#6E8B7C' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, color, fontWeight: 700 }}>
      {children}
    </div>
  );
}

export default function App({ session, onSignOut, onExitGuest }) {
  const userId = session?.user?.id || null;
  const recipes = useRecipes(userId);
  const [tab, setTab] = useState('recipes');
  const [backTab, setBackTab] = useState('recipes');
  // editing: null = not editing; { mode: 'create' } | { mode: 'edit', recipe }
  const [editing, setEditing] = useState(null);

  if (!recipes.loaded) return <Centered>載入中…</Centered>;
  if (recipes.loadError) return <Centered color="#B91C1C">載入失敗：{recipes.loadError}</Centered>;

  const handleBack = () => {
    if (backTab === 'calendar') {
      setTab('calendar');
      setBackTab('recipes');
      window.history.pushState({ view: 'home' }, '', '/');
      window.dispatchEvent(new Event('popstate'));
    } else {
      if (window.history.state && window.history.state.view === 'detail') {
        window.history.back();
      } else {
        window.history.pushState({ view: 'home' }, '', '/');
        window.dispatchEvent(new Event('popstate'));
      }
    }
  };

  const handleOpenRecipe = (recipe) => {
    setTab('recipes');
    setBackTab('calendar');
    recipes.openRecipeDetail(recipe);
  };

  const handleSaveRecipe = async (payload, existingId) => {
    const saved = await recipes.saveRecipe(payload, existingId);
    setEditing(null);
    if (saved && !existingId) recipes.openRecipeDetail(saved);
  };

  const handleDeleteRecipe = async (recipeId) => {
    await recipes.deleteRecipeById(recipeId);
    setEditing(null);
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
        {editing ? (
          <RecipeForm
            recipe={editing.mode === 'edit' ? editing.recipe : null}
            onSave={handleSaveRecipe}
            onCancel={() => setEditing(null)}
            onDelete={editing.mode === 'edit' ? handleDeleteRecipe : null}
          />
        ) : (
          <>
            {tab === 'recipes' && recipes.currentView === 'home' && (
              <RecipeCatalog
                userId={userId}
                isGuest={recipes.isGuest}
                recipes={recipes.recipes}
                searchQuery={recipes.searchQuery}
                onSearchQueryChange={recipes.setSearchQuery}
                selectedCategory={recipes.selectedCategory}
                onSelectedCategoryChange={recipes.setSelectedCategory}
                availableCategories={recipes.availableCategories}
                filteredRecipes={recipes.filteredRecipes}
                onOpenDetail={recipes.openRecipeDetail}
                onSignOut={recipes.isGuest ? onExitGuest : onSignOut}
                signOutLabel={recipes.isGuest ? '登入' : '登出'}
                onCreate={recipes.isGuest ? null : () => setEditing({ mode: 'create' })}
                ownershipFilter={recipes.ownershipFilter}
                onToggleOwnership={recipes.toggleOwnership}
                likeCounts={recipes.likeCounts}
                myLikedSet={recipes.myLikedSet}
              />
            )}

            {tab === 'recipes' && recipes.currentView === 'detail' && recipes.selectedRecipe && (
              <RecipeDetail
                recipe={recipes.selectedRecipe}
                currentUserId={userId}
                isGuest={recipes.isGuest}
                onBack={handleBack}
                onEdit={() => setEditing({ mode: 'edit', recipe: recipes.selectedRecipe })}
                likeCount={recipes.likeCounts.get(recipes.selectedRecipe.id) || 0}
                isLiked={recipes.myLikedSet.has(recipes.selectedRecipe.id)}
                onToggleLike={recipes.toggleLike}
                likerNames={recipes.likerNamesByRecipe.get(recipes.selectedRecipe.id) || []}
              />
            )}

            {tab === 'calendar' && !recipes.isGuest && (
              <CookCalendar
                recipes={recipes.recipes}
                cookRecords={recipes.cookRecords}
                cookRecordError={recipes.cookRecordError}
                onAddRecord={recipes.addCookRecord}
                onRemoveRecord={recipes.removeCookRecord}
                onUpdateNotes={recipes.updateCookRecordNotes}
                onOpenRecipe={handleOpenRecipe}
              />
            )}

            {tab === 'calendar' && recipes.isGuest && (
              <Centered color="#8E7568">登入後才能使用料理行事曆</Centered>
            )}

            {tab === 'settings' && !recipes.isGuest && (
              <SettingsTab
                session={session}
                myDisplayName={recipes.myDisplayName}
                onSetDisplayName={recipes.setMyDisplayName}
                onSignOut={onSignOut}
              />
            )}
          </>
        )}
      </div>

      {!editing && (
        <TabBar tab={tab} onTab={setTab} hideTabs={recipes.isGuest ? ['calendar', 'settings'] : []} />
      )}
    </div>
  );
}
