import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { Tournament, Court, Sport, PostDialogData, TournamentQuestion, TournamentQuestionAnswer } from '../../interfaces';
import { CourtService } from '../../services/court.service';
import { SportService } from '../../services/sport.service';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-tournament-management',
  standalone: false,
  templateUrl: './tournament-management.component.html',
  styleUrl: './tournament-management.component.scss'
})
export class TournamentManagementComponent implements OnInit, OnDestroy {
  tournaments: Tournament[] = [];
  courts: Court[] = [];
  sports: Sport[] = [];
  tournamentForm!: FormGroup;
  showForm = false;
  loading = true;
  errorMessage = '';
  successMessage = '';
  editingId: string | null = null;
  selectedCoverPhoto: string | null = null;
  selectedCoverPhotoFile: File | null = null;
  coverPhotoRemoved = false;

  showPostDialog = false;
  postDialogTitle = '';
  postDialogContent = '';
  private pendingTournamentId: string | null = null;

  showSuccessPopup = false;
  successPopupTitle = 'Success';
  successPopupMessage = '';

  showErrorPopup = false;
  errorPopupTitle = 'Action Failed';
  errorPopupMessage = '';

  expandedQuestionsTournamentId: string | null = null;
  expandedParticipantsTournamentId: string | null = null;
  questionsByTournament: { [tournamentId: string]: TournamentQuestion[] } = {};
  answersByQuestion: { [questionId: string]: TournamentQuestionAnswer[] } = {};
  answerDrafts: { [questionId: string]: string } = {};
  editingQuestionId: string | null = null;
  editingAnswerId: string | null = null;
  questionEditDrafts: { [questionId: string]: string } = {};
  answerEditDrafts: { [answerId: string]: string } = {};
  loadingQuestions = false;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  formatOptions = [
    { value: 'single_elimination', label: 'Single Elimination' },
    { value: 'double_elimination', label: 'Double Elimination' },
    { value: 'round_robin', label: 'Round Robin' },
    { value: 'group_stage', label: 'Group Stage' }
  ];

