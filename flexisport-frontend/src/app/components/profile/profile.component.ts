import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SportService } from '../../services/sport.service';
import { Sport, User } from '../../interfaces';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  sports: Sport[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  showSuccessPopup = false;
  successPopupTitle = 'Success';
  successPopupMessage = '';
  userRole = '';
  private loadedProfile: User | null = null;

  constructor(
    private authService: AuthService,
    private sportService: SportService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      preferredSports: [[]],
      personalDescription: ['', [Validators.maxLength(1000)]],
      role: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.loadSports();
    this.loadProfile();
  }

  loadSports(): void {
    this.sportService.getSports().subscribe({
      next: (sports) => {
        this.sports = sports || [];
        if (this.loadedProfile) {
          this.bindUserToForm(this.loadedProfile);
        }
        this.cdr.detectChanges();
      }
    });
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.getMyProfile().subscribe({
      next: (user) => {
        this.loadedProfile = user;
        this.bindUserToForm(user);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to load profile.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.saving) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      fullName: (this.profileForm.get('fullName')?.value || '').trim(),
      username: (this.profileForm.get('username')?.value || '').trim(),
      email: (this.profileForm.get('email')?.value || '').trim(),
      preferredSports: this.profileForm.get('preferredSports')?.value || [],
      personalDescription: (this.profileForm.get('personalDescription')?.value || '').trim()
    };

    this.authService.updateMyProfile(payload).subscribe({
      next: (updated) => {
        this.bindUserToForm(updated);
        this.saving = false;
        this.successMessage = 'Profile updated successfully.';
        this.openSuccessPopup('Profile Updated', 'Your profile changes were saved successfully.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = err.error?.error || 'Failed to update profile.';
        this.cdr.detectChanges();
      }
    });
  }

  private bindUserToForm(user: User): void {
    this.loadedProfile = user;
    this.userRole = user.role;
    this.profileForm.patchValue({
      fullName: user.fullName || '',
      username: user.username || '',
      email: user.email || '',
      preferredSports: user.preferredSports || [],
      personalDescription: user.personalDescription || '',
      role: user.role || ''
    });
  }

  getGamesForSport(slug: string): number {
    return this.loadedProfile?.gamesPlayedBySport?.[slug] || 0;
  }

  togglePreferredSport(slug: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current: string[] = this.profileForm.get('preferredSports')?.value || [];
    if (checked) {
      this.profileForm.patchValue({ preferredSports: Array.from(new Set([...current, slug])) });
      return;
    }
    this.profileForm.patchValue({ preferredSports: current.filter((s) => s !== slug) });
  }

  isSportSelected(slug: string): boolean {
    const selected: string[] = this.profileForm.get('preferredSports')?.value || [];
    return selected.includes(slug);
  }

  onSuccessPopupClosed(): void {
    this.showSuccessPopup = false;
  }

  private openSuccessPopup(title: string, message: string): void {
    this.successPopupTitle = title;
    this.successPopupMessage = message;
    this.showSuccessPopup = true;
  }
}
