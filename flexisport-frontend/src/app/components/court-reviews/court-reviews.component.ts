import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { Review, ReviewSummary } from '../../interfaces';

@Component({
  selector: 'app-court-reviews',
  standalone: false,
  templateUrl: './court-reviews.component.html',
  styleUrl: './court-reviews.component.scss'
})
export class CourtReviewsComponent implements OnInit {
  @Input() courtId!: string;

  reviews: Review[] = [];
  summary: ReviewSummary = { averageRating: 0, totalReviews: 0 };
  reviewForm: FormGroup;
  isLoggedIn = false;
  errorMessage = '';
  showSuccessPopup = false;
  successPopupTitle = 'Success';
  successPopupMessage = '';

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.loadReviews();
    this.loadSummary();
  }

  loadReviews(): void {
    this.reviewService.getReviewsForCourt(this.courtId).subscribe({
      next: (data) => { this.reviews = data || []; this.cdr.detectChanges(); },
      error: () => this.errorMessage = 'Failed to load reviews.'
    });
  }

  loadSummary(): void {
    this.reviewService.getReviewSummary(this.courtId).subscribe({
      next: (data) => { this.summary = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  submitReview(): void {
    if (!this.reviewForm.valid) return;
    const { rating, comment } = this.reviewForm.value;
    const trimmedComment = (comment || '').trim();

    if (!trimmedComment) {
      this.errorMessage = 'Please enter review text.';
      return;
    }

    this.reviewService.submitReview(this.courtId, rating, trimmedComment).subscribe({
      next: () => {
        this.reviewForm.reset({ rating: 5, comment: '' });
        this.errorMessage = '';
        this.openSuccessPopup('Review Submitted', 'Your review was submitted successfully.');
        this.loadReviews();
        this.loadSummary();
      },
      error: () => this.errorMessage = 'Failed to submit review.'
    });
  }

  onSuccessPopupClosed(): void {
    this.showSuccessPopup = false;
  }

  private openSuccessPopup(title: string, message: string): void {
    this.successPopupTitle = title;
    this.successPopupMessage = message;
    this.showSuccessPopup = true;
  }

  deleteReview(review: Review): void {
    this.reviewService.deleteReview(review._id!).subscribe({
      next: () => { this.loadReviews(); this.loadSummary(); },
      error: () => this.errorMessage = 'Failed to delete review.'
    });
  }

  get canModerateReviews(): boolean {
    const role = this.authService.getUserRole();
    return role === 'admin' || role === 'supervisor';
  }

  isOwnReview(review: Review): boolean {
    const user = this.authService.getStoredUser();
    if (!user || !review.author) return false;
    const authorId = typeof review.author === 'string' ? review.author : (review.author as any)._id;
    return authorId === (user._id || user.id);
  }

  get hasOwnReview(): boolean {
    return this.reviews.some((review) => this.isOwnReview(review));
  }

  getAuthorName(review: Review): string {
    if (!review.author) return 'Anonymous';
    if (typeof review.author === 'string') return review.author;
    return review.author.fullName || review.author.username || 'Anonymous';
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getEmptyStars(rating: number): number[] {
    return Array(5 - rating).fill(0);
  }
}
