import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isAuthModalOpen: boolean;
  isCamperModalOpen: boolean;
  isFilterSidebarOpen: boolean;
  authModalDefaultRole: 'owner' | 'customer';
  authModalDefaultMode: 'login' | 'register';
  selectedCamperId: string | null;
}

const initialState: UIState = {
  isAuthModalOpen: false,
  isCamperModalOpen: false,
  isFilterSidebarOpen: false,
  authModalDefaultRole: 'customer',
  authModalDefaultMode: 'login',
  selectedCamperId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAuthModal: (state, action: PayloadAction<{ role?: 'owner' | 'customer'; mode?: 'login' | 'register' }>) => {
      state.isAuthModalOpen = true;
      state.authModalDefaultRole = action.payload.role || 'customer';
      state.authModalDefaultMode = action.payload.mode || 'login';
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
    },
    openCamperModal: (state, action: PayloadAction<string>) => {
      state.isCamperModalOpen = true;
      state.selectedCamperId = action.payload;
    },
    closeCamperModal: (state) => {
      state.isCamperModalOpen = false;
      state.selectedCamperId = null;
    },
    openFilterSidebar: (state) => {
      state.isFilterSidebarOpen = true;
    },
    closeFilterSidebar: (state) => {
      state.isFilterSidebarOpen = false;
    },
  },
});

export const {
  openAuthModal,
  closeAuthModal,
  openCamperModal,
  closeCamperModal,
  openFilterSidebar,
  closeFilterSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;