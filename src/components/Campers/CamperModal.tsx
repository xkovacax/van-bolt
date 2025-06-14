import React, { useState, useEffect } from 'react';
import { X, Star, Users, MapPin, Wifi, Zap, Droplets, ChefHat, Wind, Sun, Tent, Calendar, MessageCircle } from 'lucide-react';
import { Camper } from '../../types';

interface CamperModalProps {
  camper: Camper | null;
  isOpen: boolean;
  onClose: () => void;
  onBook?: (camper: Camper) => void;
}

const CamperModal: React.FC<CamperModalProps> = ({ camper, isOpen, onClose, onBook }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

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

  if (!isOpen || !camper) return null;

  const features = [
    { key: 'kitchen', icon: ChefHat, label: 'Kitchen' },
    { key: 'bathroom', icon: Droplets, label: 'Bathroom' },
    { key: 'wifi', icon: Wifi, label: 'WiFi' },
    { key: 'heating', icon: Wind, label: 'Heating' },
    { key: 'airConditioning', icon: Wind, label: 'A/C' },
    { key: 'solar', icon: Zap, label: 'Solar Power' },
    { key: 'generator', icon: Zap, label: 'Generator' },
    { key: 'awning', icon: Tent, label: 'Awning' }
  ];

  const availableFeatures = features.filter(feature => 
    camper.features[feature.key as keyof typeof camper.features]
  );

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights * camper.price : 0;
  };

  const handleBooking = () => {
    if (checkIn && checkOut) {
      onBook?.(camper);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <X className="h-6 w-6 text-gray-600" />
        </button>

        {/* Image Gallery */}
        <div className="relative">
          <img
            src={camper.images[selectedImageIndex]}
            alt={camper.title}
            className="w-full h-64 md:h-80 object-cover rounded-t-2xl"
          />
          
          {camper.images.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 flex space-x-2 overflow-x-auto">
              {camper.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === selectedImageIndex ? 'border-white' : 'border-transparent'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${camper.title} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{camper.title}</h2>
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-gray-700">{camper.rating}</span>
                  <span className="text-gray-500">({camper.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{camper.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Sleeps {camper.capacity}</span>
                </div>
              </div>
            </div>

            {/* Host */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <img
                src={camper.owner.avatar}
                alt={camper.owner.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Hosted by {camper.owner.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{camper.owner.rating} • {camper.owner.reviewCount} reviews</span>
                </div>
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About this camper</h3>
              <p className="text-gray-700 leading-relaxed">{camper.description}</p>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What this place offers</h3>
              <div className="grid grid-cols-2 gap-3">
                {availableFeatures.map((feature) => (
                  <div key={feature.key} className="flex items-center space-x-3">
                    <feature.icon className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {camper.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sticky top-6">
              <div className="flex items-baseline space-x-1 mb-6">
                <span className="text-2xl font-bold text-gray-900">${camper.price}</span>
                <span className="text-gray-600">night</span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {checkIn && checkOut && calculateTotal() > 0 && (
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>${camper.price} × {Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights</span>
                      <span>${calculateTotal()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service fee</span>
                      <span>${Math.round(calculateTotal() * 0.1)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                      <span>Total</span>
                      <span>${calculateTotal() + Math.round(calculateTotal() * 0.1)}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={!checkIn || !checkOut}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {!checkIn || !checkOut ? 'Select dates' : 'Reserve'}
                </button>

                <p className="text-center text-sm text-gray-600">
                  You won't be charged yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CamperModal;