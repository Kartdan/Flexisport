import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { AuthService } from '../../services/auth.service';
import { Tournament } from '../../interfaces';

@Component({
  selector: 'app-tournaments',
  standalone: false,
  templateUrl: './tournaments.component.html',
  styleUrl: './tournaments.component.scss'
})
export class TournamentsComponent implements OnInit {
  tournaments: Tournament[] = [];
  loading = true;
  errorMessage = '';
  actionLoadingId = '';

  constructor(
    private tournamentService: TournamentService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTournaments();
  }

  loadTournaments(): void {
    const source$ = this.isModerator
      ? this.tournamentService.getModeratorTournaments()
      : this.tournamentService.getAllTournaments();

    source$.subscribe({
      next: (data) => {
        this.tournaments = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load tournaments.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openTournament(tournamentId: string | undefined): void {
    if (!tournamentId) return;
    this.router.navigate(['/tournaments', tournamentId]);
  }

  onModerationAction(
    event: Event,
    tournament: Tournament,
    publicationStatus: 'published' | 'unpublished' | 'suspended'
  ): void {
    event.stopPropagation();
    if (!tournament._id) return;

    this.actionLoadingId = tournament._id;
    this.tournamentService.updateTournamentPublicationStatus(tournament._id, publicationStatus).subscribe({
      next: (updated) => {
        this.tournaments = this.tournaments.map(t =>
          t._id === updated._id ? { ...t, ...updated } : t
        );
        this.actionLoadingId = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to update tournament publication status.';
        this.actionLoadingId = '';
        this.cdr.detectChanges();
      }
    });
  }

  get isModerator(): boolean {
    const role = this.authService.getUserRole();
    return role === 'admin' || role === 'supervisor';
  }

  getPublicationStatusLabel(status: string | undefined): string {
    if (!status) return 'Published';
    const labels: { [key: string]: string } = {
      published: 'Published',
      unpublished: 'Unpublished',
      suspended: 'Suspended'
    };
    return labels[status] || status;
  }

  getAuthorName(author: unknown): string {
    if (!author) return 'Unknown';
    if (typeof author === 'string') return 'Owner';
    const a = author as { fullName?: string; username?: string };
    return a.fullName || a.username || 'Owner';
  }

  getCourtName(court: unknown): string {
    if (!court) return 'Unknown court';
    if (typeof court === 'string') return 'Court';
    const c = court as { name?: string };
    return c.name || 'Court';
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
