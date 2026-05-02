import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { HomeComponent } from './components/home/home.component';
import { SupervisorManagementComponent } from './components/supervisor-management/supervisor-management.component';
import { CourtManagementComponent } from './components/court-management/court-management.component';
import { CourtApprovalComponent } from './components/court-approval/court-approval.component';
import { FeedComponent } from './components/feed/feed.component';
import { CourtsComponent } from './components/courts/courts.component';
import { CourtDetailComponent } from './components/court-detail/court-detail.component';
import { PostCreateComponent } from './components/post-create/post-create.component';
import { TournamentManagementComponent } from './components/tournament-management/tournament-management.component';
import { TournamentsComponent } from './components/tournaments/tournaments.component';
import { TournamentDetailComponent } from './components/tournament-detail/tournament-detail.component';
import { ProfileComponent } from './components/profile/profile.component';
import { MyBookingsComponent } from './components/my-bookings/my-bookings.component';
import { CourtBookersComponent } from './components/court-bookers/court-bookers.component';
import { AdminUserManagementComponent } from './components/admin-user-management/admin-user-management.component';
import { AdminAnalyticsComponent } from './components/admin-analytics/admin-analytics.component';
import { ContactComponent } from './components/contact/contact.component';
import { AdminContactInboxComponent } from './components/admin-contact-inbox/admin-contact-inbox.component';
import { SupervisorInboxComponent } from './components/supervisor-inbox/supervisor-inbox.component';
import { SupervisorDashboardComponent } from './components/supervisor-dashboard/supervisor-dashboard.component';
import { authGuard, adminGuard, supervisorOrAdminGuard, ownerGuard } from './guards/auth.guards';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
  { path: 'feed/create', component: PostCreateComponent, canActivate: [supervisorOrAdminGuard] },
  { path: 'courts', component: CourtsComponent },
  { path: 'courts/:id', component: CourtDetailComponent },
  { path: 'tournaments', component: TournamentsComponent },
  { path: 'tournaments/:id', component: TournamentDetailComponent },
  { path: 'admin/supervisors', component: SupervisorManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/courts', component: CourtApprovalComponent, canActivate: [supervisorOrAdminGuard] },
  { path: 'admin/users', component: AdminUserManagementComponent, canActivate: [adminGuard] },
  { path: 'admin/analytics', component: AdminAnalyticsComponent, canActivate: [adminGuard] },
  { path: 'contact', component: ContactComponent },
  { path: 'admin/contact', component: AdminContactInboxComponent, canActivate: [adminGuard] },
  { path: 'supervisor/inbox', component: SupervisorInboxComponent, canActivate: [supervisorOrAdminGuard] },
  { path: 'supervisor/dashboard', component: SupervisorDashboardComponent, canActivate: [supervisorOrAdminGuard] },
  { path: 'my-courts', component: CourtManagementComponent, canActivate: [ownerGuard] },
  { path: 'my-tournaments', component: TournamentManagementComponent, canActivate: [ownerGuard] },
  { path: 'bookings', component: MyBookingsComponent, canActivate: [authGuard] },
  { path: 'court-bookers', component: CourtBookersComponent, canActivate: [ownerGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
];