export type StrainType = 'indica' | 'sativa' | 'hybrid' | 'auto';
export type PlantStage = 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'harvest';
export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  country_code: string;
  subscription_tier: SubscriptionTier;
  created_at: string;
}

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  strain: string;
  strain_type: StrainType;
  stage: PlantStage;
  start_date: string;
  expected_harvest: string;
  nutrients?: Record<string, unknown>;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface PhotoRequest {
  type: string;
  description: string;
}

export interface AIAnalysis {
  diagnosis: string;
  health_score: number;
  recommendations: string[];
  identified_issues: string[];
  needs_more_photos?: boolean;
  photo_requests?: PhotoRequest[];
}

export interface CheckIn {
  id: string;
  plant_id: string;
  date: string;
  photo_url: string;
  ai_analysis: AIAnalysis | null;
  height_cm: number | null;
  notes?: string;
  issues: string[];
  created_at: string;
}

export interface StoreHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface StoreContact {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
}

export interface Store {
  id: string;
  name: string;
  country_code: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  tier: 'basic' | 'silver' | 'gold' | 'platinum';
  logo_url?: string;
  hours?: StoreHours;
  contact?: StoreContact;
  is_verified: boolean;
  created_at: string;
}

export type WateringType = 'water' | 'feed' | 'foliar' | 'flush';

export interface NutrientEntry {
  name: string;
  amount_ml: number;
}

export interface WateringLog {
  id: string;
  plant_id: string;
  user_id: string;
  date: string;
  type: WateringType;
  amount_ml?: number;
  ph_level?: number;
  ec_level?: number;
  nutrients: NutrientEntry[];
  notes?: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface PlantListState {
  plants: Plant[];
  isLoading: boolean;
  error: string | null;
}
