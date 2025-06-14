import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Mail, Lock, User as UserIcon, Car, PlusCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'owner' | 'customer';
  defaultMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultRole = 'customer',
  defaultMode = 'login'
}) => {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: defaultRole
  });
  const [error, setError] = useState<string | null>(null);
  const { login, register, loginWithGoogle, loading } = useAuth();

  // Update role when defaultRole prop changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      role: defaultRole
    }));
  }, [defaultRole]);

  // Update mode when defaultMode prop changes
  useEffect(() => {
    setIsLogin(defaultMode === 'login');
  }, [defaultMode]);

  // Disable/enable body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate required fields
    if (!isLogin) {
      if (!formData.name.trim()) {
        setError('Meno je povinné');
        return;
      }
      if (!formData.email.trim()) {
        setError('E-mail je povinný');
        return;
      }
      if (!formData.password.trim()) {
        setError('Heslo je povinné');
        return;
      }
      if (formData.password.length < 6) {
        setError('Heslo musí mať aspoň 6 znakov');
        return;
      }
    } else {
      if (!formData.email.trim()) {
        setError('E-mail je povinný');
        return;
      }
      if (!formData.password.trim()) {
        setError('Heslo je povinné');
        return;
      }
    }
    
    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        console.log('📝 AUTH MODAL: Registering with role:', formData.role);
        result = await register(formData.name, formData.email, formData.password, formData.role);
      }
      
      if (result.error) {
        setError(result.error.message);
      } else {
        onClose();
        setFormData({ name: '', email: '', password: '', role: defaultRole });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    console.log('🔗 AUTH MODAL: Google OAuth login');
    
    const { error } = await loginWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (role: 'owner' | 'customer') => {
    console.log('🎯 AUTH MODAL: Role changed to:', role);
    setFormData({
      ...formData,
      role
    });
  };

  const handleModalSwitch = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({ name: '', email: '', password: '', role: defaultRole });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">MC</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Vitajte späť' : 'Vytvorte si účet'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? 'Prihláste sa do svojho účtu' : 'Pripojte sa k našej komunite'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-gray-700 font-medium">
            {isLogin ? 'Prihlásiť sa cez Google' : 'Registrovať sa cez Google'}
          </span>
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">alebo</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
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
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mailová adresa *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                placeholder="Zadajte svoj e-mail"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Heslo *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                placeholder="Zadajte svoje heslo"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                Heslo musí mať aspoň 6 znakov
              </p>
            )}
          </div>

          {!isLogin && (
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
                    required
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
                    required
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
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg
              ${!isLogin && formData.role === 'owner'
                ? 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
              }
            `}
          >
            {loading ? 'Čakajte prosím...' : (isLogin ? 'Prihlásiť sa' : 'Vytvoriť účet')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? "Nemáte účet?" : "Už máte účet?"}
            <button
              onClick={handleModalSwitch}
              className="ml-1 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {isLogin ? 'Registrovať sa' : 'Prihlásiť sa'}
            </button>
          </p>
        </div>

        {!isLogin && (
          <div className="mt-4 text-xs text-gray-500 text-center">
            Vytvorením účtu súhlasíte s našimi{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700">Podmienkami používania</a>
            {' '}a{' '}
            <a href="#" className="text-emerald-600 hover:text-emerald-700">Zásadami ochrany súkromia</a>
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <div className="font-bold">Auth Modal Debug:</div>
            <div>Mode: {isLogin ? 'Login' : 'Register'}</div>
            <div>Default Role: {defaultRole}</div>
            <div>Current Role: {formData.role}</div>
            <div>Default Mode: {defaultMode}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;