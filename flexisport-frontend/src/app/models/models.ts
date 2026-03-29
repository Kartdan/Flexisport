export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  PLAYER = 'player',
  OWNER = 'owner'
}

export enum SupervisorStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum CourtStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum CourtOperationalStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  MAINTENANCE = 'maintenance',
  UNAVAILABLE = 'unavailable'
}

export enum SportSlug {
  FOOTBALL = 'football',
  TENNIS = 'tennis',
  BASKETBALL = 'basketball',
  VOLLEYBALL = 'volleyball',
  HANDBALL = 'handball',
  PADEL = 'padel'
}

export interface Sport {
  _id?: string;
  name: string;
  slug: SportSlug;
  emoji: string;
  countryCodes: string[];
}

export interface User {
  _id?: string;
  id?: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  supervisorStatus?: SupervisorStatus | null;
  createdAt?: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Court {
  _id?: string;
  author: User | string;
  name: string;
  sportCategories: string[];
  numberOfCourts: number;
  address: string;
  description: string;
  phone: string;
  pricePerHour: number;
  surfaceType: string;
  facilities: string[];
  photos: string[];
  schedules: Schedule[];
  status?: string;
  operationalStatus?: string;
  createdAt?: Date;
}

export interface Schedule {
  day: string;
  startTime: string;
  endTime: string;
}

export interface Review {
  _id?: string;
  court: string;
  author: User | string;
  rating: number;
  comment: string;
  createdAt?: Date;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface Post {
  _id?: string;
  title: string;
  content: string;
  authorRef?: string;
  authorName: string;
  courtRef?: string;
  postType: 'manual' | 'court_published' | 'status_update';
  date?: Date;
}