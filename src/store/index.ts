import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import campersReducer from './slices/campersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    campers: campersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setSession'],
        ignoredPaths: ['auth.session'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;