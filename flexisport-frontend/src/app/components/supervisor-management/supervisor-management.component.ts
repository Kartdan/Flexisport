import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User, SupervisorStatus } from '../../interfaces';

@Component({
  selector: 'app-supervisor-management',
  standalone: false,
  templateUrl: './supervisor-management.component.html',
  styleUrl: './supervisor-management.component.scss'
})
export class SupervisorManagementComponent implements OnInit {
  supervisors: User[] = [];
  errorMessage = '';
  successMessage = '';
  readonly SupervisorStatus = SupervisorStatus;

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSupervisors();
  }

  loadSupervisors(): void {
    this.authService.getSupervisors().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.supervisors = [...data];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.error || `Failed to load supervisors (${err.status})`;
        this.cdr.detectChanges();
      }
    });
  }

  updateStatus(supervisor: User, status: SupervisorStatus): void {
    const supervisorId = supervisor._id || supervisor.id;
    this.authService.updateSupervisorStatus(supervisorId!, status).subscribe({
      next: (updated) => {
        const updatedId = updated._id || updated.id;
        const index = this.supervisors.findIndex(s => (s._id || s.id) === updatedId);
        if (index !== -1) {
          const updated_list = [...this.supervisors];
          updated_list[index] = updated;
          this.supervisors = updated_list;
        }
        this.successMessage = `Status updated to "${status}" for ${supervisor.fullName}.`;
        this.cdr.detectChanges();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: () => {
        this.errorMessage = 'Failed to update status.';
        this.cdr.detectChanges();
      }
    });
  }
}
