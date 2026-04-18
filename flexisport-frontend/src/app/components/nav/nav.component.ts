import { ChangeDetectorRef, Component, DoCheck, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationItem } from '../../interfaces';

@Component({
  selector: 'app-nav',
  standalone: false,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent implements OnInit, OnDestroy, DoCheck {
  notifications: NotificationItem[] = [];
  showNotifications = false;
  notificationError = '';

  @ViewChild('notificationWrapper') notificationWrapper?: ElementRef<HTMLElement>;

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private wasLoggedIn = false;

  constructor(
    public authService: AuthService,
    private notificationService: NotificationService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.wasLoggedIn = this.isLoggedIn;
    this.runNotificationPollingCycle();
    this.pollTimer = setInterval(() => this.runNotificationPollingCycle(), 30000);
  }

  ngDoCheck(): void {
    const currentlyLoggedIn = this.isLoggedIn;
    if (currentlyLoggedIn !== this.wasLoggedIn) {
      this.wasLoggedIn = currentlyLoggedIn;
      this.runNotificationPollingCycle();
    }
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  onLogout() {
    this.showNotifications = false;
    this.notifications = [];
    this.notificationError = '';
    this.authService.logout();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showNotifications || !this.notificationWrapper) return;

    const target = event.target as Node | null;
    if (target && !this.notificationWrapper.nativeElement.contains(target)) {
      this.showNotifications = false;
    }
  }

  loadNotifications(): void {
    this.notificationService.getMyNotifications().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.notifications = data || [];
          this.notificationError = '';
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.notificationError = 'Failed to load notifications';
          this.cdr.detectChanges();
        });
      }
    });
  }

  private runNotificationPollingCycle(): void {
    if (!this.isLoggedIn) {
      this.notifications = [];
      this.notificationError = '';
      return;
    }

    this.loadNotifications();
  }

  markNotificationAsRead(notification: NotificationItem): void {
    if (!notification._id) return;
    this.notificationService.markAsRead(notification._id).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n =>
          n._id === notification._id ? { ...n, isRead: true } : n
        );
      }
    });
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
      }
    });
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  public get isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  public get isAdmin() {
    return this.authService.isAdmin();
  }

  public get isOwner() {
    return this.authService.getUserRole() === 'owner';
  }

  public get currentUsername(): string {
    return this.authService.getStoredUser()?.username || '';
  }
}