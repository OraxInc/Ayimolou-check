export type UserRole = 'client' | 'vendeur' | 'livreur' | 'admin';

export interface User {
  uid: string;
  email: string;
  phoneNumber: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string | Date;
  updatedAt: string | Date;
  // Profile specific data
  clientProfile?: ClientProfile;
  vendorProfile?: VendeurProfile;
  driverProfile?: LivreurProfile;
}

export interface ClientProfile {
  defaultAddress?: string;
  favorites?: string[]; // IDs of vendors
}

export interface VendeurProfile {
  shopName: string;
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  isOpen: boolean;
  rating: number;
  specialty: string[];
  imageUrl?: string;
}

export interface LivreurProfile {
  vehicleType: 'moto' | 'velo' | 'voiture';
  vehiclePlate?: string;
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}
