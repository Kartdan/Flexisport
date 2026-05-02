import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ContactService, ContactMessage } from '../../services/contact.service';

@Component({
  selector: 'app-admin-contact-inbox',
  standalone: false,
  templateUrl: './admin-contact-inbox.component.html',
  styleUrls: ['./admin-contact-inbox.component.scss']
})
export class AdminContactInboxComponent implements OnInit {
  messages: ContactMessage[] = [];
  loading = true;
  errorMessage = '';
  selected: ContactMessage | null = null;
  filterUnread = false;

  constructor(private contactService: ContactService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.contactService.getMessages().subscribe({
      next: (data) => { this.messages = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.errorMessage = 'Failed to load messages.'; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  get displayed(): ContactMessage[] {
    return this.filterUnread ? this.messages.filter(m => !m.read) : this.messages;
  }

  get unreadCount(): number { return this.messages.filter(m => !m.read).length; }

  open(msg: ContactMessage): void {
    this.selected = msg;
    if (!msg.read) this.toggleRead(msg, true);
  }

  close(): void { this.selected = null; }

  toggleRead(msg: ContactMessage, forceRead?: boolean): void {
    const newVal = forceRead !== undefined ? forceRead : !msg.read;
    this.contactService.markRead(msg._id, newVal).subscribe({
      next: (updated) => {
        const idx = this.messages.findIndex(m => m._id === updated._id);
        if (idx !== -1) this.messages[idx] = updated;
        if (this.selected?._id === updated._id) this.selected = updated;
        this.cdr.detectChanges();
      }
    });
  }

  delete(msg: ContactMessage): void {
    if (!confirm(`Delete message from ${msg.name}?`)) return;
    this.contactService.deleteMessage(msg._id).subscribe({
      next: () => {
        this.messages = this.messages.filter(m => m._id !== msg._id);
        if (this.selected?._id === msg._id) this.selected = null;
        this.cdr.detectChanges();
      },
      error: () => { this.errorMessage = 'Failed to delete message.'; this.cdr.detectChanges(); }
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString();
  }
}
