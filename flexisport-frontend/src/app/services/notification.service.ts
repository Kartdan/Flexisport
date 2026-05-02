import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { NotificationItem } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getMyNotifications(): Observable<NotificationItem[]> {
    return this.http.get<NotificationItem[]>(`${this.apiUrl}/mine`, {
      headers: this.getAuthHeaders()
    });
  }

  markAsRead(notificationId: string): Observable<NotificationItem> {
    return this.http.patch<NotificationItem>(`${this.apiUrl}/${notificationId}/read`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  markAllAsRead(): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/read-all`, {}, {
      headers: this.getAuthHeaders()
    });
  }
}
