import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, BookingResult } from '../interfaces';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private apiUrl = 'http://localhost:5000/api/bookings';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/mine`, { headers: this.getAuthHeaders() });
  }

  checkAvailability(courtId: string, date: string, startTime: string, endTime: string): Observable<{ available: number; total: number; overlapping: number }> {
    const params = new HttpParams()
      .set('courtId', courtId)
      .set('date', date)
      .set('startTime', startTime)
      .set('endTime', endTime);
    return this.http.get<{ available: number; total: number; overlapping: number }>(
      `${this.apiUrl}/availability`, { headers: this.getAuthHeaders(), params }
    );
  }

  createBooking(courtId: string, date: string, startTime: string, endTime: string, repeatWeeks = 1): Observable<BookingResult> {
    return this.http.post<BookingResult>(this.apiUrl, { courtId, date, startTime, endTime, repeatWeeks }, { headers: this.getAuthHeaders() });
  }

  getSlots(courtId: string, date: string): Observable<{ bookings: { startTime: string; endTime: string }[]; blocked: { startTime: string | null; endTime: string | null; reason?: string }[] }> {
    const params = new HttpParams().set('courtId', courtId).set('date', date);
    return this.http.get<{ bookings: { startTime: string; endTime: string }[]; blocked: { startTime: string | null; endTime: string | null; reason?: string }[] }>(
      `${this.apiUrl}/slots`, { headers: this.getAuthHeaders(), params }
    );
  }

  getCourtBookings(courtId: string, date?: string): Observable<Booking[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<Booking[]>(`${this.apiUrl}/court/${courtId}`, { headers: this.getAuthHeaders(), params });
  }

  cancelBooking(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
