import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface ContactSupervisor {
  _id: string;
  fullName: string;
  email: string;
  preferredSports?: string[];
  personalDescription?: string;
  avatar?: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId?: { fullName: string; username: string } | null;
  recipientId?: { fullName: string; email: string } | null;
  recipientName?: string;
  recipientEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private apiUrl = '/api/contact';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getSupervisors(): Observable<ContactSupervisor[]> {
    return this.http.get<ContactSupervisor[]>(`${this.apiUrl}/supervisors`);
  }

  sendMessage(payload: { name: string; email: string; subject: string; message: string; recipientId: string }): Observable<any> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    return this.http.post(`${this.apiUrl}`, payload, { headers });
  }

  getMessages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.apiUrl}`, { headers: this.getAuthHeaders() });
  }

  markRead(id: string, read: boolean): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.apiUrl}/${id}/read`, { read }, { headers: this.getAuthHeaders() });
  }

  deleteMessage(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  // Supervisor: own inbox
  getMyMessages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.apiUrl}/mine`, { headers: this.getAuthHeaders() });
  }

  markMyRead(id: string, read: boolean): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.apiUrl}/mine/${id}/read`, { read }, { headers: this.getAuthHeaders() });
  }
}
