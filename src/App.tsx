import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './contexts/AuthProvider';
import AppContent from './components/AppContent';
import AuthCallback from './components/Auth/AuthCallback';

function App() {
  // Check if we're on the auth callback route
  if (window.location.pathname === '/auth/callback') {
    return (
      <Provider store={store}>
        <AuthProvider>
          <AuthCallback />
        </AuthProvider>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Provider>
  );
}

export default App;