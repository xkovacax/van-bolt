export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'customer';
  avatar?: string;
  rating?: number;
  reviewCount?: number;
}

export interface Camper {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  location: string;
  capacity: number;
  amenities: string[];
  type: 'motorhome' | 'trailer' | 'van' | 'popup';
  owner: User;
  rating: number;
  reviewCount: number;
  availability: Date[];
  features: {
    kitchen: boolean;
    bathroom: boolean;
    heating: boolean;
    airConditioning: boolean;
    wifi: boolean;
    solar: boolean;
    generator: boolean;
    awning: boolean;
  };
}

export interface Booking {
  id: string;
  camper: Camper;
  customer: User;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
}

export interface Review {
  id: string;
  camper: Camper;
  customer: User;
  rating: number;
  comment: string;
  createdAt: Date;
}