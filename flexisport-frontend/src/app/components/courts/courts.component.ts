import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CourtService } from '../../services/court.service';
import { SportService } from '../../services/sport.service';
import { Court, Sport } from '../../interfaces';

@Component({
  selector: 'app-courts',
  standalone: false,
  templateUrl: './courts.component.html',
  styleUrl: './courts.component.scss'
})
export class CourtsComponent implements OnInit {
  courts: Court[] = [];
  sports: Sport[] = [];
  filteredCourts: Court[] = [];
  selectedSport: string = '';
  loading = true;
  errorMessage = '';

  constructor(
    private courtService: CourtService,
    private sportService: SportService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSports();
    this.loadCourts();
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

  loadCourts(): void {
    this.courtService.getAllCourts().subscribe({
      next: (data) => {
        this.courts = data;
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load courts.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    if (!this.selectedSport) {
      this.filteredCourts = [...this.courts];
    } else {
      this.filteredCourts = this.courts.filter(court =>
        court.sportCategories?.includes(this.selectedSport)
      );
    }
  }

  onSportChange(): void {
    this.applyFilter();
  }

  goToCourtDetail(courtId: string | undefined): void {
    if (courtId) {
      this.router.navigate(['/courts', courtId]);
    }
  }

  getStatusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'open':
        return 'badge-open';
      case 'closed':
        return 'badge-closed';
      case 'maintenance':
        return 'badge-maintenance';
      case 'unavailable':
        return 'badge-unavailable';
      default:
        return 'badge-open';
    }
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'open':
        return '🟢 Open';
      case 'closed':
        return '🔴 Closed';
      case 'maintenance':
        return '🟡 Maintenance';
      case 'unavailable':
        return '⚫ Unavailable';
      default:
        return 'Open';
    }
  }
}
