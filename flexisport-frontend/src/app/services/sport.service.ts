import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Sport } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class SportService {
  private apiUrl = '/api/sports';

  constructor(private http: HttpClient) {}

  getSports(countryCode = 'RO'): Observable<Sport[]> {
    return this.http.get<Sport[]>(`${this.apiUrl}?country=${countryCode}`);
  }
}
