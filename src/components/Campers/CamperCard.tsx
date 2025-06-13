import React from 'react';
import { Heart, Star, Users, MapPin, Wifi, Zap, Droplets } from 'lucide-react';
import { Camper } from '../../types';

interface CamperCardProps {
  camper: Camper;
  onClick: (camper: Camper) => void;
  onFavorite?: (camperId: string) => void;
  isFavorite?: boolean;
}

const CamperCard: React.FC<CamperCardProps> = ({ 
  camper, 
  onClick, 
  onFavorite, 
  isFavorite = false 
}) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(camper.id);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'motorhome':
        return 'bg-blue-100 text-blue-800';
      case 'trailer':
        return 'bg-green-100 text-green-800';
      case 'van':
        return 'bg-orange-100 text-orange-800';
      case 'popup':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      onClick={() => onClick(camper)}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
    >
      {/* Image Container */}
      <div className="relative">
        <img
          src={camper.images[0]}
          alt={camper.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart 
            className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </button>
        
        {/* Type Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(camper.type)}`}>
          {camper.type.charAt(0).toUpperCase() + camper.type.slice(1)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Rating */}
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {camper.title}
          </h3>
          <div className="flex items-center space-x-1 ml-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700">
              {camper.rating}
            </span>
            <span className="text-sm text-gray-500">
              ({camper.reviewCount})
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center space-x-1 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{camper.location}</span>
        </div>

        {/* Amenities */}
        <div className="flex items-center space-x-4 text-gray-600">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Sleeps {camper.capacity}</span>
          </div>
          {camper.features.wifi && (
            <div className="flex items-center space-x-1">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">WiFi</span>
            </div>
          )}
          {camper.features.solar && (
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Solar</span>
            </div>
          )}
          {camper.features.bathroom && (
            <div className="flex items-center space-x-1">
              <Droplets className="h-4 w-4" />
              <span className="text-sm">Bathroom</span>
            </div>
          )}
        </div>

        {/* Owner */}
        <div className="flex items-center space-x-2">
          <img
            src={camper.owner.avatar}
            alt={camper.owner.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm text-gray-600">
            Hosted by {camper.owner.name}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-gray-900">
              ${camper.price}
            </span>
            <span className="text-sm text-gray-600">/ night</span>
          </div>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CamperCard;