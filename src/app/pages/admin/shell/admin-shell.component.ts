import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GumiApiService } from '../../../services/gumi-api.service';

interface LoginForm {
  email: string;
  password: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss'
})
export class AdminShellComponent implements OnInit {
  private readonly api = inject(GumiApiService);
  private readonly router = inject(Router);

  readonly companyName = 'Duna Gumi Szerviz';

  login: LoginForm = { email: '', password: '' };
  loggedIn = false;
  adminAllowed = false;
  loading = true;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    await this.checkSession();
  }

  async signIn(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      await this.api.signIn(this.login.email, this.login.password);
      this.loggedIn = true;
      this.adminAllowed = await this.api.isAdmin();

      if (!this.adminAllowed) {
        this.errorMessage = 'Sikeres belépés, de ez a felhasználó nincs admin jogosultsággal felvéve az admin_users táblába.';
        return;
      }

      await this.router.navigate(['/admin/foglalasok']);
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  async signOut(): Promise<void> {
    await this.api.signOut();
    this.loggedIn = false;
    this.adminAllowed = false;
    this.login = { email: '', password: '' };
    await this.router.navigate(['/admin']);
  }

  private async checkSession(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      this.loggedIn = await this.api.isLoggedIn();
      this.adminAllowed = this.loggedIn ? await this.api.isAdmin() : false;
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Ismeretlen hiba történt.';
  }
}
