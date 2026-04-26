import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, AuthResponse } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private usersUrl = 'http://localhost:5000/api/users';

  constructor(private http: HttpClient, private router: Router) {}

  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res && res.token) {
          this.saveToken(res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }

  private saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  getUserRole(): string | null {
    const user = this.getStoredUser();
    return user ? user.role : null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  getStoredUser(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) as User : null;
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }

  getSupervisors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.usersUrl}/supervisors`, {
      headers: this.getAuthHeaders()
    });
  }

  updateSupervisorStatus(id: string, status: string): Observable<User> {
    return this.http.patch<User>(`${this.usersUrl}/supervisors/${id}/status`, { status }, {
      headers: this.getAuthHeaders()
    });
  }

  getMyProfile(): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/me`, {
      headers: this.getAuthHeaders()
    });
  }

  updateMyProfile(
    profile: Pick<User, 'fullName' | 'username' | 'email' | 'preferredSports' | 'personalDescription'>
  ): Observable<User> {
    return this.http.put<User>(`${this.usersUrl}/me`, profile, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap((user) => {
        const currentUser = this.getStoredUser();
        if (!currentUser) return;

        const mergedUser: User = {
          ...currentUser,
          ...user,
          id: user.id || user._id || currentUser.id || currentUser._id
        };
        localStorage.setItem('user', JSON.stringify(mergedUser));
      })
    );
  }

  getAllUsers(filters?: { role?: string; search?: string }): Observable<User[]> {
    let params = '';
    if (filters?.role) params += `role=${encodeURIComponent(filters.role)}&`;
    if (filters?.search) params += `search=${encodeURIComponent(filters.search)}&`;
    const url = `${this.usersUrl}/admin/all${params ? '?' + params : ''}`;
    return this.http.get<User[]>(url, { headers: this.getAuthHeaders() });
  }

  changeUserRole(userId: string, role: string): Observable<User> {
    return this.http.patch<User>(`${this.usersUrl}/admin/${userId}/role`, { role }, {
      headers: this.getAuthHeaders()
    });
  }

  setUserSuspended(userId: string, suspended: boolean): Observable<User> {
    return this.http.patch<User>(`${this.usersUrl}/admin/${userId}/suspend`, { suspended }, {
      headers: this.getAuthHeaders()
    });
  }
}