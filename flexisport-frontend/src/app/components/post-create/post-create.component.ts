import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { CourtService } from '../../services/court.service';
import { AuthService } from '../../services/auth.service';
import { Court } from '../../interfaces';

@Component({
  selector: 'app-post-create',
  standalone: false,
  templateUrl: './post-create.component.html',
  styleUrl: './post-create.component.scss'
})
export class PostCreateComponent implements OnInit {
  postForm!: FormGroup;
  courts: Court[] = [];
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private courtService: CourtService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCourts();
  }

  initializeForm(): void {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      courtRef: ['']
    });
  }

  loadCourts(): void {
    this.courtService.getAllCourts().subscribe({
      next: (data) => {
        this.courts = data;
        this.cdr.detectChanges();
      },
      error: () => {
        console.error('Failed to load courts');
      }
    });
  }

  onSubmit(): void {
    if (this.postForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const post: Partial<any> = {
      title: this.postForm.get('title')?.value,
      content: this.postForm.get('content')?.value,
      courtRef: this.postForm.get('courtRef')?.value || null,
      postType: 'manual' as const,
      authorName: this.authService.getStoredUser()?.fullName || 'Anonymous'
    };

    this.postService.createPost(post).subscribe({
      next: (data) => {
        this.loading = false;
        this.successMessage = 'Post created successfully!';
        this.postForm.reset();
        this.cdr.detectChanges();

        // Redirect to feed after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/feed']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Failed to create post.';
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/feed']);
  }

  get titleControl() {
    return this.postForm.get('title');
  }

  get contentControl() {
    return this.postForm.get('content');
  }
}
