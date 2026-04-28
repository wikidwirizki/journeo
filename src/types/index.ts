export interface Trip {
  id: string;
  userId?: string;
  name: string;
  destination: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  coverImage?: string; // base64 or URL
  budget: number;
  currency?: string; // e.g., 'IDR', 'JPY', 'EUR', 'USD'
  isPublic?: boolean;
}

export type ActivityType = 'flight' | 'hotel' | 'activity' | 'food' | 'transport';

export interface ItineraryItem {
  id: string;
  userId?: string;
  tripId: string;
  date: string; // ISO date string without time
  time?: string; // HH:mm
  title: string;
  type: ActivityType;
  location?: string;
  googleMapsUrl?: string;
  notes?: string;
  cost?: number;
}

export interface Expense {
  id: string;
  userId?: string;
  tripId: string;
  title: string;
  amount: number; // Actual amount
  budgetAmount?: number; // Planned/budget amount
  currency?: string; // e.g., 'IDR', 'JPY', 'EUR', 'USD'
  isPaid?: boolean; // Whether it has been paid
  date: string; // ISO date string
  category: string;
}

export interface Attachment {
  id: string;
  userId?: string;
  tripId: string;
  title: string;
  fileData: string; // Base64 data URI
  fileType: string; // mime type
  dateAdded: string; // ISO
}

export interface Outfit {
  id: string;
  userId?: string;
  tripId: string;
  date?: string; // ISO if planned for a specific day
  photoData: string; // Base64
  description?: string;
}

export interface PackingItem {
  id: string;
  userId?: string;
  tripId: string;
  title: string;
  isPacked: boolean;
  category: string;
}
