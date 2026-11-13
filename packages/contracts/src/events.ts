export type EventCategory = 'cinema' | 'music' | 'workshop' | 'showcase' | 'social';

export type EventAgeGroup = 'all' | 'students' | 'teens' | 'adults' | 'seniors';

export interface MicroEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  locationName: string;
  address: string;
  neighbourhood: string; // e.g., 'Cetate', 'Fabric', 'Iosefin', 'Elisabetin'
  latitude: number;
  longitude: number;
  dateTime: string;
  ageGroup: EventAgeGroup;
  organizerName: string;
  organizerContact?: string;
  attendeeCount: number;
  maxCapacity?: number;
  isFree: boolean;
  priceAmount?: number;
  audioDigestUrl?: string;
  imageUrl?: string;
}

export interface EventFilter {
  category?: EventCategory;
  neighbourhood?: string;
  date?: string;
  ageGroup?: EventAgeGroup;
  search?: string;
}

export interface EventRSVPRequest {
  eventId: string;
  userId: string;
  userName: string;
  userWallet?: string;
  lookingForBuddy?: boolean;
}

export interface EventRSVPResponse {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  status: 'confirmed' | 'waitlist';
  solanaTicketSignature?: string;
  solanaExplorerUrl?: string;
  createdAt: string;
}
