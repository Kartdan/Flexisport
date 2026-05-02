import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CourtService } from '../../services/court.service';
import { SportService } from '../../services/sport.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { Court, Sport, BookingResult } from '../../interfaces';

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

  // Filters
  selectedSport: string = '';
  selectedSurface: string = '';
  citySearch: string = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minRating: number = 0;
  sortBy: string = 'default';
  filtersExpanded = false;

  readonly surfaceOptions = [
    { value: 'grass', label: 'Grass' },
    { value: 'clay', label: 'Clay' },
    { value: 'synthetic', label: 'Synthetic' },
    { value: 'hardcourt', label: 'Hardcourt' },
    { value: 'indoor', label: 'Indoor' },
    { value: 'sand', label: 'Sand' },
    { value: 'parquet', label: 'Parquet' },
    { value: 'other', label: 'Other' },
  ];

  get activeFilterCount(): number {
    let n = 0;
    if (this.selectedSport) n++;
    if (this.selectedSurface) n++;
    if (this.citySearch) n++;
    if (this.minPrice != null) n++;
    if (this.maxPrice != null) n++;
    if (this.minRating > 0) n++;
    if (this.sortBy !== 'default') n++;
    return n;
  }
  loading = true;
  errorMessage = '';

  // Booking modal state
  selectedCourt: Court | null = null;
  showBookingModal = false;
  bookingDate = '';
  bookingStartTime = '';
  bookingEndTime = '';
  bookingError = '';
  bookingLoading = false;
  bookingResult: BookingResult | null = null;
  availabilityInfo: { available: number; total: number } | null = null;
  availabilityChecking = false;
  todayString = new Date().toISOString().split('T')[0];

  // Slot calendar state
  bookedSlots: { startTime: string; endTime: string }[] = [];
  blockedSlotsData: { startTime: string | null; endTime: string | null; reason?: string }[] = [];
  slotsLoading = false;
  readonly timeSlots = this.generateTimeSlots();

  // Recurring booking
  repeatEnabled = false;
  repeatWeeks = 4;

  private generateTimeSlots(): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = [];
    for (let h = 7; h < 22; h++) {
      for (const m of [0, 30]) {
        const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const endH = m === 30 ? h + 1 : h;
        const endM = m === 30 ? 0 : 30;
        const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        slots.push({ start, end });
      }
    }
    return slots;
  }

  getRepeatDates(): string[] {
    if (!this.bookingDate) return [];
    const [y, m, d] = this.bookingDate.split('-').map(Number);
    return Array.from({ length: this.repeatWeeks }, (_, i) => {
      const dt = new Date(y, m - 1, d + i * 7);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    });
  }

  getBookingHours(): number {
    if (!this.bookingStartTime || !this.bookingEndTime) return 0;
    const [sh, sm] = this.bookingStartTime.split(':').map(Number);
    const [eh, em] = this.bookingEndTime.split(':').map(Number);
    return (eh * 60 + em - sh * 60 - sm) / 60;
  }

  getTotalCost(): number {
    const count = this.repeatEnabled ? this.repeatWeeks : 1;
    return this.getBookingHours() * (this.selectedCourt?.pricePerHour || 0) * count;
  }

  constructor(
    public courtService: CourtService,
    private sportService: SportService,
    public authService: AuthService,
    private bookingService: BookingService,
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
    this.loading = true;
    this.courtService.getAllCourts({
      sport: this.selectedSport || undefined,
      surface: this.selectedSurface || undefined,
      minPrice: this.minPrice ?? undefined,
      maxPrice: this.maxPrice ?? undefined,
      city: this.citySearch || undefined,
    }).subscribe({
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
    let result = [...this.courts];

    // Client-side: rating filter
    if (this.minRating > 0) {
      result = result.filter(c => (c.averageRating || 0) >= this.minRating);
    }

    // Sort
    switch (this.sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.pricePerHour || 0) - (b.pricePerHour || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.pricePerHour || 0) - (a.pricePerHour || 0));
        break;
      case 'rating-desc':
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'name-asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
    }

    this.filteredCourts = result;
  }

  onSportChange(): void {
    this.loadCourts();
  }

  onFilterChange(): void {
    this.loadCourts();
  }

  onClientFilterChange(): void {
    this.applyFilter();
  }

  resetFilters(): void {
    this.selectedSport = '';
    this.selectedSurface = '';
    this.citySearch = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.minRating = 0;
    this.sortBy = 'default';
    this.loadCourts();
  }

  goToCourtDetail(court: Court): void {
    if (!court._id) return;
    if (court.status === 'pending') return;
    this.router.navigate(['/courts', court._id]);
  }

  getApprovalBadgeClass(court: Court): string {
    return court.status === 'pending' ? 'badge-approval-pending' : '';
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
      case 'open': return '🟢 Open';
      case 'closed': return '🔴 Closed';
      case 'maintenance': return '🟡 Maintenance';
      case 'unavailable': return '⚫ Unavailable';
      default: return 'Open';
    }
  }

  openBookingModal(event: Event, court: Court): void {
    event.stopPropagation();
    this.selectedCourt = court;
    this.showBookingModal = true;
    this.bookingDate = '';
    this.bookingStartTime = '';
    this.bookingEndTime = '';
    this.bookingError = '';
    this.bookingResult = null;
    this.availabilityInfo = null;
    this.bookedSlots = [];    this.repeatEnabled = false;
    this.repeatWeeks = 4;  }

  onDateChange(): void {
    this.bookingStartTime = '';
    this.bookingEndTime = '';
    this.availabilityInfo = null;
    this.bookingError = '';
    this.bookedSlots = [];
    this.blockedSlotsData = [];
    if (this.bookingDate && this.selectedCourt?._id) {
      this.slotsLoading = true;
      this.bookingService.getSlots(this.selectedCourt._id, this.bookingDate).subscribe({
        next: (data) => { this.bookedSlots = data.bookings; this.blockedSlotsData = data.blocked; this.slotsLoading = false; this.cdr.detectChanges(); },
        error: () => { this.slotsLoading = false; this.cdr.detectChanges(); }
      });
    }
  }

  getSlotStatus(slot: { start: string; end: string }): 'available' | 'partial' | 'full' | 'blocked' {
    const isBlocked = this.blockedSlotsData.some(b =>
      !b.startTime || (b.startTime < slot.end && b.endTime! > slot.start)
    );
    if (isBlocked) return 'blocked';
    const total = this.selectedCourt?.numberOfCourts || 1;
    const overlapping = this.bookedSlots.filter(b => b.startTime < slot.end && b.endTime > slot.start).length;
    if (overlapping >= total) return 'full';
    if (overlapping > 0) return 'partial';
    return 'available';
  }

  isSlotSelected(slot: { start: string; end: string }): boolean {
    return !!this.bookingStartTime && !!this.bookingEndTime &&
      slot.start >= this.bookingStartTime && slot.end <= this.bookingEndTime;
  }

  onSlotClick(slot: { start: string; end: string }): void {
    if (this.getSlotStatus(slot) === 'full' || this.getSlotStatus(slot) === 'blocked') return;
    if (!this.bookingStartTime || slot.start <= this.bookingStartTime) {
      this.bookingStartTime = slot.start;
      this.bookingEndTime = slot.end;
    } else {
      this.bookingEndTime = slot.end;
    }
    this.onBookingTimeChange();
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.selectedCourt = null;
  }

  onBookingTimeChange(): void {
    this.availabilityInfo = null;
    this.bookingError = '';
    if (this.bookingDate && this.bookingStartTime && this.bookingEndTime && this.selectedCourt?._id) {
      if (this.bookingStartTime >= this.bookingEndTime) return;
      this.availabilityChecking = true;
      this.bookingService.checkAvailability(this.selectedCourt._id, this.bookingDate, this.bookingStartTime, this.bookingEndTime).subscribe({
        next: (info) => { this.availabilityInfo = info; this.availabilityChecking = false; this.cdr.detectChanges(); },
        error: () => { this.availabilityChecking = false; this.cdr.detectChanges(); }
      });
    }
  }

  submitBooking(): void {
    if (!this.selectedCourt?._id || !this.bookingDate || !this.bookingStartTime || !this.bookingEndTime) {
      this.bookingError = 'Please fill in all fields.';
      return;
    }
    if (this.bookingStartTime >= this.bookingEndTime) {
      this.bookingError = 'Start time must be before end time.';
      return;
    }
    const weeks = this.repeatEnabled ? Math.min(Math.max(this.repeatWeeks, 1), 12) : 1;
    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingService.createBooking(this.selectedCourt._id, this.bookingDate, this.bookingStartTime, this.bookingEndTime, weeks).subscribe({
      next: (result) => { this.bookingLoading = false; this.bookingResult = result; this.cdr.detectChanges(); },
      error: (err) => { this.bookingLoading = false; this.bookingError = err?.error?.error || 'Failed to create booking.'; this.cdr.detectChanges(); }
    });
  }
}
