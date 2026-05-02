import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Tournament, TournamentQuestion, TournamentQuestionAnswer } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private apiUrl = '/api/tournaments';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  getAllTournaments(court?: string, sport?: string, status?: string): Observable<Tournament[]> {
    let url = this.apiUrl;
    const params = [];
    if (court) params.push(`court=${court}`);
    if (sport) params.push(`sport=${sport}`);
    if (status) params.push(`status=${status}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<Tournament[]>(url, {
      headers: new HttpHeaders({ 'Cache-Control': 'no-cache' })
    });
  }

  getTournamentById(id: string): Observable<Tournament> {
    return this.http.get<Tournament>(`${this.apiUrl}/${id}`);
  }

  getMyTournaments(): Observable<Tournament[]> {
    return this.http.get<Tournament[]>(`${this.apiUrl}/my/list`, {
      headers: this.getAuthHeaders()
    });
  }

  getModeratorTournaments(court?: string, sport?: string, status?: string): Observable<Tournament[]> {
    let url = `${this.apiUrl}/admin/list`;
    const params = [];
    if (court) params.push(`court=${court}`);
    if (sport) params.push(`sport=${sport}`);
    if (status) params.push(`status=${status}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<Tournament[]>(url, {
      headers: this.getAuthHeaders()
    });
  }

  updateTournamentPublicationStatus(
    id: string,
    publicationStatus: 'published' | 'unpublished' | 'suspended'
  ): Observable<Tournament> {
    return this.http.patch<Tournament>(
      `${this.apiUrl}/${id}/publication-status`,
      { publicationStatus },
      { headers: this.getAuthHeaders() }
    );
  }

  deleteQuestion(tournamentId: string, questionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${tournamentId}/questions/${questionId}`, {
      headers: this.getAuthHeaders()
    });
  }

  deleteAnswer(tournamentId: string, questionId: string, answerId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${tournamentId}/questions/${questionId}/answers/${answerId}`, {
      headers: this.getAuthHeaders()
    });
  }

  createTournament(tournament: Partial<Tournament>): Observable<Tournament> {
    return this.http.post<Tournament>(this.apiUrl, tournament, {
      headers: this.getAuthHeaders()
    });
  }

  updateTournament(id: string, tournament: Partial<Tournament>): Observable<Tournament> {
    return this.http.put<Tournament>(`${this.apiUrl}/${id}`, tournament, {
      headers: this.getAuthHeaders()
    });
  }

  uploadCoverPhoto(id: string, file: File): Observable<Tournament> {
    const formData = new FormData();
    formData.append('coverPhoto', file);

    return this.http.post<Tournament>(`${this.apiUrl}/${id}/cover-photo`, formData, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` })
    });
  }

  deleteCoverPhoto(id: string): Observable<Tournament> {
    return this.http.delete<Tournament>(`${this.apiUrl}/${id}/cover-photo`, {
      headers: this.getAuthHeaders()
    });
  }

  deleteTournament(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  registerForTournament(id: string): Observable<Tournament> {
    return this.http.post<Tournament>(`${this.apiUrl}/${id}/register`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  unregisterFromTournament(id: string): Observable<Tournament> {
    return this.http.post<Tournament>(`${this.apiUrl}/${id}/unregister`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getTournamentQuestions(tournamentId: string): Observable<TournamentQuestion[]> {
    return this.http.get<TournamentQuestion[]>(`${this.apiUrl}/${tournamentId}/questions`);
  }

  askTournamentQuestion(tournamentId: string, question: string): Observable<TournamentQuestion> {
    return this.http.post<TournamentQuestion>(`${this.apiUrl}/${tournamentId}/questions`, { question }, {
      headers: this.getAuthHeaders()
    });
  }

  updateTournamentQuestion(tournamentId: string, questionId: string, question: string): Observable<TournamentQuestion> {
    return this.http.patch<TournamentQuestion>(
      `${this.apiUrl}/${tournamentId}/questions/${questionId}`,
      { question },
      { headers: this.getAuthHeaders() }
    );
  }

  getQuestionAnswers(tournamentId: string, questionId: string): Observable<TournamentQuestionAnswer[]> {
    return this.http.get<TournamentQuestionAnswer[]>(`${this.apiUrl}/${tournamentId}/questions/${questionId}/answers`);
  }

  answerQuestion(tournamentId: string, questionId: string, answer: string): Observable<TournamentQuestionAnswer> {
    return this.http.post<TournamentQuestionAnswer>(
      `${this.apiUrl}/${tournamentId}/questions/${questionId}/answers`,
      { answer },
      { headers: this.getAuthHeaders() }
    );
  }

  updateQuestionAnswer(
    tournamentId: string,
    questionId: string,
    answerId: string,
    answer: string
  ): Observable<TournamentQuestionAnswer> {
    return this.http.patch<TournamentQuestionAnswer>(
      `${this.apiUrl}/${tournamentId}/questions/${questionId}/answers/${answerId}`,
      { answer },
      { headers: this.getAuthHeaders() }
    );
  }
}
