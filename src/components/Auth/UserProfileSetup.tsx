import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Camera, Car, PlusCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfileSetupProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    preferredRole?: 'owner' | 'customer';
  } | null;
  defaultRole?: 'owner' | 'customer';
}

const UserProfileSetup: React.FC<UserProfileSetupProps> = ({ 
  isOpen, 
  onClose, 
  userData, 
  defaultRole = 'customer' 
}) => {
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    role: userData?.preferredRole || defaultRole
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createUserProfile } = useAuth();

  // Update role when userData or defaultRole changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      name: userData?.name || '',
      role: userData?.preferredRole || defaultRole
    }));
  }, [userData, defaultRole]);

  // Disable/enable body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Disable scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scrolling
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to ensure scrolling is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Enhanced logging
  React.useEffect(() => {
    console.log('🎯 UserProfileSetup render:', {
      isOpen,
      hasUserData: !!userData,
      userName: userData?.name,
      userEmail: userData?.email,
      preferredRole: userData?.preferredRole,
      defaultRole,
      currentRole: formData.role
    });
  }, [isOpen, userData, defaultRole, formData.role]);

  // Don't render if not open or no userData
  if (!isOpen || !userData) {
    console.log('❌ UserProfileSetup not rendering:', { isOpen, hasUserData: !!userData });
    return null;
  }

  console.log('✅ UserProfileSetup IS RENDERING!');

  const generateAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    // Generate a consistent color based on name
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const colorIndex = name.length % colors.length;
    
    return {
      initials,
      colorClass: colors[colorIndex]
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!formData.name.trim()) {
      setError('Meno je povinné');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔨 Submitting profile setup:', formData);
      
      const { error: profileError } = await createUserProfile({
        name: formData.name.trim(),
        role: formData.role
      });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        setError('Chyba pri vytváraní profilu. Skúste to znovu.');
        return;
      }

      console.log('✅ Profile created successfully');
      // Don't call onClose here - let the auth context handle the state change
    } catch (error) {
      console.error('❌ Profile setup error:', error);
      setError('Nastala neočakávaná chyba. Skúste to znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (role: 'owner' | 'customer') => {
    setFormData({
      ...formData,
      role
    });
  };

  const avatarPreview = generateAvatar(formData.name || 'User');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
        {/* Header with enhanced visibility */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-xl">MC</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dokončite svoj profil
          </h2>
          <p className="text-gray-600">
            Povedzte nám niečo o sebe
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Preview */}
          <div className="text-center">
            <div className="relative inline-block">
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover mx-auto shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white font-bold text-xl shadow-lg ${avatarPreview.colorClass}`}>
                  {avatarPreview.initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                <Camera className="h-3 w-3 text-white" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Automaticky generovaný avatar
            </p>
          </div>

          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Celé meno *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                placeholder="Zadajte svoje celé meno"
              />
            </div>
          </div>

          {/* Role Selection with Radio Button Design */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chcem *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Rent Campers Option */}
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="customer"
                  checked={formData.role === 'customer'}
                  onChange={() => handleRoleChange('customer')}
                  className="sr-only"
                />
                <div className={`
                  flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
                  ${formData.role === 'customer' 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}>
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors
                    ${formData.role === 'customer' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <Car className="h-6 w-6" />
                  </div>
                  <span className={`
                    text-sm font-medium text-center leading-tight
                    ${formData.role === 'customer' ? 'text-emerald-700' : 'text-gray-700'}
                  `}>
                    Prenajať<br />Karavan
                  </span>
                  {formData.role === 'customer' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </label>

              {/* Add Camper Option */}
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="owner"
                  checked={formData.role === 'owner'}
                  onChange={() => handleRoleChange('owner')}
                  className="sr-only"
                />
                <div className={`
                  flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
                  ${formData.role === 'owner' 
                    ? 'border-orange-500 bg-orange-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}>
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors
                    ${formData.role === 'owner' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <PlusCircle className="h-6 w-6" />
                  </div>
                  <span className={`
                    text-sm font-medium text-center leading-tight
                    ${formData.role === 'owner' ? 'text-orange-700' : 'text-gray-700'}
                  `}>
                    Pridať<br />Karavan
                  </span>
                  {formData.role === 'owner' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {formData.role === 'customer' 
                ? 'Hľadáte karavan na prenájom pre vašu dovolenku' 
                : 'Chcete zarábať prenajímaním svojho karavanu'
              }
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
              ${formData.role === 'customer' 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500' 
                : 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500'
              }
            `}
          >
            {isLoading ? 'Vytváram profil...' : 'Dokončiť registráciu'}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Dokončením registrácie súhlasíte s našimi{' '}
          <a href="#" className="text-emerald-600 hover:text-emerald-700">Podmienkami používania</a>
          {' '}a{' '}
          <a href="#" className="text-emerald-600 hover:text-emerald-700">Zásadami ochrany súkromia</a>
        </div>

        {/* Development debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <div className="font-bold">Debug Info:</div>
            <div>User ID: {userData.id}</div>
            <div>Email: {userData.email}</div>
            <div>Name: {userData.name}</div>
            <div>Avatar: {userData.avatar ? 'Yes' : 'No'}</div>
            <div>Preferred Role: {userData.preferredRole || 'None'}</div>
            <div>Default Role: {defaultRole}</div>
            <div>Selected Role: {formData.role}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileSetup;