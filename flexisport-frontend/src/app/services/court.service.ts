import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Court, CourtStatus } from '../models/models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CourtService {
  private apiUrl = 'http://localhost:5000/api/courts';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getAllCourts(sport?: string): Observable<Court[]> {
    const url = sport ? `${this.apiUrl}?sport=${sport}` : this.apiUrl;
    return this.http.get<Court[]>(url);
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
}
