// Centralized interfaces and enums for the app

// Enums
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

// Interfaces
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
  preferredSports?: string[];
  gamesPlayedBySport?: { [sport: string]: number };
  personalDescription?: string;
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
  averageRating?: number;
  totalReviews?: number;
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

export interface Tournament {
  _id?: string;
  author: User | string;
  court: Court | string;
  name: string;
  sport: string;
  description: string;
  format: string;
  experienceLevel?: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxParticipants: number;
  entryFee: number;
  prizes?: string;
  coverPhoto?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  publicationStatus?: 'published' | 'unpublished' | 'suspended';
  registeredParticipants?: Array<User | string>;
  createdAt?: Date;
}

export type TournamentQuestionVisibility = 'public';

export type TournamentQuestionStatus = 'open' | 'answered' | 'closed';

export interface TournamentQuestion {
  _id?: string;
  tournament: string;
  court: string;
  askedBy: User | string;
  question: string;
  visibility: TournamentQuestionVisibility;
  status?: TournamentQuestionStatus;
  answerCount?: number;
  latestAnswerAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TournamentQuestionAnswer {
  _id?: string;
  questionId: string;
  tournament: string;
  court: string;
  answeredBy: User | string;
  answer: string;
  isOwnerResponse?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTournamentQuestionPayload {
  tournament: string;
  question: string;
  visibility: TournamentQuestionVisibility;
}

export interface CreateTournamentAnswerPayload {
  questionId: string;
  answer: string;
}

export interface PostDialogData {
  title: string;
  content: string;
}

export interface NotificationItem {
  _id?: string;
  user: string;
  type: 'tournament_question' | 'tournament_answer' | 'court_status' | 'tournament_publication_status' | 'tournament_details_updated';
  title: string;
  message: string;
  court?: Court | string;
  tournament?: Tournament | string;
  question?: TournamentQuestion | string;
  isRead: boolean;
  createdAt?: Date;
}
