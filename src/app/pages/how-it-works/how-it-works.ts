import { Component } from '@angular/core';
import { COMMUNITY_PERKS, FAQS, STEPS } from '../../core/site-data';

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.html',
  standalone: false,
})
export class HowItWorks {
  protected readonly steps = STEPS;
  protected readonly perks = COMMUNITY_PERKS;
  protected readonly faqs = FAQS;
}
