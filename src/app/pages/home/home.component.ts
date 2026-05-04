import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServicePrice } from '../../models/service-price.model';
import { GumiApiService } from '../../services/gumi-api.service';

interface OpeningHour {
  day: string;
  hours: string;
  closed?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly api = inject(GumiApiService);

  readonly companyName = 'Duna Gumi Szerviz';
  readonly phoneNumber = '+36 30 123 4567';
  readonly email = 'info@dunagumi.hu';
  readonly address = '2310 Szigetszentmiklós, Példa utca 12.';

  prices: ServicePrice[] = this.getFallbackPrices();
  priceLoadWarning = '';

  readonly openingHours: OpeningHour[] = [
    { day: 'Hétfő', hours: '08:00 – 17:00' },
    { day: 'Kedd', hours: '08:00 – 17:00' },
    { day: 'Szerda', hours: '08:00 – 17:00' },
    { day: 'Csütörtök', hours: '08:00 – 17:00' },
    { day: 'Péntek', hours: '08:00 – 16:00' },
    { day: 'Szombat', hours: '09:00 – 13:00' },
    { day: 'Vasárnap', hours: 'Zárva', closed: true }
  ];

  async ngOnInit(): Promise<void> {
    try {
      const prices = await this.api.getActivePrices();
      if (prices.length > 0) {
        this.prices = prices;
      }
    } catch {
      this.priceLoadWarning = 'A Supabase árlista még nincs beállítva, ezért a demo árak látszanak.';
    }
  }

  formatPrice(price: ServicePrice): string {
    return `${price.price_amount.toLocaleString('hu-HU')} ${price.price_suffix}`;
  }

  private getFallbackPrices(): ServicePrice[] {
    return [
      {
        id: 'demo-1',
        name: 'Kerékcsere hozott kerékszettel',
        description: 'Szezonális kerékcsere személyautóra, alap ellenőrzéssel.',
        price_amount: 12000,
        price_suffix: 'Ft-tól',
        display_order: 1,
        duration_minutes: 30,
        is_highlighted: false,
        is_active: true
      },
      {
        id: 'demo-2',
        name: 'Gumicsere + centrírozás',
        description: 'Abroncs le- és felszerelés, centrírozás, szelep ellenőrzése.',
        price_amount: 18000,
        price_suffix: 'Ft-tól',
        display_order: 2,
        duration_minutes: 45,
        is_highlighted: true,
        is_active: true
      },
      {
        id: 'demo-3',
        name: 'Defektjavítás',
        description: 'Sérülésvizsgálat, javítás javítható abroncs esetén.',
        price_amount: 6000,
        price_suffix: 'Ft-tól',
        display_order: 3,
        duration_minutes: 30,
        is_highlighted: false,
        is_active: true
      },
      {
        id: 'demo-4',
        name: 'TPMS szelep kezelés',
        description: 'TPMS ellenőrzés, szelepcsere és alap programozási segítség.',
        price_amount: 8000,
        price_suffix: 'Ft-tól',
        display_order: 4,
        duration_minutes: 30,
        is_highlighted: false,
        is_active: true
      }
    ];
  }
}
