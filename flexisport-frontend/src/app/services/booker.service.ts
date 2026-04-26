import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Booking } from '../interfaces';

export interface BookerEntry {
  user: { _id: string; fullName: string; username: string; email: string };
  bookingCount: number;
  lastBooking: string;
  isFlagged: boolean;
  flagNote: string | null;
  denyBooking: boolean;
}

@Injectable({ providedIn: 'root' })
export class BookerService {
  private apiUrl = 'http://localhost:5000/api/bookers';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getBookers(): Observable<BookerEntry[]> {
    return this.http.get<BookerEntry[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getUserBookings(userId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/${userId}/bookings`, { headers: this.getAuthHeaders() });
  }

  flagUser(userId: string, note: string = ''): Observable<{ isFlagged: boolean; flagNote: string; denyBooking: boolean }> {
    return this.http.post<{ isFlagged: boolean; flagNote: string; denyBooking: boolean }>(
      `${this.apiUrl}/${userId}/flag`, { note }, { headers: this.getAuthHeaders() }
    );
  }

  unflagUser(userId: string): Observable<{ isFlagged: boolean }> {
    return this.http.delete<{ isFlagged: boolean }>(`${this.apiUrl}/${userId}/flag`, { headers: this.getAuthHeaders() });
  }

  denyUser(userId: string): Observable<{ isFlagged: boolean; denyBooking: boolean }> {
    return this.http.post<{ isFlagged: boolean; denyBooking: boolean }>(
      `${this.apiUrl}/${userId}/deny`, {}, { headers: this.getAuthHeaders() }
    );
  }

  undenyUser(userId: string): Observable<{ denyBooking: boolean }> {
    return this.http.delete<{ denyBooking: boolean }>(`${this.apiUrl}/${userId}/deny`, { headers: this.getAuthHeaders() });
  }
}
