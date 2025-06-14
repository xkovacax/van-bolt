import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { 
  openAuthModal, 
  closeAuthModal, 
  openCamperModal, 
  closeCamperModal, 
  openFilterSidebar, 
  closeFilterSidebar 
} from '../store/slices/uiSlice';
import { setSearchQuery, setFilters, toggleFavorite } from '../store/slices/campersSlice';
import { completeProfileSetup } from '../store/slices/authSlice';
import Header from './Layout/Header';
import Footer from './Layout/Footer';
import Hero from './Home/Hero';
import CamperGrid from './Campers/CamperGrid';
import CamperModal from './Campers/CamperModal';
import FilterSidebar from './Filters/FilterSidebar';
import AuthModal from './Auth/AuthModal';
import ProfileSetupModal from './Auth/ProfileSetupModal';
import { SlidersHorizontal } from 'lucide-react';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // 🎯 REDUX: All state from store
  const {
    user,
    loading,
    needsProfileSetup,
    pendingUserData,
    isAuthenticated
  } = useAppSelector((state) => state.auth);
  
  const {
    isAuthModalOpen,
    isCamperModalOpen,
    isFilterSidebarOpen,
    authModalDefaultRole,
    authModalDefaultMode,
    selectedCamperId
  } = useAppSelector((state) => state.ui);
  
  const {
    filteredCampers,
    searchQuery,
    favorites,
    filters,
    allCampers
  } = useAppSelector((state) => state.campers);

  // 🎯 CRITICAL: Modal visibility check ONLY when NOT loading
  const shouldShowProfileModal = !loading && needsProfileSetup && pendingUserData;

  console.log('🎯 AppContent: Redux state check:', {
    loading,
    needsProfileSetup,
    hasPendingData: !!pendingUserData,
    shouldShowModal: shouldShowProfileModal,
    source: 'REDUX_STORE'
  });

  // Get selected camper
  const selectedCamper = selectedCamperId 
    ? allCampers.find(c => c.id === selectedCamperId) || null 
    : null;

  // 🎯 REDUX: Event handlers
  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  const handleCamperClick = (camper: any) => {
    dispatch(openCamperModal(camper.id));
  };

  const handleFavorite = (camperId: string) => {
    dispatch(toggleFavorite(camperId));
  };

  const handleFiltersChange = (newFilters: any) => {
    dispatch(setFilters(newFilters));
  };

  const handleBooking = (camper: any) => {
    alert(`Žiadosť o rezerváciu bola odoslaná pre ${camper.title}! Čoskoro dostanete potvrdzujúci e-mail.`);
  };

  const handleAuthClick = (defaultRole: 'owner' | 'customer' = 'customer', defaultMode: 'login' | 'register' = 'login') => {
    dispatch(openAuthModal({ role: defaultRole, mode: defaultMode }));
  };

  const handleAddCampervanClick = () => {
    if (!isAuthenticated) {
      console.log('🚗 Opening REGISTRATION modal for Add Campervan');
      dispatch(openAuthModal({ role: 'owner', mode: 'register' }));
    } else {
      console.log('🚗 Add campervan functionality for authenticated user');
    }
  };

  const handleProfileSetupSuccess = (newUser: any) => {
    console.log('🎉 AppContent: Profile setup completed successfully:', newUser);
    dispatch(completeProfileSetup({ name: newUser.name, role: newUser.role }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onSearch={handleSearch} 
        onAuthClick={() => handleAuthClick('customer', 'login')}
        onAddCampervanClick={handleAddCampervanClick}
      />
      
      <Hero 
        onSearch={handleSearch} 
        onAddCampervanClick={handleAddCampervanClick}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery ? `Výsledky pre "${searchQuery}"` : 'Odporúčané Campervany'}
            </h2>
            <p className="text-gray-600 mt-1">
              {filteredCampers.length} {filteredCampers.length === 1 ? 'campervan' : 'campervanoch'} k dispozícii
            </p>
          </div>
          
          <button
            onClick={() => dispatch(openFilterSidebar())}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtre</span>
          </button>
        </div>
        
        <div className="flex gap-8">
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar
              isOpen={true}
              onClose={() => {}}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
          
          <div className="flex-1">
            <CamperGrid
              campers={filteredCampers}
              onCamperClick={handleCamperClick}
              onFavorite={handleFavorite}
              favorites={favorites}
            />
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* 🎯 REDUX: All modals controlled by Redux state */}
      <CamperModal
        camper={selectedCamper}
        isOpen={isCamperModalOpen}
        onClose={() => dispatch(closeCamperModal())}
        onBook={handleBooking}
      />
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => dispatch(closeAuthModal())}
        defaultRole={authModalDefaultRole}
        defaultMode={authModalDefaultMode}
      />

      {/* 🎯 CRITICAL: Modal shows ONLY when Redux state allows */}
      {shouldShowProfileModal && (
        <ProfileSetupModal
          isOpen={true}
          onClose={() => {}} // Don't allow closing without completion
          onSuccess={handleProfileSetupSuccess}
          userData={pendingUserData}
          defaultRole={pendingUserData?.preferredRole || 'customer'}
        />
      )}
      
      <FilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => dispatch(closeFilterSidebar())}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Redux Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-[60]">
          <div className="font-bold mb-2 text-yellow-400">🔍 Redux Debug</div>
          <div className="space-y-1">
            <div>Loading: {loading ? '⏳ YES' : '✅ NO'}</div>
            <div>Profile Setup: {needsProfileSetup ? '✅ YES' : '❌ NO'}</div>
            <div>Pending Data: {pendingUserData ? '✅ YES' : '❌ NO'}</div>
            <div className={`font-bold ${shouldShowProfileModal ? 'text-green-400' : 'text-red-400'}`}>
              Modal Show: {shouldShowProfileModal ? '✅ YES' : '❌ NO'}
            </div>
            <div className="text-xs text-gray-400">
              Source: Redux Store
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppContent;