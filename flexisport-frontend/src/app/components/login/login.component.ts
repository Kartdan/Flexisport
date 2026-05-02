import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  supervisorPending = false;
  supervisorRejected = false;

  popup: { visible: boolean; type: 'error' | 'warning' | 'info'; title: string; message: string } = {
    visible: false, type: 'warning', title: '', message: ''
  };

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.errorMessage = '';
      this.supervisorPending = false;
      this.supervisorRejected = false;
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (err) => {
          const msg: string = err.error?.error || '';
          if (msg.includes('pending')) {
            this.supervisorPending = true;
            this.popup = {
              visible: true,
              type: 'warning',
              title: 'Account Pending Approval',
              message: 'Your supervisor account is awaiting administrator approval. You will be able to log in once it has been accepted.'
            };
          } else if (msg.includes('rejected')) {
            this.supervisorRejected = true;
            this.popup = {
              visible: true,
              type: 'error',
              title: 'Account Rejected',
              message: 'Your supervisor account has been rejected by an administrator. Please contact support for more information.'
            };
          } else {
            this.errorMessage = msg || 'Login failed. Please try again.';
          }
        }
      });
    }
  }

  closePopup(): void {
    this.popup = { ...this.popup, visible: false };
  }
}