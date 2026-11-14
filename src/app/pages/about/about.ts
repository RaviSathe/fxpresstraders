import { Component } from '@angular/core';
import { MENTOR, PRINCIPLES } from '../../core/site-data';

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  standalone: false,
})
export class About {
  protected readonly principles = PRINCIPLES;
  protected readonly mentor = MENTOR;
  protected readonly initials = MENTOR.name
    .split(' ')
    .map((p) => p[0])
    .join('');
}
