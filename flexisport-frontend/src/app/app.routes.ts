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

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'feed', component: FeedComponent },
  { path: 'feed/create', component: PostCreateComponent },
  { path: 'courts', component: CourtsComponent },
  { path: 'courts/:id', component: CourtDetailComponent },
  { path: 'tournaments', component: TournamentsComponent },
  { path: 'tournaments/:id', component: TournamentDetailComponent },
  { path: 'admin/supervisors', component: SupervisorManagementComponent },
  { path: 'admin/courts', component: CourtApprovalComponent },
  { path: 'my-courts', component: CourtManagementComponent },
  { path: 'my-tournaments', component: TournamentManagementComponent },
  { path: 'profile', component: ProfileComponent },
];