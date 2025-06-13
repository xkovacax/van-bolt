import React, { useRef, useEffect, useState } from 'react';
import { Search, MapPin, Calendar, DollarSign, TrendingUp, Shield, Star, Users } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface HeroProps {
  onSearch: (query: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [location, setLocation] = useState('');

  useEffect(() => {
    // Initialize Google Places Autocomplete
    if (locationInputRef.current && window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        types: ['(cities)'],
        componentRestrictions: { country: ['sk', 'cz', 'at', 'hu', 'pl'] } // Central Europe focus
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setLocation(place.formatted_address);
        }
      });
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that both dates are filled
    if (!startDate || !endDate) {
      alert('Prosím vyplňte oba dátumy pre vyhľadávanie.');
      return;
    }

    // Validate that end date is after start date
    if (endDate <= startDate) {
      alert('Dátum ukončenia musí byť po dátume začiatku.');
      return;
    }

    onSearch(location || 'all');
  };

  const isSearchDisabled = !startDate || !endDate;

  return (
    <div className="relative bg-gradient-to-br from-emerald-50 to-blue-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Primary Content (Customer Focus) */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Prenajmite si
                <span className="text-emerald-600 block">Campervan</span>
                na Dovolenku
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Objavte tisíce jedinečných campervanoch od overených majiteľov. Od luxusných obytných vozidiel po útulné prívesy - nájdite si svoj dokonalý domov na kolesách.
              </p>
            </div>

            {/* Search Form - Primary CTA */}
            <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-4 border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    ref={locationInputRef}
                    type="text"
                    name="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lokalita"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500 bg-white/90"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date | null) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    minDate={new Date()}
                    placeholderText="Od"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500 bg-white/90"
                    dateFormat="dd/MM/yyyy"
                    required
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Calendar className="h-4 w-4 text-gray-400" />
                  </div>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate || new Date()}
                    placeholderText="Do"
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500 bg-white/90"
                    dateFormat="dd/MM/yyyy"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSearchDisabled}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center space-x-2 ${
                  isSearchDisabled 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                <Search className="h-6 w-6" />
                <span>Vyhľadať Campervany</span>
              </button>
              
              {isSearchDisabled && (
                <p className="text-sm text-gray-500 text-center">
                  Pre vyhľadávanie vyplňte oba dátumy
                </p>
              )}
            </form>

            {/* Customer Stats - Rental focused */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">15,000+</div>
                <div className="text-sm text-gray-600">Spokojných zákazníkov</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">3,500+</div>
                <div className="text-sm text-gray-600">Campervanoch k dispozícii</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">4.9★</div>
                <div className="text-sm text-gray-600">Priemerné hodnotenie</div>
              </div>
            </div>
          </div>

          {/* Right Column - Image with Enhanced Owner CTA */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src="https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Luxury Camper"
                className="w-full h-96 lg:h-[500px] object-cover rounded-2xl shadow-2xl"
              />
              
              {/* Enhanced Owner CTA Card - Larger and more prominent */}
              <div className="absolute top-6 right-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl p-6 max-w-sm text-white transform hover:scale-105 transition-all duration-300">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <DollarSign className="h-6 w-6 text-orange-100" />
                    <span className="font-bold text-xl text-white">Zarábajte až €18,000/rok</span>
                  </div>
                  <p className="text-orange-100 text-sm leading-relaxed">
                    Prenajímajte svoj campervan a začnite zarábať pasívny príjem už dnes
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-orange-100">
                    <div className="flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>Poistené</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span>Overení užívatelia</span>
                    </div>
                  </div>
                  <button className="w-full bg-white text-orange-600 py-3 px-6 rounded-xl text-base font-bold hover:bg-orange-50 transition-colors shadow-lg">
                    Pridať Campervan
                  </button>
                </div>
              </div>
              
              {/* Vehicle count card - moved to bottom right */}
              <div className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 hidden lg:block border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Bratislava</div>
                    <div className="text-sm text-gray-600">180+ vozidiel</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background decoration - more transparent */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 to-blue-200/30 rounded-2xl transform rotate-3 scale-105"></div>
          </div>
        </div>
      </div>

      {/* Owner Benefits Section - Enhanced with better styling */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-t border-orange-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Vlastníte campervan? Premeňte ho na príjem
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pripojte sa k tisíckam majiteľov, ktorí zarábajú peniaze zo svojich nevyužitých campervanoch
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center space-y-4 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <DollarSign className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-900">Zarábajte extra príjem</h3>
              <p className="text-gray-600 leading-relaxed">
                Priemerní majitelia zarábajú €15,000+ ročne prenajímaním svojich campervanoch
              </p>
            </div>
            
            <div className="text-center space-y-4 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-900">Chránené a poistené</h3>
              <p className="text-gray-600 leading-relaxed">
                €1M poistné krytie a 24/7 asistenčná služba v cene
              </p>
            </div>
            
            <div className="text-center space-y-4 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-xl text-gray-900">Jednoduché spravovanie</h3>
              <p className="text-gray-600 leading-relaxed">
                Jednoduchý proces pridania s automatickými rezerváciami a platbami
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Začnite zarábať už dnes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Declare global Google Maps types
declare global {
  interface Window {
    google: any;
  }
}

export default Hero;