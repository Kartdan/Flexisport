import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CourtService } from '../../services/court.service';
import { Court, CourtStatus } from '../../interfaces';

@Component({
  selector: 'app-court-approval',
  standalone: false,
  templateUrl: './court-approval.component.html',
  styleUrl: './court-approval.component.scss'
})
export class CourtApprovalComponent implements OnInit {
  courts: Court[] = [];
  errorMessage = '';
  successMessage = '';
  readonly CourtStatus = CourtStatus;

  constructor(private courtService: CourtService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCourts();
  }

  loadCourts(): void {
    this.courtService.getAdminCourts().subscribe({
      next: (data) => {
        if (data) {
          this.courts = [...data];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.error || `Failed to load courts (${err.status})`;
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(court: Court, status: CourtStatus): void {
    const courtId = court._id!;
    this.courtService.updateCourtStatus(courtId, status).subscribe({
      next: (updated) => {
        const index = this.courts.findIndex(c => c._id === updated._id);
        if (index !== -1) {
          const list = [...this.courts];
          list[index] = updated;
          this.courts = list;
        }
        this.successMessage = `Status updated to "${status}" for ${court.name}.`;
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => {
        this.errorMessage = 'Failed to update court status.';
        this.cdr.detectChanges();
      }
    });
  }

  getAuthorName(court: Court): string {
    if (typeof court.author === 'string') return court.author;
    return court.author?.fullName || court.author?.username || 'Unknown';
  }
}
