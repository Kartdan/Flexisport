import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { Booking, Court } from '../../interfaces';

@Component({
  selector: 'app-my-bookings',
  standalone: false,
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.scss'
})
export class MyBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  loading = true;
  errorMessage = '';
  showSuccessPopup = false;
  showErrorPopup = false;
  errorPopupMessage = '';
  cancellingId: string | null = null;

  constructor(private bookingService: BookingService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getMyBookings().subscribe({
      next: (data) => {
        this.bookings = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load bookings.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getCourtName(court: Court | string): string {
    if (typeof court === 'string') return 'Court';
    return court.name;
  }

  getCourtAddress(court: Court | string): string {
    if (typeof court === 'string') return '';
    return court.address;
  }

  calculatePrice(booking: Booking): string {
    if (typeof booking.court === 'string') return '-';
    const [sh, sm] = booking.startTime.split(':').map(Number);
    const [eh, em] = booking.endTime.split(':').map(Number);
    const hours = (eh * 60 + em - sh * 60 - sm) / 60;
    return (hours * booking.court.pricePerHour).toFixed(0);
  }

  cancelBooking(booking: Booking): void {
    if (!booking._id) return;
    this.cancellingId = booking._id;
    this.bookingService.cancelBooking(booking._id).subscribe({
      next: () => {
        this.bookings = this.bookings.filter(b => b._id !== booking._id);
        this.cancellingId = null;
        this.showSuccessPopup = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cancellingId = null;
        this.errorPopupMessage = err?.error?.error || 'Failed to cancel booking. Please try again.';
        this.showErrorPopup = true;
        this.cdr.detectChanges();
      }
    });
  }
}
