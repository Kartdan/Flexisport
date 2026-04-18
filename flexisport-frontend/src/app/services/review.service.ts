import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review, ReviewSummary } from '../interfaces';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:5000/api/reviews';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getReviewsForCourt(courtId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/court/${courtId}`);
  }

  getReviewSummary(courtId: string): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(`${this.apiUrl}/court/${courtId}/summary`);
  }

  submitReview(courtId: string, rating: number, comment: string): Observable<Review> {
    return this.http.post<Review>(`${this.apiUrl}/court/${courtId}`, { rating, comment }, {
      headers: this.getAuthHeaders()
    });
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reviewId}`, {
      headers: this.getAuthHeaders()
    });
  }
}
