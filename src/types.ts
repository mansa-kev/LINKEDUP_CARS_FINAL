export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  category: string;
  description: string;
  primary_image_url: string;
  photos: string[];
  images?: string[]; // Alias for photos
  video_url: string;
  transmission: string;
  fuel_type: string;
  seats: number;
  luggage?: number;
  features: string[];
  daily_rate: number;
  overtime_rate: number;
  security_deposit: number;
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  maintenance_status: 'ok' | 'due' | 'in_progress';
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  car_id: string;
  fleet_owner_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  cars?: Car;
  client?: UserProfile;
  fleet_owner?: UserProfile;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'fleet_owner' | 'client';
  created_at: string;
}
