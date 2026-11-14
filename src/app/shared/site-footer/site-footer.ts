import { Component } from '@angular/core';
import { NAV_LINKS, TELEGRAM_URL, WHATSAPP_URL } from '../../core/site-data';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.html',
  standalone: false,
})
export class SiteFooter {
  protected readonly links = NAV_LINKS;
  protected readonly telegramUrl = TELEGRAM_URL;
  protected readonly whatsappUrl = WHATSAPP_URL;
  protected readonly year = new Date().getFullYear();
}
