import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
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
    FeedComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  bootstrap: [App]
})
export class AppModule { }