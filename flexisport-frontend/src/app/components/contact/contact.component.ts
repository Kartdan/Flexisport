import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ContactService, ContactSupervisor } from '../../services/contact.service';

@Component({
  selector: 'app-contact',
  standalone: false,
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  supervisors: ContactSupervisor[] = [];
  supervisorsLoading = true;
  selectedSupervisor: ContactSupervisor | null = null;

  form: FormGroup;
  sending = false;
  sent = false;
  sentToName = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private contactService: ContactService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(3)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]]
    });
  }

  ngOnInit(): void {
    // Pre-fill name + email if logged in
    const user = this.authService.getStoredUser();
    if (user) {
      this.form.patchValue({ name: user.fullName, email: user.email });
    }
    this.contactService.getSupervisors().subscribe({
      next: (data) => { this.supervisors = data; this.supervisorsLoading = false; this.cdr.detectChanges(); },
      error: () => { this.supervisorsLoading = false; this.cdr.detectChanges(); }
    });
  }

  selectSupervisor(sup: ContactSupervisor): void {
    this.selectedSupervisor = sup;
    this.errorMessage = '';
    this.cdr.detectChanges();
    // Scroll to form section smoothly
    setTimeout(() => {
      document.getElementById('contact-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  send(): void {
    if (this.form.invalid || this.sending) { this.form.markAllAsTouched(); return; }
    if (!this.selectedSupervisor) {
      this.errorMessage = 'Please select a supervisor above to send the message to.';
      return;
    }
    this.sending = true;
    this.errorMessage = '';
    this.sentToName = this.selectedSupervisor.fullName;
    const payload = { ...this.form.value, recipientId: this.selectedSupervisor._id };
    this.contactService.sendMessage(payload).subscribe({
      next: () => { this.sent = true; this.sending = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to send message. Please try again.';
        this.sending = false;
        this.cdr.detectChanges();
      }
    });
  }

  getAvatarUrl(avatar?: string): string {
    return this.authService.getAvatarUrl(avatar);
  }

  getSportEmojis(sports?: string[]): string {
    const map: Record<string, string> = {
      football: '⚽', basketball: '🏀', tennis: '🎾',
      handball: '🤾', volleyball: '🏐', padel: '🏸'
    };
    return (sports || []).map(s => map[s] || s).join(' ');
  }
}
