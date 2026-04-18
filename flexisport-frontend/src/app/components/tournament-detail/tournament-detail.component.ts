import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { AuthService } from '../../services/auth.service';
import { Tournament, TournamentQuestion, TournamentQuestionAnswer } from '../../interfaces';

@Component({
  selector: 'app-tournament-detail',
  standalone: false,
  templateUrl: './tournament-detail.component.html',
  styleUrl: './tournament-detail.component.scss'
})
export class TournamentDetailComponent implements OnInit {
  tournament: Tournament | null = null;
  questions: TournamentQuestion[] = [];
  answersByQuestion: { [questionId: string]: TournamentQuestionAnswer[] } = {};
  newQuestion = '';
  askingQuestion = false;
  questionErrorMessage = '';
  questionSuccessMessage = '';
  registrationMessage = '';
  registrationError = '';
  registrationLoading = false;
  showSuccessPopup = false;
  successPopupTitle = 'Success';
  successPopupMessage = '';
  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tournamentService: TournamentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const tournamentId = params['id'];
      this.loadTournament(tournamentId);
    });
  }

  loadTournament(tournamentId: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.tournamentService.getTournamentById(tournamentId).subscribe({
      next: (data) => {
        this.tournament = data;
        if (data._id) {
          this.loadQuestions(data._id);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load tournament details.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tournaments']);
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isPlayer(): boolean {
    return this.authService.getUserRole() === 'player';
  }

  get isOwner(): boolean {
    return this.authService.getUserRole() === 'owner';
  }

  get participantCount(): number {
    return this.tournament?.registeredParticipants?.length || 0;
  }

  get canRegister(): boolean {
    if (!this.tournament || !this.isLoggedIn || !this.isPlayer) return false;
    if (this.isRegistered) return false;

    const isBeforeDeadline = new Date() <= new Date(this.tournament.registrationDeadline);
    const hasAvailableSpots = this.participantCount < this.tournament.maxParticipants;
    const isOpenStatus = this.tournament.status === 'upcoming';

    return isBeforeDeadline && hasAvailableSpots && isOpenStatus;
  }

  get isRegistered(): boolean {
    if (!this.tournament) return false;
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;

    return (this.tournament.registeredParticipants || []).some((p) => {
      if (typeof p === 'string') return p === currentUserId;
      return (p._id || p.id) === currentUserId;
    });
  }

  registerForTournament(): void {
    if (!this.tournament?._id || !this.canRegister || this.registrationLoading) return;

    this.registrationLoading = true;
    this.registrationError = '';
    this.registrationMessage = '';

    this.tournamentService.registerForTournament(this.tournament._id).subscribe({
      next: (updated) => {
        this.tournament = updated;
        this.registrationLoading = false;
        this.openSuccessPopup('Registration Complete', 'You are registered for this tournament.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.registrationLoading = false;
        this.registrationError = err.error?.error || 'Failed to register for tournament.';
        this.cdr.detectChanges();
      }
    });
  }

  unregisterFromTournament(): void {
    if (!this.tournament?._id || !this.isRegistered || this.registrationLoading) return;

    this.registrationLoading = true;
    this.registrationError = '';
    this.registrationMessage = '';

    this.tournamentService.unregisterFromTournament(this.tournament._id).subscribe({
      next: (updated) => {
        this.tournament = updated;
        this.registrationLoading = false;
        this.openSuccessPopup('Unregistered', 'You have unregistered from this tournament.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.registrationLoading = false;
        this.registrationError = err.error?.error || 'Failed to unregister from tournament.';
        this.cdr.detectChanges();
      }
    });
  }

  private getCurrentUserId(): string {
    const currentUser = this.authService.getStoredUser();
    return currentUser?.id || currentUser?._id || '';
  }

  onSuccessPopupClosed(): void {
    this.showSuccessPopup = false;
  }

  private openSuccessPopup(title: string, message: string): void {
    this.successPopupTitle = title;
    this.successPopupMessage = message;
    this.showSuccessPopup = true;
  }

  loadQuestions(tournamentId: string): void {
    this.tournamentService.getTournamentQuestions(tournamentId).subscribe({
      next: (data) => {
        this.questions = data || [];
        this.questions.forEach((q) => {
          if (q._id) {
            this.loadAnswers(tournamentId, q._id);
          }
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.questionErrorMessage = 'Failed to load questions.';
        this.cdr.detectChanges();
      }
    });
  }

  askQuestion(): void {
    if (!this.tournament?._id) return;

    const question = this.newQuestion.trim();
    if (!question) {
      this.questionErrorMessage = 'Question cannot be empty.';
      return;
    }

    this.askingQuestion = true;
    this.questionErrorMessage = '';
    this.questionSuccessMessage = '';

    this.tournamentService.askTournamentQuestion(this.tournament._id, question).subscribe({
      next: (created) => {
        this.questions = [created, ...this.questions];
        if (created._id) {
          this.answersByQuestion[created._id] = [];
        }
        this.newQuestion = '';
        this.askingQuestion = false;
        this.questionSuccessMessage = 'Question sent successfully. The court owner has been notified.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.askingQuestion = false;
        this.questionErrorMessage = err.error?.error || 'Failed to submit question.';
        this.cdr.detectChanges();
      }
    });
  }

  loadAnswers(tournamentId: string, questionId: string): void {
    this.tournamentService.getQuestionAnswers(tournamentId, questionId).subscribe({
      next: (answers) => {
        this.answersByQuestion[questionId] = answers || [];
        this.cdr.detectChanges();
      }
    });
  }

  getAnsweredByName(answeredBy: unknown): string {
    const author = answeredBy as unknown as string | { fullName?: string; username?: string };
    if (typeof author === 'string') return 'Owner';
    return author?.fullName || author?.username || 'Owner';
  }

  getAskedByName(question: TournamentQuestion): string {
    const askedBy = question.askedBy as unknown as string | { fullName?: string; username?: string };
    if (typeof askedBy === 'string') return 'User';
    return askedBy?.fullName || askedBy?.username || 'User';
  }

  getAuthorName(author: unknown): string {
    if (!author) return 'Unknown';
    if (typeof author === 'string') return 'Owner';
    const a = author as { fullName?: string; username?: string; email?: string };
    return a.fullName || a.username || a.email || 'Owner';
  }

  getCourtName(court: unknown): string {
    if (!court) return 'Unknown court';
    if (typeof court === 'string') return 'Court';
    const c = court as { name?: string; address?: string };
    return c.name || c.address || 'Court';
  }

  getCourtAddress(court: unknown): string {
    if (!court || typeof court === 'string') return 'Address not available';
    const c = court as { address?: string };
    return c.address || 'Address not available';
  }

  getExperienceLevelLabel(experienceLevel: string | undefined): string {
    if (!experienceLevel) return 'All Levels';
    const labels: { [key: string]: string } = {
      all_levels: 'All Levels',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };
    return labels[experienceLevel] || experienceLevel.replace(/_/g, ' ');
  }
}
