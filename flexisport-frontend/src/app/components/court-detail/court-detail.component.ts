import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourtService } from '../../services/court.service';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { Court, BookingResult } from '../../interfaces';

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

  // Booking modal state
  showBookingModal = false;
  bookingDate = '';
  bookingStartTime = '';
  bookingEndTime = '';
  bookingError = '';
  bookingResult: BookingResult | null = null;
  bookingLoading = false;
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

  constructor(
    public courtService: CourtService,
    private bookingService: BookingService,
    public authService: AuthService,
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

  openBookingModal(): void {
    this.showBookingModal = true;
    this.bookingDate = '';
    this.bookingStartTime = '';
    this.bookingEndTime = '';
    this.bookingError = '';
    this.bookingResult = null;
    this.availabilityInfo = null;
    this.bookedSlots = [];
    this.blockedSlotsData = [];
    this.repeatEnabled = false;
    this.repeatWeeks = 4;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
  }

  onDateChange(): void {
    this.bookingStartTime = '';
    this.bookingEndTime = '';
    this.availabilityInfo = null;
    this.bookingError = '';
    this.bookedSlots = [];
    this.blockedSlotsData = [];
    if (this.bookingDate && this.court?._id) {
      this.slotsLoading = true;
      this.bookingService.getSlots(this.court._id, this.bookingDate).subscribe({
        next: (data) => { this.bookedSlots = data.bookings; this.blockedSlotsData = data.blocked; this.slotsLoading = false; this.cdr.detectChanges(); },
        error: () => { this.slotsLoading = false; this.cdr.detectChanges(); }
      });
    }
  }

  onBookingTimeChange(): void {
    this.availabilityInfo = null;
    this.bookingError = '';
    if (this.bookingDate && this.bookingStartTime && this.bookingEndTime && this.court?._id) {
      if (this.bookingStartTime >= this.bookingEndTime) return;
      this.availabilityChecking = true;
      this.bookingService.checkAvailability(this.court._id, this.bookingDate, this.bookingStartTime, this.bookingEndTime).subscribe({
        next: (info) => {
          this.availabilityInfo = info;
          this.availabilityChecking = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.availabilityChecking = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

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

  getSlotStatus(slot: { start: string; end: string }): 'available' | 'partial' | 'full' | 'blocked' {
    const isBlocked = this.blockedSlotsData.some(b =>
      !b.startTime || (b.startTime < slot.end && b.endTime! > slot.start)
    );
    if (isBlocked) return 'blocked';
    const total = this.court?.numberOfCourts || 1;
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
    return this.getBookingHours() * (this.court?.pricePerHour || 0) * count;
  }

  submitBooking(): void {
    if (!this.court?._id || !this.bookingDate || !this.bookingStartTime || !this.bookingEndTime) {
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
    this.bookingService.createBooking(this.court._id, this.bookingDate, this.bookingStartTime, this.bookingEndTime, weeks).subscribe({
      next: (result) => {
        this.bookingLoading = false;
        this.bookingResult = result;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.bookingLoading = false;
        this.bookingError = err?.error?.error || 'Failed to create booking.';
        this.cdr.detectChanges();
      }
    });
  }

}
