import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: false,
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.scss']
})
export class SupervisorDashboardComponent implements OnInit {
  stats: any = null;
  loading = true;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.getSupervisorStats().subscribe({
      next: (data) => { this.stats = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.errorMessage = 'Failed to load stats.'; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}
