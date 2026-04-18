import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourtService } from '../../services/court.service';
import { Court } from '../../interfaces';

@Component({
  selector: 'app-court-detail',
  standalone: false,
  templateUrl: './court-detail.component.html',
  styleUrl: './court-detail.component.scss'
})
export class CourtDetailComponent implements OnInit {
  court: Court | null = null;
  loading = true;
  errorMessage = '';
  currentPhotoIndex = 0;

  constructor(
    private courtService: CourtService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const courtId = params['id'];
      this.loadCourt(courtId);
    });
  }

  loadCourt(courtId: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.currentPhotoIndex = 0;
    this.courtService.getCourtById(courtId).subscribe({
      next: (data) => {
        this.court = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load court details.';
        this.court = null;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/courts']);
  }

  nextPhoto(): void {
    if (this.court && this.court.photos && this.court.photos.length > 0) {
      this.currentPhotoIndex = (this.currentPhotoIndex + 1) % this.court.photos.length;
    }
  }

  previousPhoto(): void {
    if (this.court && this.court.photos && this.court.photos.length > 0) {
      this.currentPhotoIndex =
        (this.currentPhotoIndex - 1 + this.court.photos.length) %
        this.court.photos.length;
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
