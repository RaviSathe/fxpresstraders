import { Component } from '@angular/core';
import { RULES, TELEGRAM_URL, WHATSAPP_URL } from '../../core/site-data';

@Component({
  selector: 'app-community',
  templateUrl: './community.html',
  standalone: false,
})
export class Community {
  protected readonly telegramUrl = TELEGRAM_URL;
  protected readonly whatsappUrl = WHATSAPP_URL;
  protected readonly rules = RULES;
  protected readonly next = [
    { title: 'Say hello', body: 'Introduce yourself and tell us which market you want to learn first.' },
    { title: 'Start module one', body: 'Market foundations is pinned at the top. Begin there and go in order.' },
    { title: 'Open a demo account', body: 'Practise everything with pretend money before risking anything real.' },
  ];
}
