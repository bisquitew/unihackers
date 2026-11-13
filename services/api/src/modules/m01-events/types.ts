export type EventCategory = 'cinema' | 'music' | 'workshop' | 'showcase' | 'social';
export type EventAgeGroup = 'all' | 'students' | 'teens' | 'adults' | 'seniors';

export interface MicroEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  locationName: string;
  address: string;
  neighbourhood: string;
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

export interface CreateEventInput {
  title: string;
  description: string;
  category: EventCategory;
  locationName: string;
  address: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  dateTime: string;
  ageGroup?: EventAgeGroup;
  organizerName: string;
  organizerContact?: string;
  isFree?: boolean;
  priceAmount?: number;
  imageUrl?: string;
}

export interface RSVPInput {
  eventId: string;
  userId: string;
  userName: string;
  userWallet?: string;
  lookingForBuddy?: boolean;
}

export interface RSVPRecord {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userWallet?: string;
  solanaTicketSignature?: string;
  solanaExplorerUrl?: string;
  lookingForBuddy: boolean;
  createdAt: string;
}
