import React, { useEffect } from 'react';
import { X, Sliders } from 'lucide-react';

interface FilterOptions {
  priceRange: [number, number];
  capacity: number;
  type: string;
  features: string[];
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange 
}) => {
  // Disable/enable body scroll when mobile sidebar opens/closes
  useEffect(() => {
    if (isOpen) {
      // Only disable scrolling on mobile (when sidebar is overlay)
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      // Re-enable scrolling
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to ensure scrolling is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const camperTypes = [
    { value: '', label: 'All Types' },
    { value: 'motorhome', label: 'Motorhome' },
    { value: 'trailer', label: 'Trailer' },
    { value: 'van', label: 'Van' },
    { value: 'popup', label: 'Pop-up' }
  ];

  const featureOptions = [
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'wifi', label: 'WiFi' },
    { value: 'heating', label: 'Heating' },
    { value: 'airConditioning', label: 'Air Conditioning' },
    { value: 'solar', label: 'Solar Power' },
    { value: 'generator', label: 'Generator' },
    { value: 'awning', label: 'Awning' }
  ];

  const handlePriceChange = (index: number, value: number) => {
    const newRange: [number, number] = [...filters.priceRange];
    newRange[index] = value;
    onFiltersChange({ ...filters, priceRange: newRange });
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter(f => f !== feature)
      : [...filters.features, feature];
    onFiltersChange({ ...filters, features: newFeatures });
  };

  const clearFilters = () => {
    onFiltersChange({
      priceRange: [0, 500],
      capacity: 0,
      type: '',
      features: []
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform lg:static lg:z-auto lg:shadow-none lg:transform-none">
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Sliders className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Price Range */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Price Range</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Min</label>
                    <input
                      type="number"
                      value={filters.priceRange[0]}
                      onChange={(e) => handlePriceChange(0, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Max</label>
                    <input
                      type="number"
                      value={filters.priceRange[1]}
                      onChange={(e) => handlePriceChange(1, parseInt(e.target.value) || 500)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>${filters.priceRange[0]}</span>
                  <span>${filters.priceRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Capacity */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Guests</h3>
              <select
                value={filters.capacity}
                onChange={(e) => onFiltersChange({ ...filters, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value={0}>Any number of guests</option>
                <option value={2}>2+ guests</option>
                <option value={4}>4+ guests</option>
                <option value={6}>6+ guests</option>
                <option value={8}>8+ guests</option>
              </select>
            </div>

            {/* Camper Type */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Camper Type</h3>
              <div className="space-y-2">
                {camperTypes.map((type) => (
                  <label key={type.value} className="flex items-center">
                    <input
                      type="radio"
                      name="camperType"
                      value={type.value}
                      checked={filters.type === type.value}
                      onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Features</h3>
              <div className="space-y-2">
                {featureOptions.map((feature) => (
                  <label key={feature.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.features.includes(feature.value)}
                      onChange={() => handleFeatureToggle(feature.value)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="w-full py-2 px-4 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;