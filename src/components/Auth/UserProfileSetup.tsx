import React, { useState } from 'react';
import { X, User as UserIcon, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfileSetupProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  } | null;
}

const UserProfileSetup: React.FC<UserProfileSetupProps> = ({ isOpen, onClose, userData }) => {
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    role: 'customer' as 'owner' | 'customer'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createUserProfile } = useAuth();

  // Enhanced logging
  React.useEffect(() => {
    console.log('🎯 UserProfileSetup render:', {
      isOpen,
      hasUserData: !!userData,
      userName: userData?.name,
      userEmail: userData?.email
    });
  }, [isOpen, userData]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Chcem *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
            >
              <option value="customer">Prenajímať campervany</option>
              <option value="owner">Pridať svoj campervan</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileSetup;