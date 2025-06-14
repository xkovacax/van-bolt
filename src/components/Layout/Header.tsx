import React, { useState } from 'react';
import { Search, Menu, X, User, LogOut, PlusCircle, Heart, Calendar, Car } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onAuthClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onAuthClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout, isAuthenticated, loading } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  // Don't render user-dependent content while loading
  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MC</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">MyCamper</span>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hľadať campervany podľa lokality..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </form>
            </div>

            {/* Loading spinner */}
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MC</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">MyCamper</span>
            </div>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hľadať campervany podľa lokality..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Show "Prenajať Campervany" for unauthenticated users OR customers (not owners) */}
            {(!isAuthenticated || (user && user.role === 'customer')) && (
              <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-lg">
                <Car className="h-4 w-4" />
                <span>Prenajať Campervany</span>
              </button>
            )}

            {/* Show "Pridať Campervan" for unauthenticated users OR owners */}
            {(!isAuthenticated || (user && user.role === 'owner')) && (
              <button className="flex items-center space-x-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors rounded-lg">
                <PlusCircle className="h-4 w-4" />
                <span>Pridať Campervan</span>
              </button>
            )}

            {isAuthenticated && user ? (
              <>
                <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  <Heart className="h-4 w-4" />
                  <span>Obľúbené</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  <Calendar className="h-4 w-4" />
                  <span>Rezervácie</span>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=150&background=059669&color=fff&bold=true`;
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">{user.name || 'User'}</span>
                  </button>
                  
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email || ''}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user.role === 'owner' ? 'Majiteľ' : 'Zákazník'}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Odhlásiť sa</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Prihlásiť sa
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-3">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hľadať campervany..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </form>

              {/* Mobile role-based buttons */}
              {isAuthenticated && user ? (
                <>
                  {/* Show "Prenajať Campervany" only for customers (not owners) */}
                  {user.role === 'customer' && (
                    <button className="flex items-center space-x-2 w-full px-3 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-lg">
                      <Car className="h-4 w-4" />
                      <span>Prenajať Campervany</span>
                    </button>
                  )}

                  {/* Show "Pridať Campervan" only for owners */}
                  {user.role === 'owner' && (
                    <button className="flex items-center space-x-2 w-full px-3 py-3 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors rounded-lg">
                      <PlusCircle className="h-4 w-4" />
                      <span>Pridať Campervan</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-3 px-3 py-2">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=150&background=059669&color=fff&bold=true`;
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email || ''}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role === 'owner' ? 'Majiteľ' : 'Zákazník'}
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    <Heart className="h-4 w-4" />
                    <span>Obľúbené</span>
                  </button>
                  <button className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                    <Calendar className="h-4 w-4" />
                    <span>Rezervácie</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Odhlásiť sa</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Show both buttons for non-authenticated users on mobile */}
                  <button className="flex items-center space-x-2 w-full px-3 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors rounded-lg">
                    <Car className="h-4 w-4" />
                    <span>Prenajať Campervany</span>
                  </button>

                  <button className="flex items-center space-x-2 w-full px-3 py-3 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors rounded-lg">
                    <PlusCircle className="h-4 w-4" />
                    <span>Pridať Campervan</span>
                  </button>
                  
                  <button
                    onClick={onAuthClick}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Prihlásiť sa
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;