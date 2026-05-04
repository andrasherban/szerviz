import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServicePrice, ServicePriceUpsert } from '../../../models/service-price.model';
import { GumiApiService } from '../../../services/gumi-api.service';

@Component({
  selector: 'app-admin-prices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-prices.component.html',
  styleUrl: './admin-prices.component.scss'
})
export class AdminPricesComponent implements OnInit {
  private readonly api = inject(GumiApiService);

  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  prices: ServicePrice[] = [];
  newPrice: ServicePriceUpsert = this.createEmptyPrice();

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      this.prices = await this.api.getAllPricesForAdmin();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.loading = false;
    }
  }

  async savePrice(price: ServicePrice): Promise<void> {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.api.updatePrice(price.id, this.toPriceUpsert(price));
      this.successMessage = 'Ár frissítve.';
      await this.refresh();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.saving = false;
    }
  }

  async createPrice(): Promise<void> {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.api.createPrice(this.newPrice);
      this.successMessage = 'Új árlista elem létrehozva.';
      this.newPrice = this.createEmptyPrice();
      await this.refresh();
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.saving = false;
    }
  }

  formatPrice(price: ServicePrice | ServicePriceUpsert): string {
    return `${Number(price.price_amount).toLocaleString('hu-HU')} ${price.price_suffix}`;
  }

  private toPriceUpsert(price: ServicePrice): ServicePriceUpsert {
    return {
      name: price.name,
      description: price.description,
      price_amount: Number(price.price_amount),
      price_suffix: price.price_suffix,
      display_order: Number(price.display_order),
      duration_minutes: Number(price.duration_minutes),
      is_highlighted: price.is_highlighted,
      is_active: price.is_active
    };
  }

  private createEmptyPrice(): ServicePriceUpsert {
    return {
      name: '',
      description: '',
      price_amount: 0,
      price_suffix: 'Ft-tól',
      display_order: 99,
      duration_minutes: 30,
      is_highlighted: false,
      is_active: true
    };
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Ismeretlen hiba történt.';
  }
}
