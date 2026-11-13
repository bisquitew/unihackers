export type IssueCategory = 'pothole' | 'streetlight' | 'graffiti' | 'trash' | 'playground' | 'other';
export type IssueStatus = 'reported' | 'verified' | 'in_progress' | 'resolved';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  latitude: number;
  longitude: number;
  address?: string;
  status: IssueStatus;
  upvotes: number;
  image_url?: string;
  created_at: string;
  reporter_id: string;
}

export interface SmellReport {
  id: string;
  odour_type: 'burnt_rubber' | 'chemical' | 'rotten' | 'smoke' | 'sewage' | 'other';
  intensity: number; // 1-5
  offensiveness: number; // 1-5
  symptoms?: string[];
  latitude: number;
  longitude: number;
  neighbourhood?: string;
  reported_at: string;
}

export interface UtilityOutage {
  id: string;
  utility: 'Colterm' | 'Aquatim' | 'Enel/Rețele Electrice' | 'Delgaz Grid';
  type: 'planned_maintenance' | 'unplanned_breakdown';
  affected_area: string;
  status: 'scheduled' | 'active' | 'resolved';
  affected_count: number;
  description: string;
  estimated_restoration?: string;
  last_updated: string;
}

export interface TransitDetour {
  line: string;
  status: 'suspended' | 'detoured' | 'normal';
  reason: string;
  alternative: string;
  valid_until: string;
}

export interface MicroEvent {
  id: string;
  title: string;
  category: 'cinema' | 'music' | 'workshop' | 'showcase' | 'social';
  location_name: string;
  latitude: number;
  longitude: number;
  date_time: string;
  description: string;
  attendee_count: number;
  audio_digest_url?: string;
}

export interface EventBuddyRequest {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  university_or_bio?: string;
  interests?: string[];
  icebreaker_prompt?: string;
  created_at: string;
}

export interface LivingLabsFeedback {
  id: string;
  screen: string;
  rating: number; // 1 to 5
  comment?: string;
  created_at: string;
}

export interface ParkingLot {
  id: string;
  owner_id?: string;
  name: string;
  latitude: number;
  longitude: number;
  camera_url?: string;
  capacity: number;
  available_spots: number;
  status_color: 'green' | 'yellow' | 'red' | 'grey';
  is_verified: boolean;
  last_updated: string;
}
