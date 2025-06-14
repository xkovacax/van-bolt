import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Camper } from '../../types';
import { mockCampers } from '../../data/mockData';

interface FilterOptions {
  priceRange: [number, number];
  capacity: number;
  type: string;
  features: string[];
}

interface CampersState {
  allCampers: Camper[];
  filteredCampers: Camper[];
  searchQuery: string;
  favorites: string[];
  filters: FilterOptions;
}

const initialState: CampersState = {
  allCampers: mockCampers,
  filteredCampers: mockCampers,
  searchQuery: '',
  favorites: [],
  filters: {
    priceRange: [0, 500],
    capacity: 0,
    type: '',
    features: []
  },
};

const campersSlice = createSlice({
  name: 'campers',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      campersSlice.caseReducers.applyFilters(state);
    },
    setFilters: (state, action: PayloadAction<FilterOptions>) => {
      state.filters = action.payload;
      campersSlice.caseReducers.applyFilters(state);
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const camperId = action.payload;
      if (state.favorites.includes(camperId)) {
        state.favorites = state.favorites.filter(id => id !== camperId);
      } else {
        state.favorites.push(camperId);
      }
    },
    applyFilters: (state) => {
      let filtered = state.allCampers;
      
      // Apply search query
      if (state.searchQuery.trim()) {
        filtered = filtered.filter(camper =>
          camper.location.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          camper.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          camper.description.toLowerCase().includes(state.searchQuery.toLowerCase())
        );
      }
      
      // Apply price range
      filtered = filtered.filter(camper => 
        camper.price >= state.filters.priceRange[0] && camper.price <= state.filters.priceRange[1]
      );
      
      // Apply capacity
      if (state.filters.capacity > 0) {
        filtered = filtered.filter(camper => camper.capacity >= state.filters.capacity);
      }
      
      // Apply type
      if (state.filters.type) {
        filtered = filtered.filter(camper => camper.type === state.filters.type);
      }
      
      // Apply features
      if (state.filters.features.length > 0) {
        filtered = filtered.filter(camper => 
          state.filters.features.every(feature => 
            camper.features[feature as keyof typeof camper.features]
          )
        );
      }
      
      state.filteredCampers = filtered;
    },
  },
});

export const { setSearchQuery, setFilters, toggleFavorite } = campersSlice.actions;
export default campersSlice.reducer;