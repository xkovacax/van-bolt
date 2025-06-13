import React from 'react';
import { Camper } from '../../types';
import CamperCard from './CamperCard';

interface CamperGridProps {
  campers: Camper[];
  onCamperClick: (camper: Camper) => void;
  onFavorite?: (camperId: string) => void;
  favorites?: string[];
}

const CamperGrid: React.FC<CamperGridProps> = ({ 
  campers, 
  onCamperClick, 
  onFavorite, 
  favorites = [] 
}) => {
  if (campers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🏕️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No campers found</h3>
        <p className="text-gray-600">Try adjusting your search criteria or explore all available campers.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campers.map((camper) => (
        <CamperCard
          key={camper.id}
          camper={camper}
          onClick={onCamperClick}
          onFavorite={onFavorite}
          isFavorite={favorites.includes(camper.id)}
        />
      ))}
    </div>
  );
};

export default CamperGrid;