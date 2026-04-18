import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourtService } from '../../services/court.service';
import { SportService } from '../../services/sport.service';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Court, Sport } from '../../interfaces';
import { PostDialogData } from '../../interfaces';

@Component({
  selector: 'app-court-management',
  standalone: false,
  templateUrl: './court-management.component.html',
  styleUrl: './court-management.component.scss'
})
export class CourtManagementComponent implements OnInit {
  courts: Court[] = [];
  sports: Sport[] = [];
  courtForm: FormGroup;
  editingCourt: Court | null = null;
  showForm = false;
  errorMessage = '';
  successMessage = '';
  selectedPhotos: File[] = [];
  selectedPhotoPreviews: string[] = [];
  existingPhotos: string[] = [];
  removingPhoto = false;
  showDetailPreview = false;
  previewPhotoIndex = 0;

  showPostDialog = false;
  postDialogTitle = '';
  postDialogContent = '';
  private pendingPostType: 'court_published' | 'status_update' = 'court_published';
  private pendingCourtId: string | null = null;

  private originalOperationalStatus = 'open';

  surfaceTypes = ['grass', 'clay', 'synthetic', 'hardcourt', 'indoor', 'sand', 'parquet', 'other'];
  facilityOptions = ['parking', 'showers', 'lighting', 'locker_rooms', 'wifi', 'cafeteria', 'equipment_rental'];
  operationalStatuses = [
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
    { value: 'maintenance', label: 'Under Maintenance' },
    { value: 'unavailable', label: 'Unavailable' }
  ];
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  constructor(
    private courtService: CourtService,
    private sportService: SportService,
    private postService: PostService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.courtForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCourts();
    this.loadSports();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      sportCategories: [[], Validators.required],
      numberOfCourts: [1, [Validators.required, Validators.min(1)]],
      address: ['', Validators.required],
      description: [''],
      phone: [''],
      pricePerHour: [0, [Validators.required, Validators.min(0)]],
      surfaceType: ['other'],
      facilities: [[]],
      operationalStatus: ['open'],
      scheduleStart: ['08:00'],
      scheduleEnd: ['22:00']
    });
  }

  loadCourts(): void {
    this.courtService.getMyCourts().subscribe({
      next: (data) => {
        this.courts = data || [];
        this.cdr.detectChanges();
      },
      error: () => this.errorMessage = 'Failed to load courts.'
    });
  }

  loadSports(): void {
    this.sportService.getSports().subscribe({
      next: (data) => {
        this.sports = data || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  openNewForm(): void {
    this.editingCourt = null;
    this.courtForm = this.createForm();
    this.selectedPhotos = [];
    this.selectedPhotoPreviews = [];
    this.existingPhotos = [];
    this.showDetailPreview = false;
    this.previewPhotoIndex = 0;
    this.showForm = true;
  }

  editCourt(court: Court): void {
    this.editingCourt = court;
    this.originalOperationalStatus = court.operationalStatus || 'open';
    this.existingPhotos = [...(court.photos || [])];
    this.courtForm.patchValue({
      name: court.name,
      sportCategories: court.sportCategories,
      numberOfCourts: court.numberOfCourts,
      address: court.address,
      description: court.description,
      phone: court.phone,
      pricePerHour: court.pricePerHour,
      surfaceType: court.surfaceType,
      facilities: court.facilities,
      operationalStatus: court.operationalStatus || 'open',
      scheduleStart: court.schedules?.[0]?.startTime || '08:00',
      scheduleEnd: court.schedules?.[0]?.endTime || '22:00'
    });
    this.selectedPhotos = [];
    this.selectedPhotoPreviews = [];
    this.showDetailPreview = false;
    this.previewPhotoIndex = 0;
    this.showForm = true;
    this.cdr.detectChanges();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingCourt = null;
    this.selectedPhotoPreviews = [];
    this.existingPhotos = [];
    this.showDetailPreview = false;
    this.previewPhotoIndex = 0;
  }

  removeExistingPhoto(photo: string): void {
    if (!this.editingCourt?._id) return;
    this.removingPhoto = true;
    this.courtService.deletePhoto(this.editingCourt._id, photo).subscribe({
      next: (updated) => {
        this.existingPhotos = updated.photos || [];
        const idx = this.courts.findIndex(c => c._id === updated._id);
        if (idx !== -1) this.courts[idx] = updated;
        this.previewPhotoIndex = Math.min(this.previewPhotoIndex, Math.max(this.previewPhotos.length - 1, 0));
        this.removingPhoto = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to remove photo.';
        this.removingPhoto = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      const combined = [...this.selectedPhotos, ...newFiles];
      const seen = new Set<string>();
      this.selectedPhotos = combined.filter(f => {
        const key = `${f.name}-${f.size}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 10);
      void this.refreshSelectedPhotoPreviews();
      input.value = '';
    }
  }

  removeSelectedPhoto(index: number): void {
    this.selectedPhotos = this.selectedPhotos.filter((_, i) => i !== index);
    this.selectedPhotoPreviews = this.selectedPhotoPreviews.filter((_, i) => i !== index);
    this.previewPhotoIndex = Math.min(this.previewPhotoIndex, Math.max(this.previewPhotos.length - 1, 0));
  }

  onFacilityToggle(facility: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current: string[] = this.courtForm.value.facilities || [];
    if (checked) {
      this.courtForm.patchValue({ facilities: [...current, facility] });
    } else {
      this.courtForm.patchValue({ facilities: current.filter(f => f !== facility) });
    }
  }

  onSportToggle(slug: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current: string[] = this.courtForm.value.sportCategories || [];
    if (checked) {
      this.courtForm.patchValue({ sportCategories: [...current, slug] });
    } else {
      this.courtForm.patchValue({ sportCategories: current.filter(s => s !== slug) });
    }
  }

  saveCourt(): void {
    if (!this.courtForm.valid) return;

    const val = this.courtForm.value;
    const courtData: Partial<Court> = {
      name: val.name,
      sportCategories: val.sportCategories,
      numberOfCourts: val.numberOfCourts,
      address: val.address,
      description: val.description,
      phone: val.phone,
      pricePerHour: val.pricePerHour,
      surfaceType: val.surfaceType,
      facilities: val.facilities,
      operationalStatus: val.operationalStatus,
      schedules: this.days.map(day => ({
        day,
        startTime: val.scheduleStart,
        endTime: val.scheduleEnd
      }))
    };

    const isNew = !this.editingCourt;
    const operationalStatusChanged =
      !isNew && this.courtForm.value.operationalStatus !== this.originalOperationalStatus;

    const save$ = this.editingCourt
      ? this.courtService.updateCourt(this.editingCourt._id!, courtData)
      : this.courtService.createCourt(courtData);

    save$.subscribe({
      next: (saved) => {
        const afterPhotos = () => {
          this.showForm = false;
          this.editingCourt = null;
          this.existingPhotos = [];
          this.loadCourts();

          if (isNew) {
            this.triggerPostDialog('court_published', saved);
          } else if (operationalStatusChanged) {
            this.triggerPostDialog('status_update', saved);
          } else {
            this.successMessage = 'Court updated!';
            setTimeout(() => this.successMessage = '', 3000);
          }
        };

        if (this.selectedPhotos.length > 0) {
          this.courtService.uploadPhotos(saved._id!, this.selectedPhotos).subscribe({
            next: () => afterPhotos(),
            error: () => afterPhotos()
          });
        } else {
          afterPhotos();
        }
      },
      error: () => this.errorMessage = 'Failed to save court.'
    });
  }

  private triggerPostDialog(type: 'court_published' | 'status_update', court: Court): void {
    this.pendingPostType = type;
    this.pendingCourtId = court._id || null;

    if (type === 'court_published') {
      this.postDialogTitle = `New court: ${court.name}`;
      this.postDialogContent =
        `We just listed a new court — ${court.name} at ${court.address}. ` +
        `Sports: ${court.sportCategories.join(', ')}. Price: ${court.pricePerHour} RON/h.`;
    } else {
      const label = this.operationalStatuses.find(s => s.value === court.operationalStatus)?.label || court.operationalStatus;
      this.postDialogTitle = `Status update: ${court.name}`;
      this.postDialogContent = `${court.name} is now ${label}.`;
    }

    this.showPostDialog = true;
    this.cdr.detectChanges();
  }

  onPostDialogConfirmed(data: PostDialogData): void {
    const user = this.authService.getStoredUser();
    this.postService.createPost({
      title: data.title,
      content: data.content,
      authorName: user?.fullName || user?.username || 'Owner',
      courtRef: this.pendingCourtId || undefined,
      postType: this.pendingPostType
    }).subscribe({
      next: () => {
        this.showPostDialog = false;
        this.successMessage = 'Court saved and post published!';
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      },
      error: () => {
        this.showPostDialog = false;
        this.successMessage = 'Court saved (post failed to publish).';
        setTimeout(() => this.successMessage = '', 3000);
        this.cdr.detectChanges();
      }
    });
  }

  onPostDialogCancelled(): void {
    this.showPostDialog = false;
    this.successMessage = 'Court saved.';
    setTimeout(() => this.successMessage = '', 3000);
    this.cdr.detectChanges();
  }

  private afterSave(message: string): void {
    this.successMessage = message;
    this.showForm = false;
    this.editingCourt = null;
    this.loadCourts();
    setTimeout(() => this.successMessage = '', 3000);
  }

  deleteCourt(court: Court): void {
    if (!confirm(`Delete "${court.name}"?`)) return;
    this.courtService.deleteCourt(court._id!).subscribe({
      next: () => {
        this.courts = this.courts.filter(c => c._id !== court._id);
        this.successMessage = 'Court deleted.';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => this.errorMessage = 'Failed to delete court.'
    });
  }

  formatFacility(f: string): string {
    return f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  toggleDetailPreview(): void {
    this.showDetailPreview = !this.showDetailPreview;
  }

  getPreviewDetailStatusLabel(status: string | undefined): string {
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

  getPreviewStatusLabel(status: string | undefined): string {
    return this.operationalStatuses.find(s => s.value === status)?.label || 'Unavailable';
  }

  getPreviewStatusBadgeClass(status: string | undefined): string {
    return `badge-${status || 'unavailable'}`;
  }

  get previewPhoto(): string | null {
    return this.previewPhotos[this.previewPhotoIndex] || null;
  }

  get previewPhotos(): string[] {
    return this.selectedPhotoPreviews.length > 0 ? this.selectedPhotoPreviews : this.existingPhotos;
  }

  nextPreviewPhoto(): void {
    if (this.previewPhotos.length === 0) return;
    this.previewPhotoIndex = (this.previewPhotoIndex + 1) % this.previewPhotos.length;
  }

  previousPreviewPhoto(): void {
    if (this.previewPhotos.length === 0) return;
    this.previewPhotoIndex = (this.previewPhotoIndex - 1 + this.previewPhotos.length) % this.previewPhotos.length;
  }

  private async refreshSelectedPhotoPreviews(): Promise<void> {
    const previews = await Promise.all(
      this.selectedPhotos.map(async (file) => this.readFileAsDataUrl(file))
    );
    this.selectedPhotoPreviews = previews;
    this.previewPhotoIndex = Math.min(this.previewPhotoIndex, Math.max(this.previewPhotos.length - 1, 0));
    this.cdr.detectChanges();
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read file preview'));
      reader.readAsDataURL(file);
    });
  }
}
