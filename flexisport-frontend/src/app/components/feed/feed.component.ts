import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';
import { Post } from '../../interfaces';

@Component({
  selector: 'app-feed',
  standalone: false,
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.scss'
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load posts.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  postTypeLabel(type: string): string {
    switch (type) {
      case 'court_published': return '🏟️ New Court';
      case 'status_update': return '🔔 Status Update';
      default: return '📢 Announcement';
    }
  }

  timeAgo(date: Date | undefined): string {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  goToCreatePost(): void {
    this.router.navigate(['/feed/create']);
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isSupervisor(): boolean {
    return this.authService.getUserRole() === 'supervisor';
  }

  get canCreatePost(): boolean {
    return this.isAdmin || this.isSupervisor;
  }

  canDeletePost(post: Post): boolean {
    if (this.isAdmin || this.isSupervisor) return true;
    const user = this.authService.getStoredUser();
    return !!(user && (post as any).authorRef === (user._id || user.id));
  }

  deletePost(post: Post): void {
    if (!confirm('Delete this post?')) return;
    this.postService.deletePost((post as any)._id).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => (p as any)._id !== (post as any)._id);
        this.cdr.detectChanges();
      },
      error: () => { this.errorMessage = 'Failed to delete post.'; this.cdr.detectChanges(); }
    });
  }
}