  experienceLevelOptions = [
    { value: 'all_levels', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  statusColors: { [key: string]: string } = {
    'upcoming': '#ffc107',
    'ongoing': '#28a745',
    'completed': '#6c757d',
    'cancelled': '#dc3545'
  };

  constructor(
    private fb: FormBuilder,
    private tournamentService: TournamentService,
    private courtService: CourtService,
    private sportService: SportService,
    private postService: PostService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadTournaments();
    this.loadCourts();
    this.loadSports();
    this.refreshTimer = setInterval(() => this.loadTournaments(false), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  initializeForm(): void {
    this.tournamentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      court: ['', Validators.required],
      sport: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      format: ['', Validators.required],
      experienceLevel: ['all_levels', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      registrationDeadline: ['', Validators.required],
      maxParticipants: ['', [Validators.required, Validators.min(2)]],
      entryFee: ['', [Validators.required, Validators.min(0)]],
      prizes: [''],
      coverPhoto: ['']
    });
  }

  loadTournaments(showErrors = true): void {
    this.tournamentService.getMyTournaments().subscribe({
      next: (data) => {
        this.tournaments = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (showErrors) {
          this.errorMessage = 'Failed to load tournaments.';
          this.openErrorPopup('Load Failed', this.errorMessage);
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCourts(): void {
    this.courtService.getMyCourts().subscribe({
      next: (data) => {
        this.courts = data;
      },
      error: () => {
        console.error('Failed to load courts');
      }
    });
  }

  loadSports(): void {
    this.sportService.getSports().subscribe({
      next: (data) => {
        this.sports = data;
      },
      error: () => {
        console.error('Failed to load sports');
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.tournamentForm.reset();
      this.editingId = null;
      this.selectedCoverPhoto = null;
      this.selectedCoverPhotoFile = null;
      this.coverPhotoRemoved = false;
    }
  }

  onCoverPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedCoverPhotoFile = file;
      this.coverPhotoRemoved = false;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedCoverPhoto = e.target.result;
        this.tournamentForm.patchValue({ coverPhoto: '' });
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
      // Clear the input value so the same file can be selected again
      const fileInput = event.target as HTMLInputElement;
      fileInput.value = '';
    }
  }

  removeCoverPhoto(): void {
    if (this.selectedCoverPhoto) {
      this.coverPhotoRemoved = true;
    }
    this.selectedCoverPhoto = null;
    this.selectedCoverPhotoFile = null;
    this.tournamentForm.patchValue({ coverPhoto: '' });
    const fileInput = document.getElementById('coverPhoto') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  editTournament(tournament: Tournament): void {
    this.editingId = tournament._id || null;
    this.showForm = true;
    this.selectedCoverPhoto = tournament.coverPhoto || null;
    this.selectedCoverPhotoFile = null;
    this.coverPhotoRemoved = false;
    const tournamentCourt = tournament.court as unknown as string | { _id?: string };
    const courtValue = typeof tournamentCourt === 'string' ? tournamentCourt : tournamentCourt?._id || '';

    this.tournamentForm.patchValue({
      name: tournament.name,
      court: courtValue,
      sport: tournament.sport,
      description: tournament.description,
      format: tournament.format,
      experienceLevel: tournament.experienceLevel || 'all_levels',
      startDate: this.formatDateForInput(tournament.startDate),
      endDate: this.formatDateForInput(tournament.endDate),
      registrationDeadline: this.formatDateForInput(tournament.registrationDeadline),
      maxParticipants: tournament.maxParticipants,
      entryFee: tournament.entryFee,
      prizes: tournament.prizes,
      coverPhoto: tournament.coverPhoto || ''
    });
  }

  onSubmit(): void {
    if (this.tournamentForm.invalid) {
      this.errorMessage = 'Please fill in all required fields.';
      this.openErrorPopup('Validation Error', this.errorMessage);
      return;
    }

    if (new Date(this.tournamentForm.get('registrationDeadline')?.value) >= 
        new Date(this.tournamentForm.get('startDate')?.value)) {
      this.errorMessage = 'Registration deadline must be before start date.';
      this.openErrorPopup('Validation Error', this.errorMessage);
      return;
    }

    if (new Date(this.tournamentForm.get('startDate')?.value) >= 
        new Date(this.tournamentForm.get('endDate')?.value)) {
      this.errorMessage = 'Start date must be before end date.';
      this.openErrorPopup('Validation Error', this.errorMessage);
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const wasEditing = !!this.editingId;

    const formValue = this.tournamentForm.value;
    const tournament: Partial<Tournament> = {
      ...formValue,
      coverPhoto: undefined,
      startDate: new Date(formValue.startDate),
      endDate: new Date(formValue.endDate),
      registrationDeadline: new Date(formValue.registrationDeadline)
    };

    console.log('Submitting tournament:', tournament);

    if (this.editingId) {
      this.tournamentService.updateTournament(this.editingId, tournament).subscribe({
        next: (updated) => {
          this.successMessage = 'Tournament updated successfully!';
          this.afterTournamentSave(updated._id || null, wasEditing, updated);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.error || 'Failed to update tournament.';
          this.openErrorPopup('Update Failed', this.errorMessage);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.tournamentService.createTournament(tournament).subscribe({
        next: (created) => {
          this.afterTournamentSave(created._id || null, wasEditing, created);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.error || 'Failed to create tournament.';
          this.openErrorPopup('Create Failed', this.errorMessage);
          this.cdr.detectChanges();
        }
      });
    }
  }

  private afterTournamentSave(tournamentId: string | null, wasEditing: boolean, tournament: Tournament): void {
    const finalize = () => {
      this.showForm = false;
      this.tournamentForm.reset();
      this.selectedCoverPhoto = null;
      this.selectedCoverPhotoFile = null;
      this.coverPhotoRemoved = false;
      this.editingId = null;

      if (wasEditing) {
        this.successMessage = 'Tournament updated successfully!';
        this.openSuccessPopup('Tournament Updated', 'Tournament updated successfully.');
      } else {
        this.pendingTournamentId = tournament._id || null;
        this.postDialogTitle = `New Tournament: ${tournament.name}`;
        this.postDialogContent = `Check out this tournament at the ${tournament.sport} court!`;
        this.showPostDialog = true;
      }

      this.loadTournaments();
      this.loading = false;
      this.cdr.detectChanges();
    };

    if (!tournamentId) {
      finalize();
      return;
    }

    if (this.selectedCoverPhotoFile) {
      this.tournamentService.uploadCoverPhoto(tournamentId, this.selectedCoverPhotoFile).subscribe({
        next: () => finalize(),
        error: () => {
          this.errorMessage = 'Tournament saved, but cover photo upload failed.';
          this.openErrorPopup('Upload Failed', this.errorMessage);
          finalize();
        }
      });
      return;
    }

    if (this.coverPhotoRemoved && wasEditing) {
      this.tournamentService.deleteCoverPhoto(tournamentId).subscribe({
        next: () => finalize(),
        error: () => {
          this.errorMessage = 'Tournament saved, but cover photo removal failed.';
          this.openErrorPopup('Photo Remove Failed', this.errorMessage);
          finalize();
        }
      });
      return;
    }

    finalize();
  }

  deleteTournament(id: string | undefined): void {
    if (!id || !confirm('Are you sure you want to delete this tournament?')) return;

    this.tournamentService.deleteTournament(id).subscribe({
      next: () => {
        this.successMessage = 'Tournament deleted successfully!';
        this.loadTournaments();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to delete tournament.';
        this.openErrorPopup('Delete Failed', this.errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  toggleTournamentQuestions(tournamentId: string | undefined): void {
    if (!tournamentId) return;

    if (this.expandedQuestionsTournamentId === tournamentId) {
      this.expandedQuestionsTournamentId = null;
      return;
    }

    this.expandedQuestionsTournamentId = tournamentId;
    this.loadTournamentQuestions(tournamentId);
  }

  toggleTournamentParticipants(tournamentId: string | undefined): void {
    if (!tournamentId) return;

    if (this.expandedParticipantsTournamentId === tournamentId) {
      this.expandedParticipantsTournamentId = null;
      return;
    }

    this.expandedParticipantsTournamentId = tournamentId;
  }

  private loadTournamentQuestions(tournamentId: string): void {
    this.loadingQuestions = true;

    this.tournamentService.getTournamentQuestions(tournamentId).subscribe({
      next: (questions) => {
        this.questionsByTournament[tournamentId] = questions || [];
        this.loadingQuestions = false;
        (questions || []).forEach(q => {
          if (q._id) {
            this.loadQuestionAnswers(tournamentId, q._id);
          }
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingQuestions = false;
        this.openErrorPopup('Load Failed', 'Failed to load tournament questions.');
        this.cdr.detectChanges();
      }
    });
  }

  private loadQuestionAnswers(tournamentId: string, questionId: string): void {
    this.tournamentService.getQuestionAnswers(tournamentId, questionId).subscribe({
      next: (answers) => {
        this.answersByQuestion[questionId] = answers || [];
        this.cdr.detectChanges();
      }
    });
  }

  submitAnswer(tournamentId: string | undefined, questionId: string | undefined): void {
    if (!tournamentId || !questionId) return;

    const answer = (this.answerDrafts[questionId] || '').trim();
    if (answer.length < 2) {
      this.openErrorPopup('Validation Error', 'Answer must be at least 2 characters long.');
      return;
    }

    this.tournamentService.answerQuestion(tournamentId, questionId, answer).subscribe({
      next: (createdAnswer) => {
        const current = this.answersByQuestion[questionId] || [];
        this.answersByQuestion[questionId] = [...current, createdAnswer];
        this.answerDrafts[questionId] = '';

        const tournamentQuestions = this.questionsByTournament[tournamentId] || [];
        this.questionsByTournament[tournamentId] = tournamentQuestions.map(q =>
          q._id === questionId ? { ...q, status: 'answered' } : q
        );

        this.openSuccessPopup('Answer Posted', 'Your answer has been posted successfully.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        const message = err.error?.error || 'Failed to submit answer.';
        this.openErrorPopup('Submit Failed', message);
        this.cdr.detectChanges();
      }
    });
  }

  startEditQuestion(question: TournamentQuestion): void {
    if (!question._id) return;
    this.editingQuestionId = question._id;
    this.questionEditDrafts[question._id] = question.question;
  }

  cancelEditQuestion(): void {
    this.editingQuestionId = null;
  }

  saveQuestionEdit(tournamentId: string | undefined, question: TournamentQuestion): void {
    if (!tournamentId || !question._id) return;

    const nextText = (this.questionEditDrafts[question._id] || '').trim();
    if (!nextText) {
      this.openErrorPopup('Validation Error', 'Question cannot be empty.');
      return;
    }

    this.tournamentService.updateTournamentQuestion(tournamentId, question._id, nextText).subscribe({
      next: (updated) => {
        const currentQuestions = this.questionsByTournament[tournamentId] || [];
        this.questionsByTournament[tournamentId] = currentQuestions.map(q =>
          q._id === updated._id ? { ...q, ...updated } : q
        );
        this.editingQuestionId = null;
        this.openSuccessPopup('Question Updated', 'Question updated successfully.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.openErrorPopup('Update Failed', err.error?.error || 'Failed to update question.');
        this.cdr.detectChanges();
      }
    });
  }

  startEditAnswer(answer: TournamentQuestionAnswer): void {
    if (!answer._id) return;
    this.editingAnswerId = answer._id;
    this.answerEditDrafts[answer._id] = answer.answer;
  }

  cancelEditAnswer(): void {
    this.editingAnswerId = null;
  }

  saveAnswerEdit(
    tournamentId: string | undefined,
    questionId: string | undefined,
    answer: TournamentQuestionAnswer
  ): void {
    if (!tournamentId || !questionId || !answer._id) return;

    const nextText = (this.answerEditDrafts[answer._id] || '').trim();
    if (nextText.length < 2) {
      this.openErrorPopup('Validation Error', 'Answer must be at least 2 characters long.');
      return;
    }

    this.tournamentService.updateQuestionAnswer(tournamentId, questionId, answer._id, nextText).subscribe({
      next: (updated) => {
        const currentAnswers = this.answersByQuestion[questionId] || [];
        this.answersByQuestion[questionId] = currentAnswers.map(a =>
          a._id === updated._id ? { ...a, ...updated } : a
        );
        this.editingAnswerId = null;
        this.openSuccessPopup('Answer Updated', 'Answer updated successfully.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.openErrorPopup('Update Failed', err.error?.error || 'Failed to update answer.');
        this.cdr.detectChanges();
      }
    });
  }

  isEdited(item: { createdAt?: Date; updatedAt?: Date }): boolean {
    if (!item.createdAt || !item.updatedAt) return false;
    return new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 1000;
  }

  getQuestionStatusStyle(status: string | undefined): { [key: string]: string } {
    if (status === 'answered') {
      return {
        backgroundColor: '#198754',
        color: 'white',
        padding: '0.2rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.75rem'
      };
    }

    return {
      backgroundColor: '#6c757d',
      color: 'white',
      padding: '0.2rem 0.5rem',
      borderRadius: '12px',
      fontSize: '0.75rem'
    };
  }

  getAskedByName(askedBy: unknown): string {
    if (!askedBy) return 'User';
    if (typeof askedBy === 'string') return 'User';

    const author = askedBy as { fullName?: string; username?: string };
    return author.fullName || author.username || 'User';
  }

  getAnsweredByName(answeredBy: unknown): string {
    if (!answeredBy) return 'Owner';
    if (typeof answeredBy === 'string') return 'Owner';

    const author = answeredBy as { fullName?: string; username?: string };
    return author.fullName || author.username || 'Owner';
  }

  canEditQuestion(question: TournamentQuestion): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;

    const askedBy = question.askedBy as unknown as string | { _id?: string; id?: string };
    const questionAuthorId = typeof askedBy === 'string' ? askedBy : askedBy?._id || askedBy?.id || '';

    return !!questionAuthorId && questionAuthorId === currentUserId;
  }

  canEditAnswer(answer: TournamentQuestionAnswer): boolean {
    const currentUserId = this.getCurrentUserId();
    if (!currentUserId) return false;

    const answeredBy = answer.answeredBy as unknown as string | { _id?: string; id?: string };
    const answerAuthorId = typeof answeredBy === 'string' ? answeredBy : answeredBy?._id || answeredBy?.id || '';

    return !!answerAuthorId && answerAuthorId === currentUserId;
  }

  private getCurrentUserId(): string {
    const user = this.authService.getStoredUser();
    return user?.id || user?._id || '';
  }

  formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const offsetMs = d.getTimezoneOffset() * 60 * 1000;
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  getCourtName(court: Court | string): string {
    if (!court) return 'Unknown Court';

    if (typeof court !== 'string') {
      return court.name || 'Unknown Court';
    }

    const foundCourt = this.courts.find(c => c._id === court);
    return foundCourt ? foundCourt.name : 'Unknown Court';
  }

  getCourtAddress(court: Court | string): string {
    if (!court) return 'Address not available';

    if (typeof court !== 'string') {
      return court.address || 'Address not available';
    }

    const foundCourt = this.courts.find(c => c._id === court);
    return foundCourt?.address || 'Address not available';
  }

  getSportName(sportSlug: string): string {
    const sport = this.sports.find(s => s.slug === sportSlug);
    return sport ? sport.name : sportSlug;
  }

  getFormatLabel(format: string): string {
    const option = this.formatOptions.find(o => o.value === format);
    return option ? option.label : format;
  }

  getExperienceLevelLabel(experienceLevel: string | undefined): string {
    if (!experienceLevel) return 'All Levels';
    const option = this.experienceLevelOptions.find(o => o.value === experienceLevel);
    if (option) return option.label;
    return experienceLevel.replace(/_/g, ' ');
  }

  getStatusBadgeStyle(status: string): { [key: string]: string } {
    return {
      backgroundColor: this.statusColors[status] || '#6c757d',
      color: 'white',
      padding: '0.25rem 0.75rem',
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '500',
      display: 'inline-block'
    };
  }

  getParticipantName(participant: unknown): string {
    if (!participant) return 'Player';
    if (typeof participant === 'string') return 'Player';
    const p = participant as { fullName?: string; username?: string };
    return p.fullName || p.username || 'Player';
  }

  getParticipantUsername(participant: unknown): string {
    if (!participant || typeof participant === 'string') return '';
    const p = participant as { username?: string };
    return p.username || '';
  }

  getParticipantEmail(participant: unknown): string {
    if (!participant || typeof participant === 'string') return '';
    const p = participant as { email?: string };
    return p.email || '';
  }

  onPostDialogConfirmed(data: PostDialogData): void {
    const user = this.authService.getStoredUser();
    this.postService.createPost({
      title: data.title,
      content: data.content,
      authorName: user?.fullName || user?.username || 'Owner',
      postType: 'manual'
    }).subscribe({
      next: () => {
        this.showPostDialog = false;
        this.successMessage = 'Tournament created and post published!';
        this.openSuccessPopup('Tournament Published', 'Tournament created and post published!');
        this.loadTournaments();
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showPostDialog = false;
        this.successMessage = 'Tournament created (post failed to publish).';
        this.openSuccessPopup('Tournament Created', 'Tournament created (post failed to publish).');
        this.loadTournaments();
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      }
    });
  }

  onPostDialogCancelled(): void {
    this.showPostDialog = false;
    this.successMessage = 'Tournament created successfully!';
    this.openSuccessPopup('Tournament Created', 'Tournament created successfully!');
    this.loadTournaments();
    setTimeout(() => this.successMessage = '', 3000);
    this.cdr.detectChanges();
  }

  onSuccessPopupClosed(): void {
    this.showSuccessPopup = false;
  }

  onErrorPopupClosed(): void {
    this.showErrorPopup = false;
  }

  private openSuccessPopup(title: string, message: string): void {
    this.successPopupTitle = title;
    this.successPopupMessage = message;
    this.showSuccessPopup = true;
  }

  private openErrorPopup(title: string, message: string): void {
    this.errorPopupTitle = title;
    this.errorPopupMessage = message;
    this.showErrorPopup = true;
  }
}
