import { Component } from '@angular/core';
import { MODULES, NOT_INCLUDED, TELEGRAM_URL } from '../../core/site-data';

@Component({
  selector: 'app-course',
  templateUrl: './course.html',
  standalone: false,
})
export class Course {
  protected readonly modules = MODULES;
  protected readonly notIncluded = NOT_INCLUDED;
  protected readonly telegramUrl = TELEGRAM_URL;
  protected readonly lessonCount = MODULES.reduce((n, m) => n + m.lessons.length, 0);

  protected no(i: number): string {
    return String(i + 1).padStart(2, '0');
  }
}
