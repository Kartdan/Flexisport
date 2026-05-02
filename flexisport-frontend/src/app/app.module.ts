import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { App } from './app';
import { NavComponent } from './components/nav/nav.component';
import { LoginComponent } from './components/login/login.component';
import { routes } from './app.routes';
import { CommonModule } from '@angular/common';
import { SignupComponent } from './components/signup/signup.component';
import { HomeComponent } from './components/home/home.component';
import { SupervisorManagementComponent } from './components/supervisor-management/supervisor-management.component';
import { CourtManagementComponent } from './components/court-management/court-management.component';
import { CourtReviewsComponent } from './components/court-reviews/court-reviews.component';
import { CourtApprovalComponent } from './components/court-approval/court-approval.component';
import { PostDialogComponent } from './components/post-dialog/post-dialog.component';
import { FeedComponent } from './components/feed/feed.component';
import { CourtsComponent } from './components/courts/courts.component';
import { CourtDetailComponent } from './components/court-detail/court-detail.component';
import { PostCreateComponent } from './components/post-create/post-create.component';
import { TournamentManagementComponent } from './components/tournament-management/tournament-management.component';
import { SuccessPopupComponent } from './components/success-popup/success-popup.component';
import { ErrorPopupComponent } from './components/error-popup/error-popup.component';
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

@NgModule({
  declarations: [
    App,
    NavComponent,
    LoginComponent,
    SignupComponent,
    HomeComponent,
    SupervisorManagementComponent,
    CourtManagementComponent,
    CourtReviewsComponent,
    CourtApprovalComponent,
    PostDialogComponent,
    FeedComponent,
    CourtsComponent,
    CourtDetailComponent,
    PostCreateComponent,
    TournamentManagementComponent,
    SuccessPopupComponent,
    ErrorPopupComponent,
    TournamentsComponent,
    TournamentDetailComponent,
    ProfileComponent,
    MyBookingsComponent,
    CourtBookersComponent,
    AdminUserManagementComponent,
    AdminAnalyticsComponent,
    ContactComponent,
    AdminContactInboxComponent,
    SupervisorInboxComponent,
    SupervisorDashboardComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  bootstrap: [App]
})
export class AppModule { }