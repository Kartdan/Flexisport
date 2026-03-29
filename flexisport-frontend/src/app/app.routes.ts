import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { HomeComponent } from './components/home/home.component';
import { SupervisorManagementComponent } from './components/supervisor-management/supervisor-management.component';
import { CourtManagementComponent } from './components/court-management/court-management.component';
import { CourtApprovalComponent } from './components/court-approval/court-approval.component';
import { FeedComponent } from './components/feed/feed.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'feed', component: FeedComponent },
  { path: 'admin/supervisors', component: SupervisorManagementComponent },
  { path: 'admin/courts', component: CourtApprovalComponent },
  { path: 'my-courts', component: CourtManagementComponent },
];