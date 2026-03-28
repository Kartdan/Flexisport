export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  PLAYER = 'player',
  OWNER = 'owner'
}

export interface User {
  id?: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
}