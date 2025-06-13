import { Camper, User } from '../types';

export const mockOwners: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'owner',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 4.9,
    reviewCount: 87
  },
  {
    id: '2',
    name: 'Mike Anderson',
    email: 'mike@example.com',
    role: 'owner',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 4.7,
    reviewCount: 45
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    role: 'owner',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    rating: 4.8,
    reviewCount: 63
  }
];

export const mockCampers: Camper[] = [
  {
    id: '1',
    title: 'Luxury Class A Motorhome',
    description: 'Spacious and comfortable motorhome perfect for family adventures. Features a full kitchen, bathroom, and sleeping for 6.',
    images: [
      'https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2827753/pexels-photo-2827753.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1687678/pexels-photo-1687678.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    price: 150,
    location: 'Portland, Oregon',
    capacity: 6,
    amenities: ['Kitchen', 'Bathroom', 'WiFi', 'Solar Power', 'Awning'],
    type: 'motorhome',
    owner: mockOwners[0],
    rating: 4.8,
    reviewCount: 32,
    availability: [],
    features: {
      kitchen: true,
      bathroom: true,
      heating: true,
      airConditioning: true,
      wifi: true,
      solar: true,
      generator: true,
      awning: true
    }
  },
  {
    id: '2',
    title: 'Cozy Travel Trailer',
    description: 'Perfect for couples or small families. Easy to tow and park, with all the essentials for a great camping experience.',
    images: [
      'https://images.pexels.com/photos/1687678/pexels-photo-1687678.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2827753/pexels-photo-2827753.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    price: 85,
    location: 'Denver, Colorado',
    capacity: 4,
    amenities: ['Kitchen', 'Bathroom', 'Heating', 'Awning'],
    type: 'trailer',
    owner: mockOwners[1],
    rating: 4.6,
    reviewCount: 18,
    availability: [],
    features: {
      kitchen: true,
      bathroom: true,
      heating: true,
      airConditioning: false,
      wifi: false,
      solar: false,
      generator: false,
      awning: true
    }
  },
  {
    id: '3',
    title: 'Adventure Van',
    description: 'Converted van perfect for off-grid adventures. Compact but well-equipped with solar power and outdoor kitchen.',
    images: [
      'https://images.pexels.com/photos/2827753/pexels-photo-2827753.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    price: 120,
    location: 'Austin, Texas',
    capacity: 2,
    amenities: ['Kitchen', 'Solar Power', 'WiFi', 'Outdoor Gear'],
    type: 'van',
    owner: mockOwners[2],
    rating: 4.9,
    reviewCount: 41,
    availability: [],
    features: {
      kitchen: true,
      bathroom: false,
      heating: true,
      airConditioning: false,
      wifi: true,
      solar: true,
      generator: false,
      awning: false
    }
  },
  {
    id: '4',
    title: 'Family Motorhome',
    description: 'Spacious motorhome ideal for family road trips. Sleeps 8 comfortably with bunk beds and a convertible dinette.',
    images: [
      'https://images.pexels.com/photos/1687678/pexels-photo-1687678.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    price: 180,
    location: 'Phoenix, Arizona',
    capacity: 8,
    amenities: ['Kitchen', 'Bathroom', 'WiFi', 'Generator', 'Awning', 'Outdoor Chairs'],
    type: 'motorhome',
    owner: mockOwners[0],
    rating: 4.7,
    reviewCount: 55,
    availability: [],
    features: {
      kitchen: true,
      bathroom: true,
      heating: true,
      airConditioning: true,
      wifi: true,
      solar: false,
      generator: true,
      awning: true
    }
  },
  {
    id: '5',
    title: 'Compact Pop-up Trailer',
    description: 'Lightweight and easy to tow pop-up trailer. Perfect for camping enthusiasts who want comfort without the bulk.',
    images: [
      'https://images.pexels.com/photos/2827753/pexels-photo-2827753.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    price: 60,
    location: 'Seattle, Washington',
    capacity: 4,
    amenities: ['Kitchen', 'Heating', 'Awning'],
    type: 'popup',
    owner: mockOwners[1],
    rating: 4.4,
    reviewCount: 12,
    availability: [],
    features: {
      kitchen: true,
      bathroom: false,
      heating: true,
      airConditioning: false,
      wifi: false,
      solar: false,
      generator: false,
      awning: true
    }
  },
  {
    id: '6',
    title: 'Luxury Class C Motorhome',
    description: 'Premium motorhome with high-end finishes and amenities. Perfect for those who want to travel in style and comfort.',
    images: [
      'https://images.pexels.com/photos/1687845/pexels-photo-1687845.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1687678/pexels-photo-1687678.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2827753/pexels-photo-2827753.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    price: 200,
    location: 'San Francisco, California',
    capacity: 6,
    amenities: ['Kitchen', 'Bathroom', 'WiFi', 'Solar Power', 'Generator', 'Awning', 'Outdoor Kitchen'],
    type: 'motorhome',
    owner: mockOwners[2],
    rating: 4.9,
    reviewCount: 78,
    availability: [],
    features: {
      kitchen: true,
      bathroom: true,
      heating: true,
      airConditioning: true,
      wifi: true,
      solar: true,
      generator: true,
      awning: true
    }
  }
];