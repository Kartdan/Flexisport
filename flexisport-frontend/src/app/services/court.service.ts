import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Court, CourtStatus } from '../interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CourtService {
  private apiUrl = '/api/courts';
  private baseUrl = '';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getPhotoUrl(photo: string): string {
    if (!photo) return '';
    if (photo.startsWith('data:') || photo.startsWith('http')) return photo;
    return `${this.baseUrl}${photo}`;
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getAllCourts(filters?: { sport?: string; surface?: string; minPrice?: number; maxPrice?: number; city?: string }): Observable<Court[]> {
    const params: string[] = [];
    if (filters?.sport) params.push(`sport=${encodeURIComponent(filters.sport)}`);
    if (filters?.surface) params.push(`surface=${encodeURIComponent(filters.surface)}`);
    if (filters?.minPrice != null) params.push(`minPrice=${filters.minPrice}`);
    if (filters?.maxPrice != null) params.push(`maxPrice=${filters.maxPrice}`);
    if (filters?.city) params.push(`city=${encodeURIComponent(filters.city)}`);
    const url = params.length ? `${this.apiUrl}?${params.join('&')}` : this.apiUrl;
    return this.http.get<Court[]>(url, {
      headers: new HttpHeaders({ 'Cache-Control': 'no-cache' })
    });
  }

  getCourtById(id: string): Observable<Court> {
    return this.http.get<Court>(`${this.apiUrl}/${id}`);
  }

  getMyCourts(): Observable<Court[]> {
    return this.http.get<Court[]>(`${this.apiUrl}/mine/list`, {
      headers: this.getAuthHeaders()
    });
  }

  createCourt(court: Partial<Court>): Observable<Court> {
    return this.http.post<Court>(this.apiUrl, court, {
      headers: this.getAuthHeaders()
    });
  }

  updateCourt(id: string, court: Partial<Court>): Observable<Court> {
    return this.http.put<Court>(`${this.apiUrl}/${id}`, court, {
      headers: this.getAuthHeaders()
    });
  }

  deleteCourt(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getAdminCourts(): Observable<Court[]> {
    return this.http.get<Court[]>(`${this.apiUrl}/admin/list`, {
      headers: this.getAuthHeaders()
    });
  }

  updateCourtStatus(courtId: string, status: CourtStatus): Observable<Court> {
    return this.http.patch<Court>(`${this.apiUrl}/admin/${courtId}/status`, { status }, {
      headers: this.getAuthHeaders()
    });
  }

  deletePhoto(courtId: string, photo: string): Observable<Court> {
    return this.http.delete<Court>(`${this.apiUrl}/${courtId}/photos`, {
      headers: this.getAuthHeaders(),
      body: { photo }
    });
  }

  uploadPhotos(courtId: string, files: File[]): Observable<Court> {
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));
    return this.http.post<Court>(`${this.apiUrl}/${courtId}/photos`, formData, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` })
    });
  }

  getBlockedSlots(courtId: string): Observable<import('../interfaces').BlockedSlot[]> {
    return this.http.get<import('../interfaces').BlockedSlot[]>(
      `${this.apiUrl}/${courtId}/blocked-slots`,
      { headers: this.getAuthHeaders() }
    );
  }

  addBlockedSlot(courtId: string, slot: { date: string; startTime?: string; endTime?: string; reason?: string }): Observable<import('../interfaces').BlockedSlot> {
    return this.http.post<import('../interfaces').BlockedSlot>(
      `${this.apiUrl}/${courtId}/blocked-slots`, slot,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteBlockedSlot(courtId: string, slotId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${courtId}/blocked-slots/${slotId}`,
      { headers: this.getAuthHeaders() }
    );
  }
}
