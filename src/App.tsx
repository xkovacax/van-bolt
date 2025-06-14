import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Hero from './components/Home/Hero';
import CamperGrid from './components/Campers/CamperGrid';
import CamperModal from './components/Campers/CamperModal';
import FilterSidebar from './components/Filters/FilterSidebar';
import AuthModal from './components/Auth/AuthModal';
import AuthCallback from './components/Auth/AuthCallback';
import UserProfileSetup from './components/Auth/UserProfileSetup';
import { mockCampers } from './data/mockData';
import { Camper } from './types';
import { SlidersHorizontal } from 'lucide-react';

interface FilterOptions {
  priceRange: [number, number];
  capacity: number;
  type: string;
  features: string[];
}

const AppContent: React.FC = () => {
  const [campers, setCampers] = useState<Camper[]>(mockCampers);
  const [selectedCamper, setSelectedCamper] = useState<Camper | null>(null);
  const [isCamperModalOpen, setIsCamperModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 500],
    capacity: 0,
    type: '',
    features: []
  });

  const { needsProfileSetup, pendingUserData, loading } = useAuth();

  // Enhanced logging for modal visibility
  React.useEffect(() => {
    console.log('🎯 APP COMPONENT STATE:', {
      needsProfileSetup,
      hasPendingUserData: !!pendingUserData,
      pendingUserName: pendingUserData?.name,
      loading,
      modalShouldShow: needsProfileSetup && pendingUserData && !loading
    });
  }, [needsProfileSetup, pendingUserData, loading]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = mockCampers.filter(camper =>
        camper.location.toLowerCase().includes(query.toLowerCase()) ||
        camper.title.toLowerCase().includes(query.toLowerCase()) ||
        camper.description.toLowerCase().includes(query.toLowerCase())
      );
      setCampers(filtered);
    } else {
      setCampers(mockCampers);
    }
  };

  const handleCamperClick = (camper: Camper) => {
    setSelectedCamper(camper);
    setIsCamperModalOpen(true);
  };

  const handleFavorite = (camperId: string) => {
    setFavorites(prev => 
      prev.includes(camperId) 
        ? prev.filter(id => id !== camperId)
        : [...prev, camperId]
    );
  };

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    
    let filtered = mockCampers;
    
    // Apply search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(camper =>
        camper.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camper.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply price range
    filtered = filtered.filter(camper => 
      camper.price >= newFilters.priceRange[0] && camper.price <= newFilters.priceRange[1]
    );
    
    // Apply capacity
    if (newFilters.capacity > 0) {
      filtered = filtered.filter(camper => camper.capacity >= newFilters.capacity);
    }
    
    // Apply type
    if (newFilters.type) {
      filtered = filtered.filter(camper => camper.type === newFilters.type);
    }
    
    // Apply features
    if (newFilters.features.length > 0) {
      filtered = filtered.filter(camper => 
        newFilters.features.every(feature => 
          camper.features[feature as keyof typeof camper.features]
        )
      );
    }
    
    setCampers(filtered);
  };

  const handleBooking = (camper: Camper) => {
    alert(`Žiadosť o rezerváciu bola odoslaná pre ${camper.title}! Čoskoro dostanete potvrdzujúci e-mail.`);
  };

  const handleProfileSetupClose = () => {
    // Don't allow closing without completing setup
    console.log('⚠️ Profile setup cannot be closed without completion');
  };

  // Show modal conditions
  const shouldShowProfileModal = needsProfileSetup && pendingUserData && !loading;
  
  console.log('🎯 MODAL RENDER CHECK:', {
    shouldShowProfileModal,
    needsProfileSetup,
    hasPendingUserData: !!pendingUserData,
    loading
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} onAuthClick={() => setIsAuthModalOpen(true)} />
      
      {/* Hero Section */}
      <Hero onSearch={handleSearch} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery ? `Výsledky pre "${searchQuery}"` : 'Odporúčané Campervany'}
            </h2>
            <p className="text-gray-600 mt-1">
              {campers.length} {campers.length === 1 ? 'campervan' : 'campervanoch'} k dispozícii
            </p>
          </div>
          
          <button
            onClick={() => setIsFilterSidebarOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtre</span>
          </button>
        </div>
        
        <div className="flex gap-8">
          {/* Desktop Filters */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar
              isOpen={true}
              onClose={() => {}}
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
          
          {/* Camper Grid */}
          <div className="flex-1">
            <CamperGrid
              campers={campers}
              onCamperClick={handleCamperClick}
              onFavorite={handleFavorite}
              favorites={favorites}
            />
          </div>
        </div>
      </div>
      
      <Footer />
      
      {/* Modals */}
      <CamperModal
        camper={selectedCamper}
        isOpen={isCamperModalOpen}
        onClose={() => setIsCamperModalOpen(false)}
        onBook={handleBooking}
      />
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* User Profile Setup Modal - ENHANCED VISIBILITY */}
      {shouldShowProfileModal && (
        <>
          {console.log('🚨 RENDERING PROFILE SETUP MODAL!')}
          <UserProfileSetup
            isOpen={true}
            onClose={handleProfileSetupClose}
            userData={pendingUserData}
          />
        </>
      )}
      
      {/* Mobile Filter Sidebar */}
      <FilterSidebar
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Enhanced Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm z-[60]">
          <div className="font-bold mb-2 text-yellow-400">🔍 Auth Debug Panel</div>
          <div className="space-y-1">
            <div>Loading: {loading ? '⏳ YES' : '✅ NO'}</div>
            <div>Profile Setup: {needsProfileSetup ? '✅ YES' : '❌ NO'}</div>
            <div>Pending Data: {pendingUserData ? '✅ YES' : '❌ NO'}</div>
            <div>Pending Name: {pendingUserData?.name || 'N/A'}</div>
            <div>Pending Email: {pendingUserData?.email || 'N/A'}</div>
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className={`font-bold ${shouldShowProfileModal ? 'text-green-400' : 'text-red-400'}`}>
                Modal Should Show: {shouldShowProfileModal ? '✅ YES' : '❌ NO'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Force Modal Visibility Test - Development Only */}
      {process.env.NODE_ENV === 'development' && shouldShowProfileModal && (
        <div className="fixed top-4 left-4 bg-green-600 text-white p-2 rounded text-xs z-[70]">
          🚨 MODAL IS ACTIVE!
        </div>
      )}
    </div>
  );
};

function App() {
  // Check if we're on the auth callback route
  if (window.location.pathname === '/auth/callback') {
    return (
      <AuthProvider>
        <AuthCallback />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;