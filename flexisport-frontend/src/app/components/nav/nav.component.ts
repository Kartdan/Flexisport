import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: false,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  constructor(public authService: AuthService) {}

  onLogout() {
    this.authService.logout();
  }

  public get isLoggedIn() {
    return this.authService.isLoggedIn();
  }
}