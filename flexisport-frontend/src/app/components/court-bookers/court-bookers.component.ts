import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BookerService, BookerEntry } from '../../services/booker.service';
import { Booking } from '../../interfaces';

@Component({
  selector: 'app-court-bookers',
  standalone: false,
  templateUrl: './court-bookers.component.html',
  styleUrl: './court-bookers.component.scss'
})
export class CourtBookersComponent implements OnInit {
  bookers: BookerEntry[] = [];
  loading = true;
  errorMessage = '';

  expandedUserId: string | null = null;
  userBookings: Booking[] = [];
  bookingsLoading = false;

  flagNoteInput: { [userId: string]: string } = {};
  flagging: { [userId: string]: boolean } = {};
  denying: { [userId: string]: boolean } = {};

  constructor(private bookerService: BookerService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.bookerService.getBookers().subscribe({
      next: (data) => { this.bookers = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.errorMessage = 'Failed to load bookers.'; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  toggleUserBookings(userId: string): void {
    if (this.expandedUserId === userId) {
      this.expandedUserId = null;
      this.userBookings = [];
      return;
    }
    this.expandedUserId = userId;
    this.userBookings = [];
    this.bookingsLoading = true;
    this.bookerService.getUserBookings(userId).subscribe({
      next: (data) => { this.userBookings = data; this.bookingsLoading = false; this.cdr.detectChanges(); },
      error: () => { this.bookingsLoading = false; this.cdr.detectChanges(); }
    });
  }

  toggleFlag(booker: BookerEntry): void {
    const uid = booker.user._id;
    this.flagging[uid] = true;

    if (booker.isFlagged) {
      this.bookerService.unflagUser(uid).subscribe({
        next: () => {
          booker.isFlagged = false;
          booker.flagNote = null;
          this.flagging[uid] = false;
          this.cdr.detectChanges();
        },
        error: () => { this.flagging[uid] = false; this.cdr.detectChanges(); }
      });
    } else {
      const note = this.flagNoteInput[uid] || '';
      this.bookerService.flagUser(uid, note).subscribe({
        next: (res) => {
          booker.isFlagged = true;
          booker.flagNote = res.flagNote;
          booker.denyBooking = res.denyBooking;
          this.flagging[uid] = false;
          this.flagNoteInput[uid] = '';
          this.cdr.detectChanges();
        },
        error: () => { this.flagging[uid] = false; this.cdr.detectChanges(); }
      });
    }
  }

  toggleDeny(booker: BookerEntry): void {
    const uid = booker.user._id;
    this.denying[uid] = true;

    if (booker.denyBooking) {
      this.bookerService.undenyUser(uid).subscribe({
        next: () => {
          booker.denyBooking = false;
          this.denying[uid] = false;
          this.cdr.detectChanges();
        },
        error: () => { this.denying[uid] = false; this.cdr.detectChanges(); }
      });
    } else {
      this.bookerService.denyUser(uid).subscribe({
        next: () => {
          booker.denyBooking = true;
          this.denying[uid] = false;
          this.cdr.detectChanges();
        },
        error: () => { this.denying[uid] = false; this.cdr.detectChanges(); }
      });
    }
  }

  getCourtName(court: any): string {
    return typeof court === 'string' ? court : court?.name ?? 'Court';
  }

  calculatePrice(booking: Booking): string {
    if (typeof booking.court === 'string') return '-';
    const [sh, sm] = booking.startTime.split(':').map(Number);
    const [eh, em] = booking.endTime.split(':').map(Number);
    const hours = (eh * 60 + em - sh * 60 - sm) / 60;
    return (hours * (booking.court as any).pricePerHour).toFixed(0);
  }
}
