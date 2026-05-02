import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth.service';

interface MonthlyStatEntry {
  month: string;
  bookings: number;
  revenue: number;
}

interface TopCourt {
  name: string;
  address: string;
  bookings: number;
}

interface AnalyticsData {
  totals: {
    users: number;
    courts: { total: number; accepted: number; pending: number; rejected: number };
    bookings: { total: number; active: number; cancelled: number };
    tournaments: number;
    revenue: number;
  };
  usersByRole: { player: number; owner: number; supervisor: number; admin: number };
  monthlyStats: MonthlyStatEntry[];
  topCourts: TopCourt[];
}

@Component({
  selector: 'app-admin-analytics',
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['./admin-analytics.component.scss'],
  standalone: false
})
export class AdminAnalyticsComponent implements OnInit {
  data: AnalyticsData | null = null;
  loading = true;
  errorMessage = '';

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.errorMessage = '';
    this.authService.getAnalytics().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load analytics data.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatMonth(key: string): string {
    const [year, month] = key.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }

  chartBarHeight(value: number, max: number): string {
    if (max === 0) return '0%';
    return `${Math.round((value / max) * 100)}%`;
  }

  get maxMonthlyBookings(): number {
    if (!this.data) return 1;
    return Math.max(...this.data.monthlyStats.map(m => m.bookings), 1);
  }

  get maxMonthlyRevenue(): number {
    if (!this.data) return 1;
    return Math.max(...this.data.monthlyStats.map(m => m.revenue), 1);
  }

  get cancellationRate(): string {
    if (!this.data || this.data.totals.bookings.total === 0) return '0';
    return ((this.data.totals.bookings.cancelled / this.data.totals.bookings.total) * 100).toFixed(1);
  }
}
