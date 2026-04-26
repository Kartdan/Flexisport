import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User, UserRole } from '../../interfaces';

@Component({
  selector: 'app-admin-user-management',
  standalone: false,
  templateUrl: './admin-user-management.component.html',
  styleUrl: './admin-user-management.component.scss'
})
export class AdminUserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  searchQuery = '';
  filterRole = '';
  readonly roles = ['', 'player', 'owner', 'supervisor', 'admin'];
  readonly UserRole = UserRole;

  // For inline role editing
  editingRoleUserId: string | null = null;
  pendingRole = '';

  currentAdminId: string | null = null;

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const me = this.authService.getStoredUser();
    this.currentAdminId = me?._id || me?.id || null;
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    const filters: { role?: string; search?: string } = {};
    if (this.filterRole) filters.role = this.filterRole;
    if (this.searchQuery.trim()) filters.search = this.searchQuery.trim();

    this.authService.getAllUsers(filters).subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to load users.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isSelf(user: User): boolean {
    const uid = user._id || user.id;
    return uid === this.currentAdminId;
  }

  startEditRole(user: User): void {
    this.editingRoleUserId = user._id || user.id || null;
    this.pendingRole = user.role;
  }

  cancelEditRole(): void {
    this.editingRoleUserId = null;
    this.pendingRole = '';
  }

  saveRole(user: User): void {
    if (!this.pendingRole || this.pendingRole === user.role) {
      this.cancelEditRole();
      return;
    }
    const uid = user._id || user.id!;
    this.authService.changeUserRole(uid, this.pendingRole).subscribe({
      next: (updated) => {
        this.replaceUser(updated);
        this.showSuccess(`Role updated to "${this.pendingRole}" for ${user.fullName}.`);
        this.editingRoleUserId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to change role.';
        this.editingRoleUserId = null;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSuspend(user: User): void {
    const uid = user._id || user.id!;
    const nextSuspended = !user.suspended;
    this.authService.setUserSuspended(uid, nextSuspended).subscribe({
      next: (updated) => {
        this.replaceUser(updated);
        this.showSuccess(`${user.fullName} has been ${nextSuspended ? 'suspended' : 'unsuspended'}.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to update suspension.';
        this.cdr.detectChanges();
      }
    });
  }

  private replaceUser(updated: User): void {
    const updatedId = updated._id || updated.id;
    const idx = this.users.findIndex(u => (u._id || u.id) === updatedId);
    if (idx !== -1) {
      const list = [...this.users];
      list[idx] = updated;
      this.users = list;
    }
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    this.errorMessage = '';
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3500);
  }

  getRoleBadgeClass(role: string): string {
    return 'role-badge role-' + role;
  }
}
